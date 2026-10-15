import { API, SITE_KEY } from "./config.js";

// A complete private shop website in plain JavaScript: no build step, no database, no server. Wheewise is the backend:
//   GET  /shop, /vehicles, /vehicles/{id}   what to show
//   POST /leads                              enquiries and test-drive requests (they land in the dealer's Leads)

const $ = (s, el = document) => el.querySelector(s);
const view = $("#view");
const inr = (n) => "₹" + Math.round(n).toLocaleString("en-IN");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
// Only http(s) addresses may reach an href or src: a stray javascript: value can never run.
const url = (u) => (/^https?:\/\//i.test(String(u ?? "")) ? esc(u) : "");
const title = (v) => `${v.year} ${v.make} ${v.model}${v.variant ? " " + v.variant : ""}`;

async function call(path, init = {}) {
  const res = await fetch(API + path, { ...init, headers: { "X-Wheewise-Site-Key": SITE_KEY, "Content-Type": "application/json" } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || "Something went wrong. Please try again.");
  return body;
}

// ---- forms -------------------------------------------------------------------------------------------------------

function fields(kind) {
  // `website` is the spam trap: hidden from people, often filled by bots. Leave it empty.
  return `
    <div class="row">
      <label>Your name<input name="name" autocomplete="name" required maxlength="100" /></label>
      <label>Mobile number<input name="phone" type="tel" autocomplete="tel" required inputmode="tel" placeholder="+91 98765 43210" /></label>
    </div>
    <label>Email<input name="email" type="email" autocomplete="email" required /></label>
    ${kind === "TEST_DRIVE" ? `<label>When would you like to drive it?<input name="preferred_at" type="datetime-local" required /></label>` : ""}
    <label>Message (optional)<textarea name="message" rows="3" maxlength="500"></textarea></label>
    <div class="hp" aria-hidden="true"><label>Leave this empty<input name="website" tabindex="-1" autocomplete="off" /></label></div>
    <button class="primary" type="submit">${kind === "TEST_DRIVE" ? "Book a test drive" : "Send enquiry"}</button>`;
}

function wire(form, { kind = "ENQUIRY", vehicleId = null } = {}) {
  const status = $(".status", form);
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.className = "status";
    status.textContent = "";
    if (!form.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form));
    const button = $("button[type=submit]", form);
    button.disabled = true;
    try {
      await call("/leads", {
        method: "POST",
        body: JSON.stringify({
          name: data.name,
          phone: data.phone,
          email: data.email,
          message: data.message || undefined,
          website: data.website || "",
          vehicle_id: vehicleId || undefined,
          kind,
          // The browser gives local time without an offset; an ISO instant is what the API wants.
          preferred_at: kind === "TEST_DRIVE" ? new Date(data.preferred_at).toISOString() : undefined,
        }),
      });
      form.reset();
      status.className = "status ok";
      status.textContent = kind === "TEST_DRIVE" ? "Thank you! We will confirm your test drive shortly." : "Thank you! We will get back to you soon.";
    } catch (err) {
      status.className = "status err";
      status.textContent = err.message;
    } finally {
      button.disabled = false;
    }
  });
}

// ---- pages -------------------------------------------------------------------------------------------------------

let shop = null;

function card(v) {
  return `<a class="card" href="#/vehicle/${esc(v.slug)}">
    <div class="ph">${v.photo_urls?.[0] ? `<img src="${url(v.photo_urls[0])}" alt="${esc(title(v))}" loading="lazy" width="400" height="300" />` : ""}</div>
    <div class="body">
      <h3>${esc(title(v))}</h3>
      <div class="price">${inr(v.asking_price)}</div>
      <div class="meta">${Number(v.odometer_km).toLocaleString("en-IN")} km · ${esc(v.fuel_type?.toLowerCase())} · ${esc(v.city)}</div>
      ${v.finance_available ? `<span class="badge">Finance available</span>` : ""}
    </div></a>`;
}

async function home() {
  document.title = `${shop.name}: pre-owned vehicles`;
  view.innerHTML = `
    <section class="hero"><h1>${esc(shop.name)}</h1><p>${esc(shop.bio ?? "")}</p></section>
    <form class="filters" id="filters" role="search">
      <input type="search" name="q" placeholder="Search make or model" aria-label="Search" />
      <select name="fuel" aria-label="Fuel"><option value="">Any fuel</option><option>PETROL</option><option>DIESEL</option><option>CNG</option><option>ELECTRIC</option><option>HYBRID</option></select>
      <select name="sort" aria-label="Sort"><option value="newest">Newest</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option><option value="year_desc">Newest model year</option></select>
    </form>
    <div class="cards" id="cards"></div><button class="ghost more" id="more" hidden>Show more</button><p class="muted" id="empty" hidden>No vehicles match.</p>`;
  const cards = $("#cards");
  const more = $("#more");
  const filters = $("#filters");
  let offset = 0;
  const PAGE = 12;

  async function load(reset) {
    if (reset) {
      offset = 0;
      cards.innerHTML = "";
    }
    const p = new URLSearchParams({ limit: String(PAGE), offset: String(offset) });
    for (const [k, v] of new FormData(filters)) if (v) p.set(k, String(v));
    const { total, vehicles } = await call("/vehicles?" + p);
    cards.insertAdjacentHTML("beforeend", vehicles.map(card).join(""));
    offset += vehicles.length;
    more.hidden = offset >= total;
    $("#empty").hidden = total > 0;
  }
  let timer;
  filters.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(() => load(true).catch(showError), 250);
  });
  filters.addEventListener("submit", (e) => e.preventDefault());
  more.addEventListener("click", () => load(false).catch(showError));
  await load(true);
}

async function detail(slug) {
  const v = await call("/vehicles/" + encodeURIComponent(slug));
  document.title = `${title(v)} · ${shop.name}`;
  const photos = v.photo_urls ?? [];
  const rows = [
    ["Year", v.year], ["Kilometres", Number(v.odometer_km).toLocaleString("en-IN") + " km"], ["Fuel", v.fuel_type?.toLowerCase()], ["Transmission", v.transmission],
    ["Colour", v.color], ["Body", v.body_type], ["Seats", v.seating_capacity], ["Engine", v.cubic_capacity_cc ? v.cubic_capacity_cc + " cc" : null],
    ["Insurance valid", v.insurance_valid_months != null ? v.insurance_valid_months + " months" : null], ["Located in", v.city],
  ].filter(([, val]) => val != null && val !== "");
  view.innerHTML = `
    <a class="back" href="#/">← All vehicles</a>
    <article class="detail">
      <div class="gallery">
        <div class="main">${photos[0] ? `<img id="big" src="${url(photos[0])}" alt="${esc(title(v))}" width="800" height="600" />` : ""}</div>
        <div class="thumbs">${photos.map((u, i) => `<button type="button" data-i="${i}" aria-label="Photo ${i + 1}" ${i === 0 ? 'aria-current="true"' : ""}><img src="${url(u)}" alt="" loading="lazy" /></button>`).join("")}</div>
      </div>
      <div>
        <h1>${esc(title(v))}</h1>
        <div class="price">${inr(v.asking_price)}</div>
        ${v.finance_available ? `<span class="badge">Finance available</span>` : ""}
        <table class="specs">${rows.map(([k, val]) => `<tr><th>${esc(k)}</th><td>${esc(val)}</td></tr>`).join("")}</table>
        ${v.description ? `<p>${esc(v.description)}</p>` : ""}
        <div class="actions"><button class="primary" id="drive">Book a test drive</button><button class="ghost" id="ask">Ask a question</button></div>
        <form class="form panel" id="vform" hidden novalidate><h2 id="vtitle"></h2><div id="vfields"></div><p class="status" role="status"></p></form>
      </div>
    </article>`;
  $(".thumbs")?.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-i]");
    if (!b) return;
    $("#big").src = url(photos[Number(b.dataset.i)]);
    for (const t of document.querySelectorAll(".thumbs button")) t.setAttribute("aria-current", String(t === b));
  });
  const open = (kind) => {
    const form = $("#vform");
    const fresh = form.cloneNode(false); // drop earlier listeners
    form.replaceWith(fresh);
    fresh.hidden = false;
    fresh.innerHTML = `<h2>${kind === "TEST_DRIVE" ? "Book a test drive" : "Ask about this vehicle"}</h2>${fields(kind)}<p class="status" role="status"></p>`;
    wire(fresh, { kind, vehicleId: v.id });
    fresh.scrollIntoView({ behavior: "smooth", block: "nearest" });
    $("input", fresh).focus();
  };
  $("#drive").addEventListener("click", () => open("TEST_DRIVE"));
  $("#ask").addEventListener("click", () => open("ENQUIRY"));
}

function showError(err) {
  view.innerHTML = `<p class="status err" role="alert">${esc(err.message)}</p><p><a href="#/">Back to all vehicles</a></p>`;
}

async function route() {
  const m = location.hash.match(/^#\/vehicle\/(.+)$/);
  try {
    if (m) await detail(decodeURIComponent(m[1]));
    else if (location.hash !== "#contact") await home();
  } catch (err) {
    showError(err);
  }
  if (!m && location.hash !== "#contact") window.scrollTo(0, 0);
}

async function start() {
  try {
    shop = await call("/shop");
  } catch (err) {
    return showError(err);
  }
  $("#shop-name").textContent = shop.name;
  $("#shop-info").innerHTML = `<h2>${esc(shop.name)}</h2>
    ${shop.address ? `<p>${esc(shop.address)}</p>` : ""}${shop.business_hours ? `<p class="muted">${esc(shop.business_hours)}</p>` : ""}
    ${shop.map_link ? `<p><a href="${url(shop.map_link)}" rel="noopener">Open in maps</a></p>` : ""}`;
  $("#contact-fields").innerHTML = fields("ENQUIRY");
  wire($("#contact-form"));
  window.addEventListener("hashchange", route);
  await route();
}
start();

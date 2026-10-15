# Wheewise Site API

The backend for a dealer's own private website. Base address: `https://dealer.wheewise.com/api/site/v1`. The machine-readable description is always current at [`/openapi.json`](https://dealer.wheewise.com/api/site/v1/openapi.json).

## Authentication

Send the dealer's **site key** (`wws_…`) in the `X-Wheewise-Site-Key` header (or as `?key=` for plain `GET`s). Get or rotate it with the `get_site_api` / `rotate_site_key` tools, or under **Settings → AI assistant access** in the dealer app.

The key is safe to put in front-end code. It can only read published listings and create leads. What restricts it is the dealer's list of **allowed websites**:

- A request from a browser carries an `Origin` header. It must match one of the allowed addresses exactly (`https://myshop.com`, no path, no wildcard; `http://localhost:3000` is allowed for development), otherwise the answer is `403` and the browser blocks it.
- A request from a server has no `Origin` and is accepted with the key alone. Keep calls from your server's code if you prefer not to expose the key.

## Endpoints

### `GET /shop`
The shop's public details: `name`, `city`, `address`, `bio`, `business_hours`, `map_link`, `logo_url`, `cover_photo_url`, `hero_image_url`, `gallery_urls`, `live_vehicles`, `wheewise_page`.

### `GET /vehicles`
The dealer's **published** vehicles. Draft, paused and sold vehicles never appear.

| Query | Meaning |
|---|---|
| `limit` (1–50, default 20), `offset` | Paging |
| `q` | Searches make, model and variant |
| `make`, `category`, `fuel` | Filters (`fuel`: PETROL, DIESEL, CNG, ELECTRIC, HYBRID) |
| `min_price`, `max_price`, `min_year` | Ranges |
| `sort` | `newest` (default), `price_asc`, `price_desc`, `year_desc` |

Returns `{ "total": 31, "vehicles": [ … ] }`. Each vehicle has `id`, `slug`, `url`, `make`, `model`, `variant`, `year`, `fuel_type`, `transmission`, `odometer_km`, `asking_price` (rupees), `city`, `description`, `photo_urls` (the first is the cover), `finance_available`, `color`, `body_type`, `seating_capacity`, `cubic_capacity_cc`, `horsepower_bhp`, `insurance_valid_months`, `puc_valid_months`, `created_at`, `updated_at`. Costs, margins, registration and chassis numbers are never included.

### `GET /vehicles/{id}`
One published vehicle, by `id` or `slug`. `404` if it is not published.

### `POST /leads`
Sends an enquiry or a test-drive request to the dealer. It appears under **Leads** in the dealer app (marked *Test drive* with the time asked for) and the dealer gets a notification.

```json
{
  "name": "Ravi Kumar",
  "phone": "+91 98765 43210",
  "email": "ravi@example.com",
  "message": "Is it still available?",
  "vehicle_id": "7b6b6a52-3f0a-4a52-9d52-1a2b3c4d5e6f",
  "kind": "TEST_DRIVE",
  "preferred_at": "2026-11-01T10:30:00+05:30",
  "website": ""
}
```

- `name`, `phone`, `email` are required. `kind` is `ENQUIRY` (default) or `TEST_DRIVE`.
- `TEST_DRIVE` needs a `vehicle_id` of a published vehicle and a `preferred_at` that is in the future and within 90 days (ISO 8601 with an offset).
- `website` is a **spam trap**: add a hidden form field with this name and leave it empty. Bots tend to fill it; the request is then silently dropped.
- The same person asking about the same vehicle (same kind) twice in a day is stored once.

## Limits and errors

| Status | Meaning |
|---|---|
| `400` | A field is missing or invalid; `error` says which |
| `401` | No site key, or the key was replaced |
| `403` | The website is not on the allowed list |
| `404` | Vehicle or shop not available |
| `413` | Request body over 4 KB |
| `429` | Too many requests (per visitor, per key, or per shop per day) |

Errors are `{ "error": "message" }` and are written to be shown to a visitor. Responses to `GET`s may be cached for 30 seconds by the browser.

## A minimal client

```js
const API = "https://dealer.wheewise.com/api/site/v1";
const SITE_KEY = "wws_...";

export async function wheewise(path, init = {}) {
  const res = await fetch(API + path, {
    ...init,
    headers: { "X-Wheewise-Site-Key": SITE_KEY, "Content-Type": "application/json", ...init.headers },
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || "Request failed");
  return body;
}

export const getVehicles = (params = {}) => wheewise("/vehicles?" + new URLSearchParams(params));
export const getVehicle = (id) => wheewise(`/vehicles/${id}`);
export const sendLead = (lead) => wheewise("/leads", { method: "POST", body: JSON.stringify(lead) });
```

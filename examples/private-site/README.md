# Example: a private shop website on Wheewise

A complete shop website in plain HTML, CSS and JavaScript: your vehicles (search, filters, detail page with photos), an enquiry form and a test-drive form. **No build step, no database, no server.** Wheewise is the backend through the [Site API](../../docs/site-api.md); enquiries and test-drive requests land in your Leads in the dealer app.

It is a starting point: ask your assistant to restyle it, add pages, or rebuild it in Astro, Next.js or anything else, using the same three calls.

## Use it

1. In your assistant, call `get_site_api` (or open **Settings → AI assistant access**) and put the **site key** in `config.js`.
2. Allow the website's address: `set_site_allowed_origins` with `http://localhost:8080` while trying it, and your real address (`https://myshop.com`) when it is live.
3. Try it locally: `npx serve -l 8080 .` (or any static server), then open <http://localhost:8080>.
4. Publish the folder to any static host (Cloudflare Pages, Netlify, GitHub Pages, your own server).

## What it demonstrates

- Reading the shop and live vehicles, with search, fuel filter, sorting and "show more".
- A vehicle page by `slug` (shareable address `#/vehicle/<slug>`), photo gallery, specs, finance badge.
- `POST /leads` for an enquiry and for a test drive (`kind: "TEST_DRIVE"` with a future `preferred_at`), including the hidden spam-trap field `website`.
- Accessible forms, mobile-first layout, light and dark theme, lazy-loaded images.

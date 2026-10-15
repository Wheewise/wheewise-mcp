# Wheewise Dealer MCP

[![CI](https://github.com/Wheewise/dealer-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/Wheewise/dealer-mcp/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@wheewise/dealer-mcp)](https://www.npmjs.com/package/@wheewise/dealer-mcp)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**Build your own private website for your shop with an AI assistant, with no database to set up.** This [Model Context Protocol](https://modelcontextprotocol.io) server connects Claude (or any MCP assistant) to your [Wheewise dealer](https://dealer.wheewise.com) account. Wheewise becomes your website's backend:

- your **live vehicles** appear on your site, the moment you publish or change them in the dealer app;
- **enquiries and test-drive requests** from your site land in your **Leads** (and you are notified), next to everything else you manage in the dealer app;
- the assistant can also run the shop for you: prices, listings, test drives, reviews.

> "Build me a website for my shop at myshop.com with a premium feel. Show my vehicles, and let visitors enquire or book a test drive."

The assistant reads your shop, creates the site key, builds the site in the framework you choose, and wires the forms to your Leads. Your site stays yours: host it anywhere. A complete working example (vehicles, search, detail pages, enquiry and test-drive forms, no build step) is in [examples/private-site](examples/private-site).

## Quick start

1. In the dealer app open **Settings → AI assistant access** and create an **assistant token**. Turn on **Allow changes** if the assistant should create the site key and edit your shop; leave it off for look-only. Copy the token (shown once).
2. Add the server to your assistant.

**Claude Desktop** (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "wheewise": {
      "command": "npx",
      "args": ["-y", "@wheewise/dealer-mcp"],
      "env": { "WHEEWISE_API_TOKEN": "wwd_your_token_here" }
    }
  }
}
```

**Claude Code:**

```bash
claude mcp add wheewise --env WHEEWISE_API_TOKEN=wwd_your_token_here -- npx -y @wheewise/dealer-mcp
```

Other MCP clients (Cursor, VS Code, Windsurf, …) take the same `command`, `args` and `env`. Node.js 20 or newer is required.

3. Ask: *"Use the build_private_website prompt for https://myshop.com"*, or just describe the site you want.

## How your website talks to Wheewise

Your site calls the **Site API** with a **site key** (`wws_…`). The key is safe in front-end code: it can only read your published vehicles and create leads, and a browser may only use it from websites you list. The assistant sets all of this up; the details are in [docs/site-api.md](docs/site-api.md) and the live [OpenAPI description](https://dealer.wheewise.com/api/site/v1/openapi.json).

```js
const API = "https://dealer.wheewise.com/api/site/v1";
const headers = { "X-Wheewise-Site-Key": "wws_...", "Content-Type": "application/json" };

// Your live vehicles
const { vehicles } = await fetch(`${API}/vehicles?limit=12`, { headers }).then((r) => r.json());

// A test-drive request: it appears in your Leads and you are notified
await fetch(`${API}/leads`, {
  method: "POST",
  headers,
  body: JSON.stringify({ name, phone, email, vehicle_id, kind: "TEST_DRIVE", preferred_at: "2026-11-01T10:30:00+05:30" }),
});
```

## What the assistant can do

The tools you get depend on your token: a read-only token lists only the "read" ones.

| Tool | Needs | What it does |
|---|---|---|
| `get_site_api` | read | The Site API address, your site key, allowed websites, OpenAPI link and example code. **Start here when building a site.** |
| `rotate_site_key` | write | Create the site key, or replace it (the old one stops working at once) |
| `set_site_allowed_origins` | write | The websites allowed to use the key from a browser, e.g. `https://myshop.com` |
| `get_shop` | read | Shop details, website address, template, hero image |
| `shop_summary` | read | Stock by status and stage, money tied up, expected profit, old stock |
| `list_vehicles`, `get_vehicle` | read | Search and open vehicles, including private costs |
| `list_leads` | read | Enquiries and test-drive requests from your websites |
| `mark_leads_read` | write | Clear the "new" badge on website leads |
| `list_enquiries`, `get_conversation` | read | Buyer chats on Wheewise |
| `list_test_drives` | read | Test-drive bookings made on Wheewise |
| `list_reviews` | read | Reviews and the rating summary |
| `update_vehicle_price` | write | Change an asking price |
| `set_listing_status` | write | Publish, hide or draft a listing (a published vehicle appears on your site) |
| `mark_vehicle_sold` | write | Record a sale (it leaves your site) |
| `set_finance_available` | write | Show or hide the finance badge |
| `update_test_drive` | write | Confirm with a time, complete, cancel, no-show |
| `reply_to_review`, `remove_review_reply` | write | Public replies to reviews |
| `update_website` | write | The Wheewise-hosted shop page (`<shop>.wheewise.com`): template, text, hero image |

Prompts: **Build my own private website**, **Build my shop website** (the Wheewise-hosted page) and **Daily shop briefing**.

Not included yet, on purpose: creating vehicles and uploading photos, and sending chat messages as you. These need more safeguards first.

## Safety

- **Your token, your shop.** The shop comes from the token or site key, never from an argument, so nothing can reach another dealer's data.
- **Two different keys.** The *assistant token* (`wwd_…`) is secret: it stays in your assistant's settings and never goes into a website. The *site key* (`wws_…`) is public by design and only does what a visitor could.
- **Visitors see only public data.** The Site API never returns costs, margins, registration numbers or unpublished vehicles.
- **Read-only by default.** Changes need a token created with **Allow changes**, and every change is written to your audit log as `mcp:<tool>`.
- **Revoke any time** in Settings → AI assistant access. Assistant tokens can expire after 30, 90 or 365 days; the site key can be replaced.
- **Abuse limits.** Enquiry forms are rate-limited per visitor and per shop, have a spam trap, and validate every field.

Treat the assistant token like a password. See [SECURITY.md](SECURITY.md) to report a vulnerability.

## Configuration

| Variable | Required | Default |
|---|---|---|
| `WHEEWISE_API_TOKEN` | yes | n/a |
| `WHEEWISE_API_URL` | no | `https://dealer.wheewise.com` (must be https, or localhost for development) |

## Troubleshooting

- **"Your Wheewise token is invalid, expired or revoked"**: create a new assistant token in the dealer app.
- **A change tool is missing**: the token is read-only. Create one with **Allow changes**.
- **My website gets "not allowed to use this key"**: add the website's exact address (`https://myshop.com`, no path) with `set_site_allowed_origins`, or under Settings → AI assistant access. Add `http://localhost:3000` while developing.
- **"Could not reach Wheewise"**: check your connection; the server needs outbound HTTPS.
- Logs go to stderr, so they appear in your assistant's MCP log, never in the conversation.

## Development

```bash
npm install
npm test         # builds, then runs the tests against a mock gateway
npm run typecheck
```

The server is deliberately thin. It fetches the tool list and argument schemas from the Wheewise gateway (`/api/mcp/v1/tools`) and forwards calls (`/api/mcp/v1/call`), so a new tool in the dealer app appears here without a release.

## Releasing

Update `CHANGELOG.md` and `version` in `package.json` and `server.json`, then push a tag:

```bash
git tag v0.2.0 && git push origin v0.2.0
```

The release workflow checks the tag matches the version, runs the tests, publishes to npm with provenance and creates the GitHub release. It needs an `NPM_TOKEN` repository secret.

## License

[MIT](LICENSE) © Wheewise

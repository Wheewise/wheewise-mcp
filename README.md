# Wheewise Dealer MCP

[![CI](https://github.com/Wheewise/dealer-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/Wheewise/dealer-mcp/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@wheewise/dealer-mcp)](https://www.npmjs.com/package/@wheewise/dealer-mcp)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A [Model Context Protocol](https://modelcontextprotocol.io) server for **Wheewise dealers**. Connect Claude (or any MCP-capable assistant) to your shop and ask it, in plain words, to look after the work you do in the [Wheewise dealer app](https://dealer.wheewise.com):

- "What needs my attention today?"
- "Drop the price of the 2019 Swift by ₹10,000 and turn on finance for it."
- "Confirm Ravi's test drive for Saturday 11 am."
- "Reply to my last three reviews."
- "Build my shop website: pick a template that feels premium and write the about text."

It only ever acts on **your own shop**, with a token you create and can switch off at any time.

## Quick start

1. In the dealer app open **Settings → AI assistant access** and create a token. Leave **Allow changes** off to let the assistant look but not touch. Copy the token (it is shown once).
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

3. Ask something, for example *"Give me a briefing on my shop."*

## What it can do

The tools you get depend on your token: a read-only token lists only the first group.

| Tool | Needs | What it does |
|---|---|---|
| `get_shop` | read | Shop details, website address, template, hero image |
| `shop_summary` | read | Stock by status and stage, money tied up, expected profit, old stock |
| `list_vehicles`, `get_vehicle` | read | Search and open vehicles, including private costs |
| `list_enquiries`, `get_conversation` | read | Buyer chats and their messages |
| `list_test_drives` | read | Test-drive requests and bookings |
| `list_leads` | read | Visitors who left details on your website |
| `list_reviews` | read | Reviews and the rating summary |
| `update_vehicle_price` | write | Change an asking price |
| `set_listing_status` | write | Publish, hide or draft a listing (publishing tells your followers) |
| `mark_vehicle_sold` | write | Record a sale (buyers who enquired are told) |
| `set_finance_available` | write | Show or hide the finance badge |
| `update_test_drive` | write | Confirm with a time, complete, cancel, no-show (confirming tells the buyer) |
| `reply_to_review`, `remove_review_reply` | write | Public replies to reviews |
| `update_website` | write | Template, about text, hours, address, map link, hero image |

It also offers two prompts: **Build my shop website** and **Daily shop briefing**.

Not included yet, on purpose: creating vehicles and uploading photos, and sending chat messages as you. These need more safeguards first.

## Safety

- **Your token, your shop.** The shop comes from the token, never from a tool argument, so an assistant cannot reach another dealer's data.
- **Read-only by default.** Changes need a token created with **Allow changes**.
- **Everything is recorded.** Each change made through the assistant is written to your audit log as `mcp:<tool>`.
- **Revoke any time** in Settings → AI assistant access. Tokens can also expire after 30, 90 or 365 days.
- **Limits.** Calls are rate-limited, and the same checks the app applies (valid prices, future test-drive times, your own uploaded images) apply here.
- The token is stored hashed on Wheewise's side and is only ever sent to `https://dealer.wheewise.com`.

Treat the token like a password. See [SECURITY.md](SECURITY.md) to report a vulnerability.

## Configuration

| Variable | Required | Default |
|---|---|---|
| `WHEEWISE_API_TOKEN` | yes | n/a |
| `WHEEWISE_API_URL` | no | `https://dealer.wheewise.com` (must be https, or localhost for development) |

## Troubleshooting

- **"Your Wheewise token is invalid, expired or revoked"**: create a new token in the dealer app.
- **A change tool is missing**: the token is read-only. Create one with **Allow changes**.
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
git tag v0.1.0 && git push origin v0.1.0
```

The release workflow checks the tag matches the version, runs the tests, publishes to npm with provenance and creates the GitHub release. It needs an `NPM_TOKEN` repository secret.

## License

[MIT](LICENSE) © Wheewise

# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [0.2.0] - 2026-10-15

### Added
- **Private websites without a database.** A dealer's own website can now use Wheewise as its backend through the Site API (`/api/site/v1`): live vehicles, shop details, and enquiries and test-drive requests that arrive in the dealer's Leads.
- Tools `get_site_api`, `rotate_site_key` and `set_site_allowed_origins` to set the site up; `list_leads` now returns `kind` (ENQUIRY or TEST_DRIVE) and `preferred_at`.
- Prompt "Build my own private website".
- [docs/site-api.md](docs/site-api.md) and a public OpenAPI description at `/api/site/v1/openapi.json`.

## [0.1.0] - 2026-10-15

### Added
- First release: an MCP server over stdio for Wheewise dealers.
- Read tools: shop details, stock summary, vehicles, buyer chats, test drives, website leads, reviews.
- Write tools (token needs the `write` scope): price, listing status, sold, finance badge, test-drive status, review replies, shop website.
- Prompts: "Build my shop website" and "Daily shop briefing".
- Tool list and argument schemas are served by the Wheewise gateway, so new app tools need no release here.

# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [0.2.3] - 2026-10-15

### Changed
- New README with the Wheewise logo and wordmark, feature cards, a flow diagram and collapsible setup sections.
- Tighter hardening of the repository (secret scanning, protected release tags). No code changes.

## [0.2.2] - 2026-10-15

### Fixed
- A refused `WHEEWISE_API_URL` now prints a one-line explanation instead of a stack trace.

## [0.2.1] - 2026-10-15

### Security
- The server now sends the token only to `wheewise.com` addresses; any other `WHEEWISE_API_URL` is refused unless `WHEEWISE_ALLOW_CUSTOM_URL=1` is set, so a shared project config cannot redirect the token.
- Tools that return text written by the public (leads, reviews, chats, test-drive notes) are marked as untrusted in their description and result, to resist prompt injection.
- README: guidance on token storage, read-only tokens, and what data leaves Wheewise when an assistant reads leads and chats. SECURITY.md lists the known limits.

## [0.2.0] - 2026-10-15

### Added
- **Private websites without a database.** A dealer's own website can now use Wheewise as its backend through the Site API (`/api/site/v1`): live vehicles, shop details, and enquiries and test-drive requests that arrive in the dealer's Leads.
- Tools `get_site_api`, `rotate_site_key` and `set_site_allowed_origins` to set the site up; `list_leads` now returns `kind` (ENQUIRY or TEST_DRIVE) and `preferred_at`.
- Prompt "Build my own private website".
- `mark_leads_read` tool.
- A complete example website in `examples/private-site` (plain HTML/CSS/JS, no build step).
- [docs/site-api.md](docs/site-api.md) and a public OpenAPI description at `/api/site/v1/openapi.json`.

## [0.1.0] - 2026-10-15

### Added
- First release: an MCP server over stdio for Wheewise dealers. Published as `@wheewise-mcp/dealer`.
- Read tools: shop details, stock summary, vehicles, buyer chats, test drives, website leads, reviews.
- Write tools (token needs the `write` scope): price, listing status, sold, finance badge, test-drive status, review replies, shop website.
- Prompts: "Build my shop website" and "Daily shop briefing".
- Tool list and argument schemas are served by the Wheewise gateway, so new app tools need no release here.

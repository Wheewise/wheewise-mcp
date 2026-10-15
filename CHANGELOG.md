# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [0.1.0] - 2026-10-15

### Added
- First release: an MCP server over stdio for Wheewise dealers.
- Read tools: shop details, stock summary, vehicles, buyer chats, test drives, website leads, reviews.
- Write tools (token needs the `write` scope): price, listing status, sold, finance badge, test-drive status, review replies, shop website.
- Prompts: "Build my shop website" and "Daily shop briefing".
- Tool list and argument schemas are served by the Wheewise gateway, so new app tools need no release here.

# Security policy

## Reporting a vulnerability

Please do **not** open a public issue for a security problem. Use GitHub's private reporting instead: **Security → Report a vulnerability** on this repository. If that is unavailable, email the address on the Wheewise website's security contact page.

Include what you found, how to reproduce it, and what an attacker could do with it. We aim to acknowledge a report within 3 working days and to fix confirmed issues quickly.

## Scope

- This package (`@wheewise/dealer-mcp`) and how it handles the access token.
- The Wheewise gateway it talks to (`https://dealer.wheewise.com/api/mcp/v1`): token handling, scope checks and anything that could let one dealer reach another dealer's data. This is the most important area.

## If a token may have leaked

Revoke it in the dealer app under **Settings → AI assistant access**. A revoked token stops working immediately. Changes made with a token are listed in your audit log as `mcp:<tool>`.

## Design notes for reviewers

- The token is sent only in an `Authorization` header and only to an `https://` address (or localhost).
- The server holds no state and writes nothing to disk. Logs go to stderr and never include the token.
- The set of tools is decided by the gateway from the token's scopes, not by this package.

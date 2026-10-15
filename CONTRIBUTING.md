# Contributing

Thanks for helping. This package is intentionally small: new tools are added in the Wheewise dealer app and appear here automatically, so most contributions are about the server itself (protocol behaviour, error messages, docs, tests).

## Setup

```bash
npm install
npm test
```

Node.js 20 or newer. `npm test` builds with `tsc` and runs the tests in `test/` against a mock gateway: no Wheewise account is needed.

## Pull requests

- One change per pull request, with a test when behaviour changes.
- Keep `npm run typecheck` and `npm test` green.
- Add a line to `CHANGELOG.md` under **Unreleased**.
- Never commit a real token. Tokens start with `wwd_`; the tests use a made-up one.

By contributing you agree your work is released under the [MIT license](LICENSE). Be kind: see the [Code of Conduct](CODE_OF_CONDUCT.md).

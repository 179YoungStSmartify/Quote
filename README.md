# Quote application

This repository is a public GitHub Pages application built from the quote template. The site is served below the case-sensitive `/Quote/` path. Its committed source and static build are public, so treat every tracked file and generated asset as publishable. The deployed page and `dist/quote.pdf` are built from `src/quote.json` by the existing workflows.

## Public maintenance rules

- Keep source, docs, examples, and public assets safe for anyone to read. Only the expressly approved client-facing quote data belongs here; do not add unapproved client identifiers, addresses or scope. Never commit internal costing, credentials, or recipient-specific links.
- Only publish approved quote content. Static files and build output are not an access-controlled delivery channel.
- Do not put credentials, tokens, or recipient-specific private links in source or static assets.
- Preserve the Pages path exactly as `/Quote/` unless the repository/hosting path is intentionally changed together with Vite configuration and workflow.

## Commands

Use Node.js 22 and npm from this directory:

```sh
npm ci
npx playwright install chromium
npm run dev
npm run typecheck
npm run lint
npm test
VITE_BASE_PATH=/Quote/ npm run build
npm run test:e2e
npm run preview
npm run pdf
```

Install Chromium before tests or builds (`npm ci` then `npx playwright install chromium`; use `--with-deps` in CI). `npm run build` typechecks and invokes the PDF script, which builds the website and writes `dist/quote.pdf`. Standalone `npm run pdf` also rebuilds the website before exporting. Browser **Print quote** still invokes `window.print()`.

## Source and content

- `src/quote.json`: structured content used by the React page and PDF generator.
- `src/types.ts`: `QuoteData` type contract.
- `src/App.tsx`: interactive page rendering and total calculations.
- `src/quote.css`: quote-specific styles; shared tokens and print rules are in `vendor/react-ui/src/styles.css`.
- `scripts/generate-pdf.mjs`: separate PDF rendering implementation.
- `vendor/react-ui/`: vendored shared UI and its `SNAPSHOT-PROVENANCE.md`.

Screen totals and PDF totals derive from line items and discounts. Authored optional subtotal amounts also appear in both renderers and must be reconciled with the line items. After editing approved content, check the browser page, generated PDF, and print preview.

The quote summary uses a charcoal total card and a quieter aligned breakdown, with a 24px narrow / 32px wide gap before the overview cards. Print switches the total card to white with dark text and a compact two-column summary. Category titles and subtotal labels come from the JSON and are shared with the PDF; use descriptive names rather than section letters. Summary cards derive pre-discount amounts from line items and strike them through only where an actual reduction exists. Discounted amounts remain primary, with explicit before/after text for assistive technology and the existing savings row retained. The downloadable PDF uses the same print layout, including the summary and totals.

## Pages base path

`vite.config.ts` defaults to `/Quote/`; the Pages workflow sets the same exact value for its production build. Keep the uppercase `Q` and trailing slash. For a different host or repository path, change Vite base and deployment configuration together, then verify built asset URLs and PDF download links below that path. Do not use the root-hosted default when publishing this project site.

## Shared UI snapshot

The app consumes `vendor/react-ui` as a local package. The source script is `react-ui/scripts/sync-snapshot.mjs`; from a sibling `react-ui` checkout, the command is:

```sh
node scripts/sync-snapshot.mjs . ../Quote/vendor/react-ui --source-sha "$(git rev-parse HEAD)"
```

Then run `npm ci` in this repository, inspect the snapshot and provenance diff, and run the checks above. Do not independently edit vendored source files.

See [AGENTS.md](AGENTS.md) for public-safe maintenance instructions.

## Docker deployment (for Sam)

- **Production:** `:release` follows stable Quote releases.
- **Testing:** `:main` follows tested `main` builds.

```sh
# Sign in with GHCR package read access.
docker login ghcr.io

# Production → localhost:8081
docker run -d --name quote-release --restart unless-stopped \
  -p 127.0.0.1:8081:8080 -v quote-release-data:/data \
  -e APP_REPO=179YoungStSmartify/Quote -e POLL_INTERVAL_SECONDS=300 \
  -e GITHUB_TOKEN ghcr.io/perspectiveliving/static-app-host:release

# Testing → localhost:8080
docker run -d --name quote-main --restart unless-stopped \
  -p 127.0.0.1:8080:8080 -v quote-main-data:/data \
  -e APP_REPO=179YoungStSmartify/Quote -e POLL_INTERVAL_SECONDS=300 \
  -e GITHUB_TOKEN ghcr.io/perspectiveliving/static-app-host:main
```

Proxy each hostname to its localhost port, serving `/` (not `/Quote/`). For a containerized proxy, use a shared Docker network instead—see the reference below.

- App updates are automatic; failed updates keep the last working version.
- Keep the separate `/data` volumes when replacing containers.
- `GITHUB_TOKEN` is optional for the public app repo; the commands forward it if already exported. It is separate from GHCR login.
- Check production readiness: `curl --fail http://localhost:8081/__host/ready`.

[Networking, health checks, token details and upgrades →](docs/docker-deployment.md)

## Mobile item layout

The quote uses stacked item cards through 1024px and the original semantic table on desktop and paper. Both views derive from `src/quote.json` and show the same interim/gross subtotals, discounts, section totals, and grand total. Item names wrap while currency amounts stay intact. Validate 320, 360, 375, 390, 430, 768, 1024, and 1440px in portrait and landscape, with enlarged text, minimum 44px touch targets, and no sideways panning for essential quote details.

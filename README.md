# Quote application

This repository is a public GitHub Pages application built from the quote template. The site is served below the case-sensitive `/Quote/` path. Its committed source and static build are public, so treat every tracked file and generated asset as publishable. The deployed page and `dist/quote.pdf` are built from `src/quote.json` by the existing workflows.

## Public maintenance rules

- Keep source, docs, examples, and public assets safe for anyone to read. Only the expressly approved client-facing quote data belongs here; do not add unapproved client identifiers, addresses or scope. Never commit internal costing, credentials, or recipient-specific links.
- Only publish approved quote content. Static files and build output are not an access-controlled delivery channel.
- Signing integration is deferred. Do not put signing credentials, recipient tokens, or private acceptance URLs in source or static assets.
- Preserve the Pages path exactly as `/Quote/` unless the repository/hosting path is intentionally changed together with Vite configuration and workflow.

## Commands

Use Node.js 22 and npm from this directory:

```sh
npm ci
npm run dev
npm run typecheck
npm run lint
npm test
VITE_BASE_PATH=/Quote/ npm run build
npx playwright install chromium
npm run test:e2e
npm run preview
npm run pdf
```

The `pages.yml` workflow installs dependencies, runs unit/type/lint checks, builds with `VITE_BASE_PATH: /Quote/`, installs Playwright Chromium with system dependencies, runs browser checks, then publishes `dist/` through GitHub Pages. `quality.yml` runs the standard quality checks on pushes and pull requests. `npm run build` also generates `dist/quote.pdf`; `npm run pdf` runs the PDF generator directly. The site includes an in-browser print action as well.

## Source and content

- `src/quote.json`: structured content used by the React page and PDF generator.
- `src/types.ts`: `QuoteData` type contract.
- `src/App.tsx`: interactive page rendering and total calculations.
- `src/quote.css`: quote-specific styles; shared tokens and print rules are in `vendor/react-ui/src/styles.css`.
- `scripts/generate-pdf.mjs`: separate PDF rendering implementation.
- `vendor/react-ui/`: vendored shared UI and its `SNAPSHOT-PROVENANCE.md`.

Screen totals and PDF totals derive from line items and discounts. Authored optional subtotal amounts also appear in both renderers and must be reconciled with the line items. After editing approved content, check the browser page, generated PDF, and print preview.

The quote summary uses a charcoal total card and a quieter aligned breakdown, with a 24px narrow / 32px wide gap before the overview cards. Print switches the total card to white with dark text and a compact two-column summary. Category titles and subtotal labels come from the JSON and are shared with the PDF; use descriptive names rather than section letters. Summary cards derive pre-discount amounts from line items and strike them through only where an actual reduction exists. Discounted amounts remain primary, with explicit before/after text for assistive technology and the existing savings row retained. The downloadable PDF keeps its existing itemised gross/discount/net presentation.

## Pages base path

`vite.config.ts` defaults to `/Quote/`; the Pages workflow sets the same exact value for its production build. Keep the uppercase `Q` and trailing slash. For a different host or repository path, change Vite base and deployment configuration together, then verify built asset URLs and PDF download links below that path. Do not use the root-hosted default when publishing this project site.

## Shared UI snapshot

The app consumes `vendor/react-ui` as a local package. The source script is `react-ui/scripts/sync-snapshot.mjs`; from a sibling `react-ui` checkout, the command is:

```sh
node scripts/sync-snapshot.mjs . ../Quote/vendor/react-ui --source-sha "$(git rev-parse HEAD)"
```

Then run `npm ci` in this repository, inspect the snapshot and provenance diff, and run the checks above. Do not independently edit vendored source files.

See [AGENTS.md](AGENTS.md) for public-safe maintenance instructions.

## Mobile item layout

The quote uses stacked item cards through 1024px and the original semantic table on desktop and paper. Both views derive from `src/quote.json` and show the same interim/gross subtotals, discounts, section totals, and grand total. Item names wrap while currency amounts stay intact. Validate 320, 360, 375, 390, 430, 768, 1024, and 1440px in portrait and landscape, with enlarged text, minimum 44px touch targets, and no sideways panning for essential quote details.

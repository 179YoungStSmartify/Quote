# Maintaining the public quote app

## Public-safe content changes

This repository is deployed publicly on GitHub Pages. Treat tracked files, `public/`, and `dist/` as world-readable. Before editing content, confirm it is approved for public release. Do not add client identity, address, private scope, internal costing, secrets, credentials, or recipient-specific URLs to docs, source, generated files, or commit messages. Signing is not part of the quote template. Never place credentials or recipient-specific links in static assets.

The browser renders `src/quote.json` through `src/App.tsx`. Quote data is typed in `src/types.ts`; draft-only fields are `status: "draft"`, `draftedOn` (DD/MM/YYYY), and `draftChecks` (pre-issue confirmations). Drafts must have `quoteDate: null` and `validUntil: null`; do not invent an issue date or show expiry status. `optionalAddons` and `phaseTwo.items` are separate from `sections` and therefore excluded from base totals. Their `amountCents` are AUD cents. Keep optional prices outside base line items. The same rendered page feeds the PDF: `scripts/generate-pdf.mjs` builds fresh production Vite assets, then prints the React page with Playwright Chromium and existing print CSS. Download and **Print quote** share typography, layout, A4 sizing and page-break rules. Keep amounts in canonical data and inspect browser, PDF and print after content changes.

Layout belongs in `src/App.tsx`, quote-specific styling in `src/quote.css`, and shared UI styling in the vendored package. Preserve semantic tables, accessible names, keyboard focus, mobile dialog behavior, and print rules. Shared component source is maintained in the reusable UI repository, not edited directly in the snapshot.

## Snapshot refresh

The local package is `vendor/react-ui`; its source-maintenance script is `react-ui/scripts/sync-snapshot.mjs`. From a sibling checkout of `react-ui`, run:

```sh
node scripts/sync-snapshot.mjs . ../Quote/vendor/react-ui --source-sha "$(git rev-parse HEAD)"
```

This replaces the snapshot and records the source SHA. Run `npm ci` here, inspect the snapshot/provenance diff, and review the app visually after shared CSS or component changes.

## Build and the Pages path

`vite.config.ts` sets `base` to `process.env.VITE_BASE_PATH || '/Quote/'`. The Pages workflow explicitly builds with `VITE_BASE_PATH=/Quote/` and publishes `dist/`. Preserve the exact capitalization and trailing slash. If the repository or host path changes, update the Vite base and workflow env together and check generated asset URLs plus the relative `./quote.pdf` link.

The Pages workflow runs `npm ci`, `npm test`, `npm run typecheck`, `npm run lint`, builds with `/Quote/`, installs Playwright Chromium and system dependencies, runs `npm run test:e2e`, and uploads `dist/`. `npm run check:expiry` accepts only a structurally coherent explicit draft or an issued quote with a valid unexpired `validUntil`; draft does not imply issued/active. Issue and expiry fields are set only after confirmation/issuance; validity wording is calculated from issue, not draft date. The quality workflow runs the same unit/type/lint/build and browser checks without Pages deployment. Locally use:

```sh
npm ci
npm test
npm run typecheck
npm run lint
VITE_BASE_PATH=/Quote/ npm run build
npx playwright install chromium
npm run test:e2e
npm run preview
npm run pdf
```

The browser checks use the repository's Playwright config and local preview. `npm run build` also generates the PDF; `npm run pdf` can regenerate it independently.

## Release review

Check the app at narrow phone (320px/390px), tablet, and desktop widths; verify keyboard-only operation, visible focus, dialog dismissal and focus return, readable contrast, and table navigation. Review PDF and browser print output for line wrapping, page breaks, and missing symbols. Inspect the full staged change and deployable output for public-safe content before release. No full-check run is required for a documentation-only change unless the owner requests it.

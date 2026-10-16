# Maintaining the public quote app

## Public-safe content changes

This repository is deployed publicly on GitHub Pages. Treat tracked files, `public/`, and `dist/` as world-readable. Before editing content, confirm it is approved for public release. Do not add client identity, address, private scope, internal costing, secrets, credentials, or recipient-specific URLs to docs, source, generated files, or commit messages. Signing integration remains deferred; acceptance wording does not authorize a credential or recipient token in a static app.

The structured source is `src/quote.json`, with its shape in `src/types.ts`. `src/App.tsx` renders the browser page and computes totals from line items and discounts; `scripts/generate-pdf.mjs` separately lays out the same JSON and computes totals. Authored optional subtotal fields also display in both renderers. Update them only when consistent with the underlying entries. After changing content or schema, inspect the page, downloaded `dist/quote.pdf`, and browser print preview. The PDF renderer normalizes unsupported punctuation/symbols to basic ASCII.

Layout belongs in `src/App.tsx`, quote-specific styling in `src/quote.css`, and shared UI styling in the vendored package. Preserve semantic tables, accessible names, keyboard focus, mobile dialog behavior, and print rules. Shared component source is maintained in the reusable UI repository, not edited directly in the snapshot.

## Snapshot refresh

The local package is `vendor/react-ui`; its source-maintenance script is `react-ui/scripts/sync-snapshot.mjs`. From a sibling checkout of `react-ui`, run:

```sh
node scripts/sync-snapshot.mjs . ../Quote/vendor/react-ui --source-sha "$(git rev-parse HEAD)"
```

This replaces the snapshot and records the source SHA. Run `npm ci` here, inspect the snapshot/provenance diff, and review the app visually after shared CSS or component changes.

## Build and the Pages path

`vite.config.ts` sets `base` to `process.env.VITE_BASE_PATH || '/Quote/'`. The Pages workflow explicitly builds with `VITE_BASE_PATH=/Quote/` and publishes `dist/`. Preserve the exact capitalization and trailing slash. If the repository or host path changes, update the Vite base and workflow env together and check generated asset URLs plus the relative `./quote.pdf` link.

The Pages workflow runs `npm ci`, `npm test`, `npm run typecheck`, `npm run lint`, builds with `/Quote/`, installs Playwright Chromium and system dependencies, runs `npm run test:e2e`, and uploads `dist/`. The quality workflow runs the same unit/type/lint/build and browser checks without Pages deployment. Locally use:

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

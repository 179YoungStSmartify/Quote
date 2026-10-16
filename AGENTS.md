# Public repository maintenance

## Mobile-first contract

- Use data-driven item cards through 1024px; desktop and print show only the semantic table. Preserve all approved prices, scope and terms in both views.
- Keep complete item names, labelled quantities, unit prices and line totals visible without sideways panning. Reflow price facts instead of shrinking monetary text or splitting amounts.
- Preserve 44px touch targets, natural wrapping, fluid spacing and shared mobile navigation/focus behavior.
- Test item-level bounds at 320–1024px and the desktop table at 1440px. Include portrait/landscape phone emulation, doubled computed text sizes, acceptance-placeholder wrapping, actual section scrolling, menu focus and print/PDF regressions.
- Body-width checks alone are insufficient: inspect each label and price for clipping, overflow and off-screen positioning.

This repo is deployed as a public GitHub Pages site under `/Quote/`. Every tracked source file, generated artifact, and static asset can be read by the public. Read [README.md](README.md) before editing content or deployment settings.

- Keep changes and docs free of private client details and internal costing. Static hosting does not protect files.
- `src/quote.json` feeds both `src/App.tsx` and `scripts/generate-pdf.mjs`; review the screen, PDF, and print output together.
- Preserve the case-sensitive `/Quote/` Vite base in `vite.config.ts` and `.github/workflows/pages.yml`. Update and verify both if the deployment path changes.
- Signing integration is deferred. Never commit credentials, tokens, or recipient-specific signing links.
- Shared UI is vendored under `vendor/react-ui`; update from `react-ui/scripts/sync-snapshot.mjs`, retain source SHA provenance, and review the resulting diff.
- Quality workflow commands: `npm ci`, `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, `npx playwright install --with-deps chromium`, `npm run test:e2e`. Pages builds with `VITE_BASE_PATH=/Quote/` before artifact upload.

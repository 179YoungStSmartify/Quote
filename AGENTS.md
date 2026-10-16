# Public repository maintenance

This repo is deployed as a public GitHub Pages site under `/Quote/`. Every tracked source file, generated artifact, and static asset can be read by the public. Read [README.md](README.md) before editing content or deployment settings.

- Keep changes and docs free of private client details and internal costing. Static hosting does not protect files.
- `src/quote.json` feeds both `src/App.tsx` and `scripts/generate-pdf.mjs`; review the screen, PDF, and print output together.
- Preserve the case-sensitive `/Quote/` Vite base in `vite.config.ts` and `.github/workflows/pages.yml`. Update and verify both if the deployment path changes.
- Signing integration is deferred. Never commit credentials, tokens, or recipient-specific signing links.
- Shared UI is vendored under `vendor/react-ui`; update from `react-ui/scripts/sync-snapshot.mjs`, retain source SHA provenance, and review the resulting diff.
- Quality workflow commands: `npm ci`, `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, `npx playwright install --with-deps chromium`, `npm run test:e2e`. Pages builds with `VITE_BASE_PATH=/Quote/` before artifact upload.

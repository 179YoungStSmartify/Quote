# Agent guide

## Mobile-first contract

- Start with narrow-screen defaults; use min-width enhancements at 721px for navigation and 901px for card columns.
- Keep interactive controls at least 44px high, allow long metadata to reflow, and preserve natural word wrapping and intact currency amounts.
- Use the exact bundled font-family names: `DM Sans Variable` and `Playfair Display Variable`. Verify fonts load before measuring layouts.
- Test 320–1440px production layouts, portrait/landscape phone emulation, enlarged text, menu focus, actual section scrolling and print. Inspect item-level bounds and scrollWidth/clientWidth, not just body overflow.
- Quote consumers must expose full item names, quantities, unit prices and line totals without sideways panning. A scroll container alone is not a mobile quote layout.

Read [README.md](README.md) for setup, package API, tokens, and snapshot sync. Read [docs/authoring.md](docs/authoring.md) before changing components or styles.

- Source of truth: `src/index.tsx` and `src/styles.css`; do not hand-edit consumer snapshots.
- Preserve semantic HTML, visible keyboard focus, mobile navigation behavior, and print styling.
- Keep this reusable package and its documentation free of client-specific information.
- Run `npm ci`, `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` when asked to verify a change.
- Snapshot sync script: `scripts/sync-snapshot.mjs`; record the source Git SHA and inspect the consumer diff.

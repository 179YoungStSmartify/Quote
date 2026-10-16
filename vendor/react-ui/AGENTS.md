# Agent guide

Read [README.md](README.md) for setup, package API, tokens, and snapshot sync. Read [docs/authoring.md](docs/authoring.md) before changing components or styles.

- Source of truth: `src/index.tsx` and `src/styles.css`; do not hand-edit consumer snapshots.
- Preserve semantic HTML, visible keyboard focus, mobile navigation behavior, and print styling.
- Keep this reusable package and its documentation free of client-specific information.
- Run `npm ci`, `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` when asked to verify a change.
- Snapshot sync script: `scripts/sync-snapshot.mjs`; record the source Git SHA and inspect the consumer diff.

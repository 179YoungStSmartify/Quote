# Perspective Living React UI

Reusable React 19 components and visual foundations for proposal and quote apps. The package is consumed from a checked-in local snapshot by the app templates; it is not published to a package registry. Keep this repository free of client names, project content, and commercial data.

## Setup and checks

Use Node.js 22 and npm. From this directory:

```sh
npm ci
npm run typecheck
npm run lint
npm test
npm run build
```

`typecheck` and `build` both run `tsc --noEmit`; there is no dev server, bundling step, or runtime preview in this package. The runnable command set is `npm ci`, `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`. `npm test` runs Node's test runner against `tests/*.test.mjs`, including stylesheet contracts and safe snapshot synchronization.

## Package API

The package root exports `Shell`, `Section`, `Card`, `Badge`, `Button`, `BackToTop`, and `TableFrame` from `src/index.tsx`. `Shell` mounts `BackToTop` once by default; the named component also accepts a required `visible` boolean when used directly. Import the stylesheet once from the app entry point:

```tsx
import { Card, Section, Shell, Button, TableFrame } from '@perspective-living/react-ui';
import '@perspective-living/react-ui/styles.css';

export function Example() {
  return <Shell><Section id="overview" title="Overview">
    <Card><p>Generic example content.</p><Button type="button">Continue</Button></Card>
    <TableFrame label="Example items"><table>{/* table rows */}</table></TableFrame>
  </Section></Shell>;
}
```

`Section` takes `id`, `title`, and `children`; `Card` takes `children` and optional `className`; `Badge` takes `children`; `Button` takes `children`, optional `variant` (`primary`, `secondary`, or `light`), and native button attributes; `BackToTop` takes `visible`; `TableFrame` takes `label` and `children`. `Shell` provides the site header, mobile navigation dialog, skip link, main landmark, footer, and back-to-top control. That control appears after scrolling beyond 480px, returns focus to the main landmark, scrolls smoothly unless reduced motion is preferred, and is removed from print output. Sections reveal with a brief entrance after entering view; content remains visible if observation is unavailable, and reduced-motion preferences disable the animation. Card and button feedback is limited to fine-pointer hover devices.

## Tokens and styling

`src/styles.css` owns the reset, responsive layout, print rules, fonts, and theme variables. Main variables are `--paper`, `--surface`, `--ink`, `--muted`, `--bronze`, `--gold`, `--line`, `--dark`, `--serif`, and `--radius`. Override variables in the consuming app after importing the package stylesheet; add app-specific selectors to the app's own stylesheet. Keep visible `:focus-visible` indicators, the 320px minimum layout, reduced-motion considerations, and print behavior in mind when editing.

## Updating app snapshots

Each template contains `vendor/react-ui`, a copy of this repository at a recorded source revision. Do not edit those copies independently. From this repository, sync a chosen app snapshot with the real script and its required source SHA:

```sh
node scripts/sync-snapshot.mjs . ../react-proposal-template/vendor/react-ui --source-sha "$(git rev-parse HEAD)"
```

For the quote template, replace the target with `../react-quote-template/vendor/react-ui`. The script clears and repopulates the target, excluding `node_modules`, `dist`, and `.git`, then writes `SNAPSHOT-PROVENANCE.md`. Review the target diff, run the app's checks from its directory, and keep the provenance revision aligned with the synced source. The target argument must be the desired `vendor/react-ui` directory.

See [docs/authoring.md](docs/authoring.md) for maintenance, accessibility, and snapshot workflow details. Third-party notices are in [LICENSES.md](LICENSES.md); the design reference is `179YoungStSmartify/react-project-proposal` at revision `bf0b54f4db264f17318da75ad7fc1f1049f1caf9`. Consumer snapshots contain their own generated `SNAPSHOT-PROVENANCE.md` tied to the library commit.

## Mobile-first layout contract

The shared stylesheet starts with a single-column, fluid layout and adds two-column cards from 901px. Keep words and currency values intact, allow long metadata to wrap, and keep buttons, menu controls, and navigation links at least 44px high. Browser checks should cover 320, 360, 375, 390, 430, 768, 1024, and 1440px, portrait and landscape, text enlargement, keyboard dialog focus, and no clipped or horizontally hidden key content.

Bronze has separate decorative (`--bronze`) and readable (`--bronze-text`) roles; the text role is at least 4.5:1 against paper. Static cards stay still; add `card--interactive` only when a card itself is interactive. `Button` merges caller `className` with its base and variant classes.

Shared spacing roles are `--space-xs`, `--space-sm`, `--space-md`, and `--space-lg`; shared text roles are `--type-body`, `--type-small`, and `--type-section`.

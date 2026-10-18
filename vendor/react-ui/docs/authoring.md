# Authoring the shared UI

## Where changes belong

- `src/index.tsx`: exported React components and their prop types.
- `src/styles.css`: fonts, CSS variables, component classes, responsive breakpoints, focus styling, and print rules.
- `src/brand-mark.svg`: approved shared header mark asset loaded by `BrandMark` through a module-relative URL.
- `tests/tokens.test.mjs`: automated token and stylesheet contract checks.
- `scripts/sync-snapshot.mjs`: copies a selected library checkout into an app's `vendor/react-ui` folder and writes its provenance record.

Keep project-specific page content and business rules in the consuming app. Add a shared component only when it expresses reusable structure or behavior. Export named components from `src/index.tsx` and document their actual props in the README.

`Brand` combines the company name and tagline with the decorative `BrandMark`; keep the text as the link's accessible name and keep the image hidden from assistive technology. Preserve the mark artwork and intrinsic dimensions when adjusting its responsive display size.

## Accessibility and visual review

Use native headings, landmarks, links, buttons, and tables; add accessible names to controls and regions. Keep the skip link, focus-visible outline, dialog keyboard behavior, and responsive navigation intact. Review consuming apps at 320px and wider, with keyboard-only navigation and screen-reader landmarks. Check both screen and print output after changing shared CSS. There is no component storybook or UI dev script in this repository; preview changes in a consuming app.

`Shell` includes the 480px back-to-top control and restores focus to the main landmark before scrolling. `Section` adds its entrance only after an intersection is observed; unobserved content stays readable, and reduced motion disables entrances and smooth scrolling. The control is hidden in print, with touch-safe sizing and safe-area offsets.

## Snapshot maintenance

Run from the `react-ui` checkout, substituting the app target as needed:

```sh
node scripts/sync-snapshot.mjs . ../react-proposal-template/vendor/react-ui --source-sha "$(git rev-parse HEAD)"
```

The script requires source directory, target directory, and `--source-sha <git-sha>`. It removes existing target entries before copying; excluded are `node_modules`, `dist`, and `.git`. Inspect the snapshot diff and provenance record, then run checks in each affected app. Templates use `file:vendor/react-ui`, so `npm ci` after synchronization refreshes their local installed package. Do not include client data in the library or examples.

Use `--bronze` for decorative rules and `--bronze-text` for readable bronze text on paper. Static cards do not lift on hover; opt into card feedback with `card--interactive`. Button custom classes are additive to the shared base and variant. Keep transforms suppressed for reduced motion and print, and ensure focus remains distinct on both paper and charcoal.

Use the shared spacing roles `--space-xs` through `--space-lg` for consistent gaps, and `--type-body`, `--type-small`, and `--type-section` for common text sizes. The imported DM Sans Variable and Playfair Display Variable families remain the sans and serif roles.

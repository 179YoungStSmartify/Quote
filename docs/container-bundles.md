# Container app bundles

The `app-bundles.yml` workflow builds a separate root-hosted copy of this app for container images. The GitHub Pages build remains at `/Quote/`; the bundle is built independently with `VITE_BASE_PATH=/` and contains `index.html`, `assets/`, and `quote.pdf` at the archive root. It does not change the Pages workflow or its deployment path.

The first stable host bundle is `v0.0.1`. An authorized maintainer must create/publish it only after container support has merged to `main`, and its tag must resolve to that post-merge container-ready commit. Do not bootstrap it from an earlier `main` commit.

## Publication channels

- Each successful `main` push publishes `app.tar.gz` and `app-manifest.json` on a prerelease named `app-main-{full-commit-SHA}`. The workflow tests that exact commit and only exposes the prerelease after both uploaded assets have been read back and verified. The workflow does not overwrite a verified completed pair; GitHub repository administrators can still manually change releases and assets.
- Publishing a stable GitHub release builds the commit resolved from that release's tag and uploads the same two assets to that existing release. The workflow does not create or rename stable releases. The release may be visible before its bundle is ready; a container should keep its last working app until the bundle appears and passes verification.
- `workflow_dispatch` can retry the current trusted `main` build or a named existing stable release. Dispatch must run from `main`; release mode accepts only a published, non-draft, non-prerelease release. This is also the bootstrap/retry path for missed events.
- Drafts, prereleases, and `app-main-*` releases are ignored by the stable-release trigger. Pull requests and fork builds do not publish.

`app-manifest.json` has exactly these protocol fields: `schema` (`1`), `commit` (full 40-character source SHA), `sha256` (full SHA-256 of the exact compressed archive), `bundle` (`app.tar.gz`), and `base_path` (`/`). Consumers should validate the complete manifest and archive digest before extraction. The manifest contract is shared with the reusable static-app host; this repository implements the app producer side.

## Validation and recovery

Before packaging, CI runs the standard install, unit, type, lint, `/Quote/` build, and Playwright suite. It then rebuilds at `/`, runs `scripts/root-smoke.mjs` against an ephemeral local root server, and packages only the validated `dist` tree. The smoke checks the root page and loaded assets, the root PDF response/header and download filename, and browser/network errors. `python3 -m unittest discover -s tests -p 'test_bundle.py'` covers packaging and manifest failures without extra packages. The packager requires `index.html`, at least one file under `assets/`, and a valid `quote.pdf`; it rejects non-root asset URLs, noncanonical/duplicate archive names, symlinks, malformed archive entries, duplicate JSON keys, noninteger schema values, and digest mismatches.

For a trusted local build after the regular `/Quote/` checks, build root output and package a known full source SHA:

```sh
VITE_BASE_PATH=/ npm run build
npx playwright install chromium
node scripts/root-smoke.mjs dist
python3 scripts/package_app.py package --dist dist --output bundle --commit "$(git rev-parse HEAD)"
python3 scripts/package_app.py verify --archive bundle/app.tar.gz --manifest bundle/app-manifest.json
```

If a main commit advances before its prerelease assets are ready, consumers stay on their last working app and retry the lookup. Rerun the workflow from its Actions page with source `main`. To recover a stable release, dispatch source `release` with that existing tag. Completed main and stable bundles are verified against their manifest and exact source commit and are never overwritten, including on rebuilds where PDF creation timestamps may differ. An incomplete failed upload can be retried. Trusted packaging tools are preserved from the workflow's `main` checkout, so an older approved source tag can be built without those tools being present in the tag itself.

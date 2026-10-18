# Docker deployment reference

The long-lived host downloads already-tested app bundles; it does not clone or build the app on the server. GitHub Actions builds the app and PDF. Sam supplies Docker, DNS, TLS and the external reverse proxy. No Docker socket, privileged mode, Node.js, Git or build tools are required on the host.

### Images and update channels

- `ghcr.io/perspectiveliving/static-app-host:main` — testing: follows the latest `main` commit **only after** its matching tested bundle is published.
- `ghcr.io/perspectiveliving/static-app-host:release` — production: follows the latest published stable Quote release, excluding drafts and prereleases.

These are two variants of the same reusable host, not images containing a fixed Quote version. Normal app updates do not require a container restart. Both serve HTTP on container port `8080` at the domain root `/`, **not `/Quote/`**. Existing GitHub Pages deployment remains separate and unchanged.

### Registry access and optional app token

If the GHCR package is private, first authenticate Docker using an account/token with read access to that package:

```sh
docker login ghcr.io
```

Registry login is performed on the Docker host. It is separate from the optional runtime `GITHUB_TOKEN`, which reads app versions from GitHub. The Quote repository is public, so app downloads can work without that runtime token. For a private app repository, use a repository-scoped read-only token. Never bake either credential into an image or commit it to this repository.

The host accepts **the `GITHUB_TOKEN` environment variable, not a token file**. The `--env GITHUB_TOKEN` option below forwards an already-exported host variable without putting its value in the command. Leave it unset for anonymous public downloads. Environment values remain visible to Docker administrators; use least-privilege credentials and never paste them into logs or chat. Anonymous polling is rate-limited per public IP; use a read-only token for frequent updates, or increase the interval, especially when running both channels behind the same IP.

### Start testing and production with plain Docker

Create separate persistent volumes; **never share one volume between the two containers**:

```sh
docker volume create quote-main-data
docker volume create quote-release-data
docker pull ghcr.io/perspectiveliving/static-app-host:main
docker pull ghcr.io/perspectiveliving/static-app-host:release

# Testing: follow tested main builds.
docker run -d --name quote-main --restart unless-stopped \
  --publish 127.0.0.1:8080:8080 \
  --volume quote-main-data:/data \
  --env APP_REPO=179YoungStSmartify/Quote \
  --env POLL_INTERVAL_SECONDS=300 \
  --env GITHUB_TOKEN \
  ghcr.io/perspectiveliving/static-app-host:main

# Production: stable releases only.
docker run -d --name quote-release --restart unless-stopped \
  --publish 127.0.0.1:8081:8080 \
  --volume quote-release-data:/data \
  --env APP_REPO=179YoungStSmartify/Quote \
  --env POLL_INTERVAL_SECONDS=300 \
  --env GITHUB_TOKEN \
  ghcr.io/perspectiveliving/static-app-host:release
```

The examples poll every 300 seconds to reduce anonymous API usage. With an authenticated app token, `120` is suitable for more frequent checks. The image defaults to 120 seconds if the variable is omitted. Rate-limit responses trigger backoff rather than replacing the running app.

The examples bind host ports to loopback for a proxy running on the same host. Proxy the testing hostname to `127.0.0.1:8080` and production to `127.0.0.1:8081`. Do not add `/Quote/` to the upstream URL.

If the reverse proxy is another Docker container, attach the proxy and app containers to a shared user-defined Docker network instead; proxy to `quote-main:8080` or `quote-release:8080`. A proxy container's `127.0.0.1` is **not** the Docker host. For example, create a network with `docker network create quote-web`, attach the existing proxy with `docker network connect quote-web <proxy-container>`, and add `--network quote-web` when starting these containers. Port publication can then be omitted if access is only through that network.

The images run as UID/GID `10001`. Fresh named volumes initialize with suitable permissions. If using bind mounts instead, provision the directories with ownership/permissions allowing that UID to write; do not work around permissions with privileged mode or a root container.

### Confirm readiness and the running app version

```sh
docker logs --tail 50 quote-main
docker logs --tail 50 quote-release
curl --fail http://127.0.0.1:8080/__host/ready
curl --fail http://127.0.0.1:8081/__host/ready
curl --fail http://127.0.0.1:8081/__host/version
docker inspect --format '{{.State.Health.Status}}' quote-release
```

`/__host/health` is process liveness; `/__host/ready` returns 200 only after a valid app is active and is used by Docker's health check. `/__host/version` reports the selected channel, running commit, update status and sanitized error. On first boot, readiness is 503 until a matching complete bundle is available. Release mode waits for a published stable release; it never silently serves `main` instead. A release may be visible briefly before CI finishes uploading its bundle.

Updates are downloaded and checksum-verified in staging before an atomic switch. The current version stays online after network, checksum or archive failures. `/data` preserves the current app across restarts and image upgrades, with previous versions retained for recovery. Old hashed assets remain reachable for the active and two retained previous builds. This retention is bounded, not indefinite support for arbitrarily old browser tabs.

### Upgrade the host image later

Ordinary Quote updates are automatic. To upgrade the web server/updater image itself, pull the desired tag, stop and remove only its container, and repeat the same `docker run` command using the **existing** named volume:

```sh
docker pull ghcr.io/perspectiveliving/static-app-host:release
docker stop quote-release
docker rm quote-release
# Repeat the production docker run command above; retain quote-release-data.
```

Do not remove the data volume. For rollback or first-boot/update troubleshooting, see the [host operator guide](https://github.com/PerspectiveLiving/static-app-host) (repository access may be required). Bundle publication and recovery are documented in [container bundle publication](container-bundles.md).

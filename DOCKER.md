# Docker

Start the local stack from the repository root:

```sh
docker compose up --build
```

Scale background services without changing source code:

```sh
docker compose up --build --scale ai-worker=3
docker compose up --build --scale outbox-dispatcher=2
docker compose up --build --scale ai-worker=3 --scale outbox-dispatcher=2
```

Stop the stack:

```sh
docker compose down
```

The host publishes the web application at `http://localhost:5173`, the HTTP API at `http://localhost:4000`, the WebSocket service at `ws://localhost:4500/ws`, Postgres at `localhost:5432`, and Valkey at `localhost:6379`.

Containers use Compose DNS names instead: `postgres:5432` and `valkey:6379`. The HTTP API, WebSocket service, outbox dispatcher, and AI worker receive their existing environment configuration from the local `.env` file; Compose overrides database and Redis URLs for container networking. The frontend receives `VITE_HTTP_URL` and `VITE_WS_URL` at build time so the browser connects through the published local ports.

The web image builds the Vite application with Bun and serves it through nginx. nginx falls back to `index.html`, so direct requests to SPA routes such as `/cases` and `/cases/:id` work after browser refreshes.

Azure Blob authentication remains unchanged. On the host, `DefaultAzureCredential` can use `az login`. A local Docker container does not normally inherit Azure CLI credentials, so Blob-dependent processing may not be runnable in the container without a supported credential source. In Azure later, the same `DefaultAzureCredential` flow can use Managed Identity. No storage keys, connection strings, or long-lived SAS tokens are used by this setup.

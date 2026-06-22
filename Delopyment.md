# Production Considerations

Guidance for running Sentinel in a production environment monitoring real contracts and funds.

## Security

- **Secrets management**: Never store `.env` files with production credentials in version control. Use a secrets manager (e.g. Docker secrets, HashiCorp Vault, cloud provider secret stores) and inject values at runtime.
- **Database credentials**: Use a dedicated, least-privilege database user for Sentinel rather than a superuser.
- **Webhook/channel secrets**: Rotate Discord/Telegram/webhook credentials periodically. Outgoing webhook payloads are signed with HMAC — see [API docs: webhook payloads](../api/examples/webhook-payloads.md) — verify signatures on the receiving end.
- **API access tokens**: Treat bearer tokens as sensitive. Use short expiry (`expiresIn`) and refresh tokens rather than long-lived static tokens.
- **Network exposure**: Only expose the dashboard and API behind a reverse proxy with TLS (see below). The bot/mempool listener service does not need to be publicly reachable.

## TLS / Reverse Proxy

Run Sentinel behind a reverse proxy (e.g. nginx, Caddy, or a cloud load balancer) to terminate TLS and handle routing:

```
Internet → [TLS termination / reverse proxy] → dashboard (apps/dashboard)
                                              → API (apps/bot)
```

Ensure `Authorization` headers are forwarded and not stripped by the proxy.

## Database

- Use a managed PostgreSQL instance (RDS, Cloud SQL, etc.) for durability and automated backups, rather than a database container with a local volume.
- Run `npx prisma migrate deploy` (not `migrate dev`) for production migrations — `migrate dev` can prompt interactively and is intended for development.
- Configure regular automated backups and test restores.
- Enable connection pooling (e.g. PgBouncer) if running multiple bot/dashboard instances.

## RPC Node Reliability

Sentinel's mempool listener depends on continuous RPC connectivity:

- Use a reliable RPC provider with WebSocket support for mempool subscriptions, or run your own node.
- Configure fallback/secondary RPC endpoints where supported, to avoid gaps in monitoring during provider outages.
- Monitor RPC connection health as part of your observability setup (see below) — a disconnected listener means **no alerts will fire**.

## Observability

Sentinel includes OpenTelemetry support (`observability/`):

- Set `OTEL_ENABLED=true` and point `OTEL_EXPORTER_URL` at your OTLP collector.
- Set a meaningful `OTEL_SERVICE_NAME` per environment (e.g. `sentinel-prod`, `sentinel-staging`) to distinguish traces/metrics.
- Forward traces and metrics to your existing stack (e.g. Grafana/Prometheus, Datadog, Honeycomb) via the collector.
- Alert on:
  - RPC connection drops / reconnect loops
  - Notification dispatch failures (Discord/Telegram/webhook errors)
  - Database connection errors
  - Elevated alert-processing latency

## Notification Channel Redundancy

- Configure more than one notification channel per critical rule (e.g. Discord **and** a webhook to PagerDuty) so a single channel outage doesn't silence critical alerts.
- Use [`POST /v1/notifications/channels/{id}/test`](../api/endpoints/notifications.md) after any credential rotation to confirm channels are still working.
- Monitor webhook delivery retries — Sentinel retries failed webhook deliveries up to 3 times with exponential backoff; persistent failures should page an operator.

## Scaling

- The bot (mempool listener) is generally a single long-lived process per monitored network — avoid running multiple instances against the same RPC subscription to prevent duplicate alerts.
- The dashboard/API can be scaled horizontally behind a load balancer; ensure sessions/tokens are stateless (JWT-based) so any instance can serve any request.
- Use connection pooling at the database layer when scaling API instances.

## Audit & Compliance

- Audit logs ([API docs](../api/endpoints/audit-logs.md)) record rule changes, watchlist changes, acknowledgements, and auth events — ensure these are retained and, ideally, shipped to a separate log store for tamper resistance.
- Restrict who can modify rules and watchlists in production; review audit logs periodically for unexpected changes.

## Upgrade Process

1. Review the [ROADMAP.md](https://github.com/MD-Creative-Production/Sentinel/blob/main/ROADMAP.md) and release notes for breaking changes.
2. Take a database backup before upgrading.
3. Deploy the new image/build to a staging environment first.
4. Run `npx prisma migrate deploy` against staging, verify, then repeat in production.
5. Roll out the new version with a brief monitoring gap minimized (e.g. blue/green or rolling restart) — be aware that any downtime in the bot service is a monitoring gap.

## Pre-Launch Checklist

- [ ] Secrets stored in a secrets manager, not in plain `.env` files on disk
- [ ] TLS terminated in front of dashboard/API
- [ ] Managed PostgreSQL with automated backups configured
- [ ] At least one notification channel tested end-to-end
- [ ] OpenTelemetry enabled and wired to your monitoring stack
- [ ] RPC endpoint(s) confirmed stable, with fallback configured if available
- [ ] Audit log retention/export configured
- [ ] Upgrade/rollback procedure documented and tested in staging

# Docker Deployment

Sentinel ships with a `Dockerfile` and `docker-compose.yml` for containerized deployment, which bundles the application services alongside PostgreSQL.

## 1. Prerequisites

- Docker Engine 24+
- Docker Compose v2 (`docker compose` CLI)
- Git

## 2. Clone the repository

```bash
git clone https://github.com/MD-Creative-Production/Sentinel.git
cd Sentinel
```

## 3. Configure environment variables

Sentinel provides a Docker-specific environment template:

```bash
cp .env.docker .env
```

Review and update the following before starting:

| Variable              | Description                  | Notes                                                                                              |
| --------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`        | PostgreSQL connection string | Should point to the `db` service name, e.g. `postgresql://sentinel:your_password@db:5432/sentinel` |
| `DATABASE_HOST`       | Database host                | Use the Compose service name (`db`), not `localhost`                                               |
| `DATABASE_PASSWORD`   | Database password            | Set a strong value — also used by the `db` service                                                 |
| `DISCORD_WEBHOOK_URL` | Discord webhook for alerts   | Required for alert delivery                                                                        |
| `OTEL_ENABLED`        | Enable OpenTelemetry tracing | `true` if running the observability stack                                                          |
| `OTEL_EXPORTER_URL`   | OTLP collector endpoint      | Point to your collector's container/service name                                                   |

> **Tip:** `.env.docker` is a template, not a secrets store. Do not commit a populated `.env` to version control.

## 4. Build and start the stack

```bash
docker compose up -d --build
```

This will:

1. Build the Sentinel application image from the `Dockerfile`.
2. Start a PostgreSQL container (`db` service).
3. Start the bot and dashboard services as defined in `docker-compose.yml`.

## 5. Run database migrations

Migrations are not automatically applied on container start by default. Run them inside the running container:

```bash
docker compose exec app npx prisma migrate deploy
```

(Replace `app` with the actual service name from `docker-compose.yml` if different — check with `docker compose ps`.)

## 6. Verify the deployment

```bash
# View running services
docker compose ps

# Tail logs
docker compose logs -f

# Tail logs for a specific service
docker compose logs -f app
```

Look for the `Mempool Listener` startup message in the bot's logs, and confirm the dashboard is reachable on its mapped port (check `docker-compose.yml` for the port mapping, typically `3000:3000`).

## 7. Common operations

```bash
# Stop the stack
docker compose down

# Stop and remove volumes (WARNING: deletes database data)
docker compose down -v

# Rebuild after a code change
docker compose up -d --build

# Restart a single service
docker compose restart app

# Open a shell in the app container
docker compose exec app sh
```

## 8. Updating

```bash
git pull
docker compose up -d --build
docker compose exec app npx prisma migrate deploy
```

## Additional References

For environment variable details not covered here, see `.env.example` and `.env.docker` in the repository root, and [DOCKER.md](https://github.com/MD-Creative-Production/Sentinel/blob/main/DOCKER.md) / [DOCKER-SETUP.md](https://github.com/MD-Creative-Production/Sentinel/blob/main/DOCKER-SETUP.md) for any image-specific notes.

## Troubleshooting

| Issue                                 | Likely Cause                                                                                                             |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `app` container restarts in a loop    | Database not ready yet — ensure `db` healthcheck passes before `app` starts (check `depends_on` in `docker-compose.yml`) |
| Migrations fail with connection error | `DATABASE_HOST` must be the Compose service name (`db`), not `localhost`                                                 |
| Alerts not dispatching                | Verify `DISCORD_WEBHOOK_URL` / other channel credentials are set in `.env` and the container was rebuilt after changes   |
| Port conflicts on `up`                | Another process is using the mapped port — change the host-side port in `docker-compose.yml`                             |

# Production Considerations

Guidance for running Sentinel in a production environment monitoring real contracts and funds.

## Security

- **Secrets management**: Never store `.env` files with production credentials in version control. Use a secrets manager (e.g. Docker secrets, HashiCorp Vault, cloud provider secret stores) and inject values at runtime.
- **Database credentials**: Use a dedicated, least-privilege database user for Sentinel rather than a superuser.
- **Webhook/channel secrets**: Rotate Discord/Telegram/webhook credentials periodically. Outgoing webhook payloads are signed with HMAC — see [API docs: webhook payloads](../api/examples/webhook-payloads.md) — verify signatures on the receiving end.
- **API access tokens**: Treat bearer tokens as sensitive. Use short expiry (`expiresIn`) and refresh tokens rather than long-lived static tokens.
- **Network exposure**: Only expose the dashboard and API behind a reverse proxy with TLS (see below). The bot/mempool listener service does not need to be publicly reachable.

## TLS / Reverse Proxy

Run Sentinel behind a reverse proxy (e.g. nginx, Caddy, or a cloud load balancer) to terminate TLS and handle routing:

```
Internet → [TLS termination / reverse proxy] → dashboard (apps/dashboard)
                                              → API (apps/bot)
```

Ensure `Authorization` headers are forwarded and not stripped by the proxy.

## Database

- Use a managed PostgreSQL instance (RDS, Cloud SQL, etc.) for durability and automated backups, rather than a database container with a local volume.
- Run `npx prisma migrate deploy` (not `migrate dev`) for production migrations — `migrate dev` can prompt interactively and is intended for development.
- Configure regular automated backups and test restores.
- Enable connection pooling (e.g. PgBouncer) if running multiple bot/dashboard instances.

## RPC Node Reliability

Sentinel's mempool listener depends on continuous RPC connectivity:

- Use a reliable RPC provider with WebSocket support for mempool subscriptions, or run your own node.
- Configure fallback/secondary RPC endpoints where supported, to avoid gaps in monitoring during provider outages.
- Monitor RPC connection health as part of your observability setup (see below) — a disconnected listener means **no alerts will fire**.

## Observability

Sentinel includes OpenTelemetry support (`observability/`):

- Set `OTEL_ENABLED=true` and point `OTEL_EXPORTER_URL` at your OTLP collector.
- Set a meaningful `OTEL_SERVICE_NAME` per environment (e.g. `sentinel-prod`, `sentinel-staging`) to distinguish traces/metrics.
- Forward traces and metrics to your existing stack (e.g. Grafana/Prometheus, Datadog, Honeycomb) via the collector.
- Alert on:
  - RPC connection drops / reconnect loops
  - Notification dispatch failures (Discord/Telegram/webhook errors)
  - Database connection errors
  - Elevated alert-processing latency

## Notification Channel Redundancy

- Configure more than one notification channel per critical rule (e.g. Discord **and** a webhook to PagerDuty) so a single channel outage doesn't silence critical alerts.
- Use [`POST /v1/notifications/channels/{id}/test`](../api/endpoints/notifications.md) after any credential rotation to confirm channels are still working.
- Monitor webhook delivery retries — Sentinel retries failed webhook deliveries up to 3 times with exponential backoff; persistent failures should page an operator.

## Scaling

- The bot (mempool listener) is generally a single long-lived process per monitored network — avoid running multiple instances against the same RPC subscription to prevent duplicate alerts.
- The dashboard/API can be scaled horizontally behind a load balancer; ensure sessions/tokens are stateless (JWT-based) so any instance can serve any request.
- Use connection pooling at the database layer when scaling API instances.

## Audit & Compliance

- Audit logs ([API docs](../api/endpoints/audit-logs.md)) record rule changes, watchlist changes, acknowledgements, and auth events — ensure these are retained and, ideally, shipped to a separate log store for tamper resistance.
- Restrict who can modify rules and watchlists in production; review audit logs periodically for unexpected changes.

## Upgrade Process

1. Review the [ROADMAP.md](https://github.com/MD-Creative-Production/Sentinel/blob/main/ROADMAP.md) and release notes for breaking changes.
2. Take a database backup before upgrading.
3. Deploy the new image/build to a staging environment first.
4. Run `npx prisma migrate deploy` against staging, verify, then repeat in production.
5. Roll out the new version with a brief monitoring gap minimized (e.g. blue/green or rolling restart) — be aware that any downtime in the bot service is a monitoring gap.

## Pre-Launch Checklist

- [ ] Secrets stored in a secrets manager, not in plain `.env` files on disk
- [ ] TLS terminated in front of dashboard/API
- [ ] Managed PostgreSQL with automated backups configured
- [ ] At least one notification channel tested end-to-end
- [ ] OpenTelemetry enabled and wired to your monitoring stack
- [ ] RPC endpoint(s) confirmed stable, with fallback configured if available
- [ ] Audit log retention/export configured
- [ ] Upgrade/rollback procedure documented and tested in staging

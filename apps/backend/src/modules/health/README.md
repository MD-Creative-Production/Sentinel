# Health Module

Exposes HTTP endpoints for readiness and liveness probes.

## Endpoints

| Method | Path               | Description                                     |
| ------ | ------------------ | ----------------------------------------------- |
| GET    | `/api/health`      | Full dependency check — database, queue, etc.   |
| GET    | `/api/health/live` | Lightweight liveness probe (process is running) |

### Sample response — `/api/health`

```json
{
  "status": "up",
  "timestamp": "2026-06-13T20:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "dependencies": {
    "database": {
      "status": "up",
      "responseTimeMs": 4
    }
  }
}
```

`status` is `"down"` and HTTP 503 is returned when any dependency is unhealthy.

## Adding a new dependency check

1. Add a private `checkXxx(): Promise<DependencyHealthResult>` method to `HealthService`.
2. Call it inside `check()` and merge the result into `dependencies`.

## Closes

GitHub issue #84 — Add Health Check Endpoint

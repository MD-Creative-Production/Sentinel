# Watchlists

Manage contracts/addresses monitored by Sentinel. See [schemas/watchlist.md](../schemas/watchlist.md) for the object definition.

## GET /v1/watchlists

List all watchlist entries.

### Query Parameters

| Param     | Type    | Description                 |
| --------- | ------- | --------------------------- |
| `page`    | integer | Page number (default 1)     |
| `limit`   | integer | Items per page (default 20) |
| `network` | string  | Filter by network           |
| `enabled` | boolean | Filter by enabled status    |

### Response `200 OK`

```json
{
  "data": [
    {
      "id": "8f14e45f-ceea-4b5e-9c3e-1a2b3c4d5e6f",
      "name": "Treasury Vault",
      "network": "ethereum",
      "address": "0x1234567890abcdef1234567890abcdef12345678",
      "tags": ["treasury", "high-value"],
      "enabled": true,
      "createdAt": "2026-06-01T08:00:00Z",
      "updatedAt": "2026-06-10T12:30:00Z"
    }
  ],
  "meta": { "total": 1, "page": 1, "limit": 20 }
}
```

---

## POST /v1/watchlists

Add a new address to the watchlist.

### Request

```json
{
  "name": "Treasury Vault",
  "network": "ethereum",
  "address": "0x1234567890abcdef1234567890abcdef12345678",
  "tags": ["treasury", "high-value"]
}
```

### Response `201 Created`

Returns the created watchlist object (see [schemas/watchlist.md](../schemas/watchlist.md)).

### Errors

| Status | Cause                                    |
| ------ | ---------------------------------------- |
| 400    | Invalid address format or missing fields |
| 409    | Address already exists on this network   |

---

## GET /v1/watchlists/{id}

Retrieve a single watchlist entry.

### Response `200 OK`

Returns a watchlist object.

### Errors

| Status | Cause                     |
| ------ | ------------------------- |
| 404    | Watchlist entry not found |

---

## PATCH /v1/watchlists/{id}

Update a watchlist entry.

### Request

```json
{
  "name": "Primary Treasury Vault",
  "enabled": false
}
```

### Response `200 OK`

Returns the updated watchlist object.

---

## DELETE /v1/watchlists/{id}

Remove an entry from the watchlist. Associated rules are also disabled.

### Response `204 No Content`

# Rules

Manage threat detection rules. See [schemas/rule.md](../schemas/rule.md) for the object definition.

## GET /v1/rules

List all detection rules.

### Query Parameters

| Param         | Type    | Description                 |
| ------------- | ------- | --------------------------- |
| `page`        | integer | Page number (default 1)     |
| `limit`       | integer | Items per page (default 20) |
| `watchlistId` | string  | Filter by watchlist entry   |
| `severity`    | string  | Filter by severity          |

### Response `200 OK`

```json
{
  "data": [
    {
      "id": "3a7c1e2d-4f5b-4a8c-9d0e-1f2a3b4c5d6e",
      "name": "Ownership Transfer Detection",
      "watchlistId": "8f14e45f-ceea-4b5e-9c3e-1a2b3c4d5e6f",
      "signature": "renounceOwnership",
      "severity": "critical",
      "channels": ["discord", "telegram"],
      "enabled": true,
      "createdAt": "2026-06-01T08:00:00Z",
      "updatedAt": "2026-06-10T12:30:00Z"
    }
  ],
  "meta": { "total": 1, "page": 1, "limit": 20 }
}
```

---

## POST /v1/rules

Create a new detection rule.

### Request

```json
{
  "name": "Ownership Transfer Detection",
  "watchlistId": "8f14e45f-ceea-4b5e-9c3e-1a2b3c4d5e6f",
  "signature": "renounceOwnership",
  "severity": "critical",
  "channels": ["discord", "telegram"]
}
```

### Response `201 Created`

Returns the created rule object (see [schemas/rule.md](../schemas/rule.md)).

### Errors

| Status | Cause                               |
| ------ | ----------------------------------- |
| 400    | Invalid signature or missing fields |
| 404    | `watchlistId` does not exist        |

---

## GET /v1/rules/{id}

Retrieve a single rule.

### Response `200 OK`

Returns a rule object.

---

## PATCH /v1/rules/{id}

Update a rule.

### Request

```json
{
  "severity": "high",
  "enabled": false
}
```

### Response `200 OK`

Returns the updated rule object.

---

## DELETE /v1/rules/{id}

Remove a rule.

### Response `204 No Content`

# Alerts

Read alert history and detail. Alerts are created automatically by the bot when a rule matches a pending transaction. See [schemas/alert.md](../schemas/alert.md) for the object definition.

## GET /v1/alerts

List alerts.

### Query Parameters

| Param         | Type    | Description                                                          |
| ------------- | ------- | -------------------------------------------------------------------- |
| `page`        | integer | Page number (default 1)                                              |
| `limit`       | integer | Items per page (default 20)                                          |
| `watchlistId` | string  | Filter by watchlist entry                                            |
| `ruleId`      | string  | Filter by rule                                                       |
| `severity`    | string  | Filter by severity                                                   |
| `status`      | string  | Filter by status (`pending`, `confirmed`, `dropped`, `acknowledged`) |
| `from`        | string  | ISO date — only alerts detected after this time                      |
| `to`          | string  | ISO date — only alerts detected before this time                     |

### Response `200 OK`

```json
{
  "data": [
    {
      "id": "c9d8e7f6-1a2b-4c3d-8e9f-0a1b2c3d4e5f",
      "ruleId": "3a7c1e2d-4f5b-4a8c-9d0e-1f2a3b4c5d6e",
      "watchlistId": "8f14e45f-ceea-4b5e-9c3e-1a2b3c4d5e6f",
      "network": "ethereum",
      "severity": "critical",
      "title": "Critical Alert: Ownership Transfer Detected",
      "description": "Contract 0x1234...abcd is attempting to transfer ownership to 0x5678...efgh.",
      "txHash": "0xabc123...",
      "status": "pending",
      "detectedAt": "2026-06-14T10:00:00Z",
      "dispatchedChannels": ["discord"]
    }
  ],
  "meta": { "total": 1, "page": 1, "limit": 20 }
}
```

---

## GET /v1/alerts/{id}

Retrieve a single alert.

### Response `200 OK`

Returns an alert object.

### Errors

| Status | Cause           |
| ------ | --------------- |
| 404    | Alert not found |

---

## PATCH /v1/alerts/{id}/acknowledge

Mark an alert as acknowledged (reviewed by a team member).

### Response `200 OK`

Returns the updated alert object with `status: "acknowledged"`.

# Notifications

Configure and manage notification channels used to dispatch alerts (Discord, Telegram, Webhooks, PagerDuty).

## GET /v1/notifications/channels

List configured notification channels.

### Response `200 OK`

```json
{
  "data": [
    {
      "id": "1b2c3d4e-5f6a-7b8c-9d0e-1f2a3b4c5d6e",
      "type": "discord",
      "name": "Security Team Discord",
      "config": {
        "webhookUrl": "https://discord.com/api/webhooks/***"
      },
      "enabled": true,
      "createdAt": "2026-06-01T08:00:00Z"
    }
  ]
}
```

> **Note:** Sensitive fields (e.g. webhook URLs, bot tokens) are masked in list/read responses.

---

## POST /v1/notifications/channels

Add a new notification channel.

### Request

```json
{
  "type": "discord",
  "name": "Security Team Discord",
  "config": {
    "webhookUrl": "https://discord.com/api/webhooks/xxxx/yyyy"
  }
}
```

### Channel Types

| Type        | Required `config` fields  |
| ----------- | ------------------------- |
| `discord`   | `webhookUrl`              |
| `telegram`  | `botToken`, `chatId`      |
| `webhook`   | `url`, optional `headers` |
| `pagerduty` | `integrationKey`          |

### Response `201 Created`

Returns the created channel object (with sensitive fields masked).

---

## PATCH /v1/notifications/channels/{id}

Update a channel's configuration or enabled status.

### Request

```json
{
  "enabled": false
}
```

### Response `200 OK`

---

## DELETE /v1/notifications/channels/{id}

Remove a notification channel. Rules referencing this channel will no longer dispatch to it.

### Response `204 No Content`

---

## POST /v1/notifications/channels/{id}/test

Send a test notification to verify channel configuration.

### Response `200 OK`

```json
{
  "success": true,
  "message": "Test notification sent"
}
```

# Audit Logs

Read-only access to the system audit trail (rule changes, watchlist changes, acknowledgements, auth events).

## GET /v1/audit-logs

List audit log entries.

### Query Parameters

| Param     | Type    | Description                                                                            |
| --------- | ------- | -------------------------------------------------------------------------------------- |
| `page`    | integer | Page number (default 1)                                                                |
| `limit`   | integer | Items per page (default 20)                                                            |
| `actorId` | string  | Filter by user who performed the action                                                |
| `action`  | string  | Filter by action type (e.g. `rule.created`, `watchlist.updated`, `alert.acknowledged`) |
| `from`    | string  | ISO date — entries after this time                                                     |
| `to`      | string  | ISO date — entries before this time                                                    |

### Response `200 OK`

```json
{
  "data": [
    {
      "id": "e1f2a3b4-c5d6-7e8f-9a0b-1c2d3e4f5a6b",
      "actorId": "0d1e2f3a-4b5c-6d7e-8f9a-0b1c2d3e4f5a",
      "action": "rule.created",
      "resourceType": "rule",
      "resourceId": "3a7c1e2d-4f5b-4a8c-9d0e-1f2a3b4c5d6e",
      "metadata": {
        "name": "Ownership Transfer Detection"
      },
      "createdAt": "2026-06-01T08:00:00Z"
    }
  ],
  "meta": { "total": 1, "page": 1, "limit": 20 }
}
```

## Fields

| Field          | Type          | Description                                                                      |
| -------------- | ------------- | -------------------------------------------------------------------------------- |
| `id`           | string (UUID) | Unique identifier                                                                |
| `actorId`      | string (UUID) | User who performed the action                                                    |
| `action`       | string        | Dot-notation action name, e.g. `resource.verb`                                   |
| `resourceType` | string        | Type of resource affected (`watchlist`, `rule`, `alert`, `notification-channel`) |
| `resourceId`   | string (UUID) | ID of the affected resource                                                      |
| `metadata`     | object        | Action-specific additional context                                               |
| `createdAt`    | string        | Timestamp of the action                                                          |

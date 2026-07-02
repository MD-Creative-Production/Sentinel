# Observability Module

This module provides OpenTelemetry-based distributed tracing for Sentinel.

## Overview

The observability module integrates [OpenTelemetry](https://opentelemetry.io/) to provide:

- **Distributed tracing** across all Sentinel services
- **HTTP and Express instrumentation** for automatic request/span creation
- **OTLP export** to any OpenTelemetry-compatible collector (Jaeger, Grafana Tempo, etc.)
- **Console export** in development for easy debugging

## Configuration

Configure tracing via environment variables:

| Variable            | Description                     | Default    |
| ------------------- | ------------------------------- | ---------- |
| `OTEL_ENABLED`      | Enable/disable tracing          | `true`     |
| `OTEL_EXPORTER_URL` | OTLP collector endpoint         | (none)     |
| `OTEL_SERVICE_NAME` | Service name reported in traces | `sentinel` |

## Usage

### Automatic initialization

Import and call `initTracing()` at the entry point of your application:

```typescript
import { initTracing } from './observability';

// Initialize tracing before importing other modules
const sdk = initTracing();
```

### Custom configuration

```typescript
import { createTracingSdk } from './observability';

const sdk = createTracingSdk({
  serviceName: 'sentinel-bot',
  serviceVersion: '2.0.0',
  otlpEndpoint: 'http://jaeger:4318',
});

sdk.start();
```

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Sentinel   │────▶│  OTel SDK    │────▶│  OTLP Collector │
│  Services   │     │  (Tracing)   │     │  (Jaeger/Tempo) │
└─────────────┘     └──────────────┘     └─────────────────┘
                           │
                           ▼ (dev)
                    ┌──────────────┐
                    │   Console    │
                    └──────────────┘
```

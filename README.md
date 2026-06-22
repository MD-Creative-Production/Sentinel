# Sentinel: The Smart Contract "Watchdog"

[![License: MIT](https://img.shields.io/badge/License-MIT-red.svg)](https://opensource.org/licenses/MIT)
[![Ecosystem: Stellar/EVM](https://img.shields.io/badge/Ecosystem-Stellar%20%7C%20EVM-purple.svg)](https://stellar.org)
[![Security: Real--Time](https://img.shields.io/badge/Security-Real--Time%20Monitoring-orange.svg)](#)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)

**Sentinel** is an open-source, lightweight mempool monitoring bot designed to provide an "Early Warning System" for smart contract protocols. By detecting suspicious activities before they are finalized on-chain, Sentinel gives developers and stakeholders the critical seconds needed to react to potential threats.

---

## Table of Contents

- [Why Sentinel?](#why-sentinel)
- [Key Features](#key-features)
- [Architecture Overview](#architecture-overview)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the Project](#running-the-project)
- [Project Structure](#project-structure)
- [Usage](#usage)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)

---

## Why Sentinel?

Most security incidents are only discovered **after** the hack is finalized on-chain, at which point the funds are usually gone.

| Problem                 | How Sentinel Solves It                                            |
| ----------------------- | ----------------------------------------------------------------- |
| **The Monitoring Gap**  | Enterprise-grade monitoring accessible to every team size.        |
| **The "Finality" Trap** | Mempool-level detection catches threats _before_ confirmation.    |
| **Mempool Blindness**   | Real-time visibility into pending transactions signaling attacks. |

---

## Key Features

- **🕵️ Mempool Signature Scanning** — Detects unconfirmed transactions matching malicious patterns (e.g., `renounceOwnership`, `drainLiquidity`).
- **⚡ Instant Multi-Channel Alerts** — Real-time notifications to Discord, Telegram, or PagerDuty within milliseconds of detection.
- **🌌 Hybrid Ecosystem Support** — Native monitoring for both **Stellar (Soroban)** and **EVM-compatible** networks.
- **🛡️ "Circuit Breaker" Hooks** — Programmatic webhooks that can trigger an "Emergency Pause" on contracts when critical threats are detected.
- **📊 Observability & Tracing** — Built-in OpenTelemetry support for distributed tracing and monitoring across all services.
- **📜 Audit Logging** — Full audit trail of all alerts, actions, and system events.

---

## Architecture Overview

Sentinel is built as a **NestJS monorepo** with a modular architecture:

```
┌──────────────────────────────────────────────────────────────┐
│                      Sentinel Core                           │
│                                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │   Mempool    │  │   Threat     │  │   Notification     │  │
│  │   Listener   │──▶   Engine     │──▶   Dispatcher       │  │
│  └─────────────┘  └──────────────┘  └────────────────────┘  │
│        │                │                     │              │
│        ▼                ▼                     ▼              │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │  Blockchain  │  │   Danger     │  │  Discord / Telegram │  │
│  │  RPC Nodes   │  │  Signatures  │  │  / Webhooks        │  │
│  └─────────────┘  └──────────────┘  └────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                  PostgreSQL Database                  │   │
│  │   Users │ Watchlists │ Alerts │ Audit Logs │ Rules   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              OpenTelemetry Observability               │   │
│  │         Tracing │ Metrics │ Health Checks              │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

**Key components:**

- **apps/bot/** — Core mempool monitoring service that connects to blockchain RPCs and scans pending transactions.
- **apps/dashboard/** — React-based frontend for managing alert rules and viewing alert history.
- **libs/notify/** — Notification providers (Discord, Telegram, Webhooks) for dispatching alerts.
- **libs/scanners/** — Danger signature detection logic and threat rule engine.
- **observability/** — OpenTelemetry configuration for distributed tracing and metrics.
- **database/** — NestJS database module (TypeORM + PostgreSQL).
- **prisma/** — Prisma schema for database migrations and type-safe queries.

---

## Getting Started

### Prerequisites

- **Node.js** v20 or later
- **npm** (or pnpm/yarn)
- **PostgreSQL** 15+
- **Git**

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/sentinel-security-productions/Sentinel.git
   cd Sentinel
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up the database:**

   ```bash
   # Create a PostgreSQL database
   createdb sentinel

   # Run Prisma migrations
   npx prisma migrate dev
   ```

### Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Configure the following variables:

| Variable              | Description                  | Example                                          |
| --------------------- | ---------------------------- | ------------------------------------------------ |
| `DATABASE_URL`        | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/sentinel` |
| `DATABASE_HOST`       | Database host                | `localhost`                                      |
| `DATABASE_PORT`       | Database port                | `5432`                                           |
| `DATABASE_USER`       | Database username            | `sentinel`                                       |
| `DATABASE_PASSWORD`   | Database password            | `your_password`                                  |
| `DATABASE_NAME`       | Database name                | `sentinel`                                       |
| `DISCORD_WEBHOOK_URL` | Discord webhook for alerts   | `https://discord.com/api/webhooks/...`           |
| `OTEL_ENABLED`        | Enable OpenTelemetry tracing | `true`                                           |
| `OTEL_EXPORTER_URL`   | OTLP collector endpoint      | `http://localhost:4318`                          |
| `OTEL_SERVICE_NAME`   | Service name for traces      | `sentinel`                                       |

### Running the Project

```bash
# Development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Run linter
npm run lint
```

---

## Project Structure

```text
Sentinel/
├── apps/
│   ├── bot/              # Core mempool monitoring service
│   └── dashboard/        # React frontend for alert management
├── libs/
│   ├── scanners/         # Danger signature detection logic
│   └── notify/           # Discord, Telegram, Webhook providers
├── database/             # NestJS database module (TypeORM)
├── observability/        # OpenTelemetry tracing configuration
├── prisma/               # Prisma schema and migrations
├── signatures/           # Blockchain signature definitions
├── .github/              # GitHub templates and CI/CD workflows
├── CONTRIBUTING.md       # Contribution guidelines
├── SECURITY.md           # Security policy
├── CODE_OF_CONDUCT.md    # Code of conduct
├── ROADMAP.md            # Project roadmap
└── LICENSE               # MIT License
```

---

## Usage

### Setting Up Alerts

1. **Configure a Discord webhook** and add it to your `.env`.
2. **Define watchlist rules** via the dashboard or API.
3. **Start the bot** — Sentinel will begin monitoring the mempool and dispatch alerts.

### Example Alert

When Sentinel detects a suspicious transaction, it sends an alert like:

> 🚨 **Critical Alert: Ownership Transfer Detected**
> Contract `0x1234...abcd` is attempting to transfer ownership to `0x5678...efgh`.
> Transaction pending in mempool — action required before confirmation.

---

## Roadmap

See [ROADMAP.md](./ROADMAP.md) for the full project roadmap covering:

- **Phase 1** — Core Mempool Listener & Discord Alerts (In Progress)
- **Phase 2** — Smart Contract Intelligence & Soroban Support
- **Phase 3** — Cross-Chain Expansion (Polygon, Base, Arbitrum, Optimism)
- **Phase 4** — Enterprise Security Features
- **Phase 5** — Threat Intelligence Network

---

## Contributing

We welcome contributions from the community! Please read our [Contributing Guide](./CONTRIBUTING.md) to get started.

- 🐛 **Report bugs** — [Open a bug report](https://github.com/sentinel-security-productions/Sentinel/issues/new?template=bug_report.yml)
- 💡 **Request features** — [Open a feature request](https://github.com/sentinel-security-productions/Sentinel/issues/new?template=feature_report.yml)
- 📖 **Improve docs** — [Open a documentation issue](https://github.com/sentinel-security-productions/Sentinel/issues/new?template=documentation.yml)

---

## Security

For reporting security vulnerabilities, please see our [Security Policy](./SECURITY.md). **Do not open public issues for security vulnerabilities.**

---

## License

Sentinel is licensed under the [MIT License](./LICENSE).

---

Built with 🛡️ by the Sentinel team.

# Project Structure Reference

This document provides a quick reference for the Sentinel project structure.

## Complete Directory Tree

```
sentinel/
│
├── apps/                                    # Application packages
│   └── backend/                             # NestJS backend
│       ├── src/
│       │   ├── main.ts                     # Application entry
│       │   ├── app.module.ts               # Root module
│       │   ├── app.controller.ts           # Root controller
│       │   │
│       │   ├── modules/                    # Business logic modules
│       │   │   ├── alerts/                 # Alert management
│       │   │   │   ├── dto/
│       │   │   │   ├── entities/
│       │   │   │   ├── interfaces/
│       │   │   │   ├── controllers/
│       │   │   │   ├── services/
│       │   │   │   ├── alerts.module.ts
│       │   │   │   └── README.md
│       │   │   │
│       │   │   ├── monitoring/             # Mempool monitoring
│       │   │   │   ├── services/
│       │   │   │   ├── monitoring.module.ts
│       │   │   │   └── README.md
│       │   │   │
│       │   │   ├── signatures/             # Signature detection
│       │   │   │   ├── dto/
│       │   │   │   ├── entities/
│       │   │   │   ├── services/
│       │   │   │   ├── signatures.module.ts
│       │   │   │   └── README.md
│       │   │   │
│       │   │   ├── webhooks/               # Webhook management
│       │   │   │   ├── dto/
│       │   │   │   ├── entities/
│       │   │   │   ├── services/
│       │   │   │   ├── webhooks.module.ts
│       │   │   │   └── README.md
│       │   │   │
│       │   │   ├── audit-log/              # Audit logging
│       │   │   │   ├── dto/
│       │   │   │   ├── entities/
│       │   │   │   ├── services/
│       │   │   │   ├── audit-log.module.ts
│       │   │   │   └── README.md
│       │   │   │
│       │   │   ├── health/                 # Health checks
│       │   │   │   ├── controllers/
│       │   │   │   ├── services/
│       │   │   │   ├── health.module.ts
│       │   │   │   └── README.md
│       │   │   │
│       │   │   └── README.md               # Modules documentation
│       │   │
│       │   ├── common/                     # Shared functionality
│       │   │   ├── decorators/             # Custom decorators
│       │   │   │   ├── audit.decorator.ts
│       │   │   │   ├── cache.decorator.ts
│       │   │   │   ├── rate-limit.decorator.ts
│       │   │   │   └── index.ts
│       │   │   │
│       │   │   ├── filters/                # Exception filters
│       │   │   │   ├── http-exception.filter.ts
│       │   │   │   ├── all-exceptions.filter.ts
│       │   │   │   └── index.ts
│       │   │   │
│       │   │   ├── guards/                 # Auth/authz guards
│       │   │   │   ├── api-key.guard.ts
│       │   │   │   ├── jwt.guard.ts
│       │   │   │   ├── role.guard.ts
│       │   │   │   └── index.ts
│       │   │   │
│       │   │   ├── pipes/                  # Validation pipes
│       │   │   │   ├── validation.pipe.ts
│       │   │   │   ├── parse-enum.pipe.ts
│       │   │   │   └── index.ts
│       │   │   │
│       │   │   ├── interfaces/             # Shared types
│       │   │   │   ├── alert.interface.ts
│       │   │   │   ├── transaction.interface.ts
│       │   │   │   ├── response.interface.ts
│       │   │   │   └── index.ts
│       │   │   │
│       │   │   ├── utils/                  # Helper functions
│       │   │   │   ├── crypto.util.ts
│       │   │   │   ├── validation.util.ts
│       │   │   │   ├── blockchain.util.ts
│       │   │   │   └── index.ts
│       │   │   │
│       │   │   ├── constants/              # Constants & enums
│       │   │   │   ├── alert-types.constant.ts
│       │   │   │   ├── error-codes.constant.ts
│       │   │   │   ├── network-names.constant.ts
│       │   │   │   └── index.ts
│       │   │   │
│       │   │   ├── middleware/             # Express middleware
│       │   │   │   ├── logging.middleware.ts
│       │   │   │   ├── correlation-id.middleware.ts
│       │   │   │   └── index.ts
│       │   │   │
│       │   │   └── README.md               # Common documentation
│       │   │
│       │   ├── integrations/               # External service adapters
│       │   │   ├── discord/                # Discord integration
│       │   │   │   ├── clients/
│       │   │   │   ├── services/
│       │   │   │   ├── dto/
│       │   │   │   ├── discord.module.ts
│       │   │   │   └── README.md
│       │   │   │
│       │   │   ├── telegram/               # Telegram integration
│       │   │   │   ├── clients/
│       │   │   │   ├── services/
│       │   │   │   ├── dto/
│       │   │   │   ├── telegram.module.ts
│       │   │   │   └── README.md
│       │   │   │
│       │   │   ├── blockchain/             # Blockchain integration
│       │   │   │   ├── providers/
│       │   │   │   ├── services/
│       │   │   │   ├── interfaces/
│       │   │   │   ├── blockchain.module.ts
│       │   │   │   └── README.md
│       │   │   │
│       │   │   ├── pagerduty/              # PagerDuty integration
│       │   │   │   ├── clients/
│       │   │   │   ├── services/
│       │   │   │   ├── dto/
│       │   │   │   ├── pagerduty.module.ts
│       │   │   │   └── README.md
│       │   │   │
│       │   │   └── README.md               # Integrations documentation
│       │   │
│       │   └── config/                     # Configuration
│       │       ├── config.module.ts
│       │       └── config.validation.ts
│       │
│       └── tsconfig.app.json
│
├── dashboard/                               # React dashboard (future)
│   └── src/
│
├── database/                                # Shared database module
│   └── database.module.ts
│
├── libs/                                    # Shared libraries
│   └── notify/                              # Notification library
│       └── discord.provider.ts
│
├── prisma/                                  # Database schema
│   └── schema.prisma
│
├── observability/                           # OpenTelemetry setup
│   ├── index.ts
│   ├── README.md
│   └── tracing.ts
│
├── signatures/                              # Malicious signatures
│   └── soroban.json
│
├── src/                                     # Root src (shared config)
│   └── config/
│       ├── config.module.ts
│       └── config.validation.ts
│
├── .github/                                 # GitHub configuration
│   ├── workflows/                           # CI/CD workflows
│   │   ├── ci.yml
│   │   └── code-quality.yml
│   └── PULL_REQUEST_TEMPLATE.md
│
├── Dockerfile                               # Docker configuration
├── docker-compose.yml
├── .dockerignore
├── .env.docker
│
├── .eslintrc.js                             # ESLint configuration
├── .prettierrc                              # Prettier configuration
├── tsconfig.json                            # TypeScript configuration
│
├── package.json                             # Dependencies & scripts
├── package-lock.json
│
├── ARCHITECTURE.md                          # Architecture documentation
├── DOCKER.md                                # Docker setup guide
├── DOCKER-SETUP.md                          # Docker implementation summary
├── CI.md                                    # CI pipeline documentation
├── README.md                                # Project overview
├── CONTRIBUTING.md                          # Contribution guidelines
├── CODE_OF_CONDUCT.md                       # Code of conduct
├── SECURITY.md                              # Security policy
├── ROADMAP.md                               # Project roadmap
├── LICENSE                                  # MIT License
│
└── PROJECT_STRUCTURE.md                     # This file
```

## Quick Reference

### Module Location Pattern
```
apps/backend/src/modules/[feature-name]/
├── dto/
├── entities/
├── interfaces/
├── controllers/
├── services/
├── repositories/
├── [feature-name].module.ts
└── README.md
```

### Common Location Pattern
```
apps/backend/src/common/[category]/
├── [name].ts
├── [name].spec.ts
└── index.ts (exports)
```

### Integration Location Pattern
```
apps/backend/src/integrations/[service]/
├── clients/
├── services/
├── dto/
├── [service].module.ts
└── README.md
```

## File Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Module | `[name].module.ts` | `alerts.module.ts` |
| Service | `[name].service.ts` | `alert.service.ts` |
| Controller | `[name].controller.ts` | `alert.controller.ts` |
| Entity | `[name].entity.ts` | `alert.entity.ts` |
| DTO | `[action]-[entity].dto.ts` | `create-alert.dto.ts` |
| Guard | `[name].guard.ts` | `jwt.guard.ts` |
| Pipe | `[name].pipe.ts` | `validation.pipe.ts` |
| Filter | `[name].filter.ts` | `http-exception.filter.ts` |
| Decorator | `[name].decorator.ts` | `audit.decorator.ts` |
| Repository | `[name].repository.ts` | `alert.repository.ts` |
| Test | `[name].spec.ts` | `alert.service.spec.ts` |
| Interface | `[name].interface.ts` | `alert.interface.ts` |
| Utility | `[name].util.ts` | `crypto.util.ts` |
| Constant | `[name].constant.ts` | `alert-types.constant.ts` |

## Module Dependencies

```
AppModule
├── AlertsModule
├── MonitoringModule
├── SignaturesModule
├── WebhooksModule
├── AuditLogModule
├── HealthModule
├── DiscordModule
├── TelegramModule
├── BlockchainModule
├── PagerDutyModule
└── ConfigModule
```

## Key Directories for Different Tasks

### Adding a New Feature
1. Create module: `apps/backend/src/modules/feature-name/`
2. Create DTOs: `apps/backend/src/modules/feature-name/dto/`
3. Create entities: `apps/backend/src/modules/feature-name/entities/`
4. Create service: `apps/backend/src/modules/feature-name/services/`
5. Create controller: `apps/backend/src/modules/feature-name/controllers/`

### Adding Shared Utilities
1. Choose category: `decorators/`, `guards/`, `pipes/`, `utils/`, etc.
2. Create file: `apps/backend/src/common/[category]/[name].ts`
3. Export from `index.ts`
4. Document in `common/README.md`

### Adding Integration
1. Create module: `apps/backend/src/integrations/service-name/`
2. Create client: `apps/backend/src/integrations/service-name/clients/`
3. Create service: `apps/backend/src/integrations/service-name/services/`
4. Document in module README

## Configuration Files Location

| File | Purpose |
|------|---------|
| `tsconfig.json` | TypeScript compilation settings |
| `.eslintrc.js` | ESLint rules |
| `.prettierrc` | Code formatting rules |
| `Dockerfile` | Docker image definition |
| `docker-compose.yml` | Docker Compose configuration |
| `.env.docker` | Docker environment defaults |
| `.github/workflows/` | CI/CD pipelines |

## Documentation Files

| File | Location | Purpose |
|------|----------|---------|
| ARCHITECTURE.md | Root | System design and principles |
| PROJECT_STRUCTURE.md | Root | Directory and file reference |
| DOCKER.md | Root | Docker setup guide |
| CI.md | Root | CI/CD pipeline guide |
| README.md | Root | Project overview |
| README.md | modules/ | Modules explanation |
| README.md | common/ | Common utilities explanation |
| README.md | integrations/ | Integrations explanation |
| README.md | Each module | Module-specific documentation |

## Environment Setup

All environment variables are documented in:
- `.env.docker` - Docker development defaults
- Docker configuration in `DOCKER.md`
- CI configuration in `CI.md`

## Getting Started

1. Clone repository
2. Review `ARCHITECTURE.md` for system design
3. Review `PROJECT_STRUCTURE.md` (this file) for navigation
4. Review module `README.md` files for specific areas
5. Check `CONTRIBUTING.md` for contribution guidelines
6. Follow `DOCKER.md` for local setup

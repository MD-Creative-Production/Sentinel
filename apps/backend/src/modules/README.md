# Backend Modules

The modules directory contains all business logic organized by feature/domain. Each module is a self-contained unit following NestJS module patterns.

## Module Structure

Each module follows this standard structure:

```
module-name/
├── dto/                    # Data Transfer Objects
│   ├── create-*.dto.ts
│   └── update-*.dto.ts
├── entities/               # Database entities
│   └── *.entity.ts
├── interfaces/             # Module-specific interfaces
│   └── *.interface.ts
├── controllers/            # HTTP controllers
│   └── *.controller.ts
├── services/               # Business logic
│   └── *.service.ts
├── repositories/           # Data access
│   └── *.repository.ts
├── *.module.ts            # NestJS module definition
└── README.md              # Module documentation
```

## Available Modules

### Alerts Module (`alerts/`)
**Purpose**: Manage alert rules, thresholds, and alert triggering logic.

**Key Files**:
- `AlertRule` entity - Define alert rules
- `AlertService` - Create, update, manage alerts
- `AlertController` - HTTP endpoints for alerts

**Responsibilities**:
- CRUD operations for alert rules
- Alert rule validation
- Alert state management
- Integration with notifications

**Related**: Integrations (Discord, Telegram, PagerDuty)

### Monitoring Module (`monitoring/`)
**Purpose**: Real-time mempool monitoring and transaction tracking.

**Key Files**:
- `MemPoolMonitor` service - Track pending transactions
- `TransactionScanner` service - Scan for malicious patterns
- `MonitoringService` - Orchestrate monitoring operations

**Responsibilities**:
- Connect to blockchain providers
- Poll mempool for new transactions
- Filter transactions by criteria
- Trigger alert pipelines
- Track monitoring state

**Related**: Signatures, Alerts, Blockchain Integration

### Signatures Module (`signatures/`)
**Purpose**: Detect malicious function signatures in transactions.

**Key Files**:
- `Signature` entity - Store signature patterns
- `SignatureDetector` service - Identify malicious signatures
- `SignatureManager` service - Manage signature database

**Responsibilities**:
- Maintain database of malicious signatures
- Parse transaction calldata
- Detect matching signatures
- Report detection results

**Related**: Monitoring, Alerts

### Webhooks Module (`webhooks/`)
**Purpose**: Handle emergency pause and circuit breaker webhooks.

**Key Files**:
- `Webhook` entity - Store webhook endpoints
- `WebhookManager` service - Manage webhook subscriptions
- `CircuitBreaker` service - Execute emergency actions

**Responsibilities**:
- Register webhook endpoints
- Trigger webhooks on alerts
- Handle webhook retries
- Log webhook executions
- Circuit breaker pattern implementation

**Related**: Alerts, Audit Log

### Audit Log Module (`audit-log/`)
**Purpose**: Track all system activities and changes for compliance.

**Key Files**:
- `AuditLog` entity - Store audit records
- `AuditLogger` service - Log activities
- `AuditLogService` - Query audit logs

**Responsibilities**:
- Log all alerts triggered
- Track webhook executions
- Record configuration changes
- Audit trail for compliance
- Query and filter logs

**Related**: All modules (cross-cutting)

### Health Module (`health/`)
**Purpose**: Service health checks and status reporting.

**Key Files**:
- `HealthController` - Expose health endpoints
- `HealthService` - Check service dependencies

**Responsibilities**:
- PostgreSQL connectivity
- Redis connectivity
- Blockchain RPC availability
- External service status
- Readiness and liveness probes

**Related**: None (infrastructure)

## Module Communication

Modules communicate through:

1. **Services**: Inject services between modules
2. **Events**: Use NestJS event emitters for loose coupling
3. **Shared DTOs**: Common data structures
4. **Repositories**: Shared database access

## Adding a New Module

1. Create a new directory: `src/modules/module-name/`
2. Create subdirectories: `dto/`, `entities/`, `services/`, `controllers/`
3. Implement module files following the pattern
4. Create `module-name.module.ts` with NestJS decorator
5. Import in `AppModule`
6. Add README.md with module documentation

Example module structure:

```typescript
// module-name.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModuleNameService } from './services/module-name.service';
import { ModuleNameController } from './controllers/module-name.controller';
import { ModuleNameEntity } from './entities/module-name.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ModuleNameEntity])],
  controllers: [ModuleNameController],
  providers: [ModuleNameService],
  exports: [ModuleNameService], // If used by other modules
})
export class ModuleNameModule {}
```

## Best Practices

1. **Single Responsibility**: Each module handles one domain
2. **Loose Coupling**: Use dependency injection
3. **High Cohesion**: Related functionality together
4. **Clear Interfaces**: Define contracts via services
5. **Testability**: Services should be independently testable
6. **Documentation**: Each module should have README.md
7. **Versioning**: Consider API versioning for modules

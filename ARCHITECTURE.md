# Sentinel Architecture

This document describes the architectural design, structure, and key design decisions for the Sentinel project.

## Overview

Sentinel is a real-time mempool monitoring system for detecting suspicious smart contract activities. The architecture is designed for:

- **Scalability**: Handle multiple blockchain networks simultaneously
- **Modularity**: Independent, testable components
- **Extensibility**: Easy to add new detection rules and integrations
- **Reliability**: Fault-tolerant with proper error handling
- **Observability**: Built-in tracing and monitoring

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Sentinel Backend (NestJS)               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              API Layer (Controllers)                │  │
│  │  - Alert Management  - Configuration               │  │
│  │  - Webhook Management - Health Checks              │  │
│  └─────────────────────────────────────────────────────┘  │
│                          │                                  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │         Business Logic Layer (Modules)             │  │
│  │  ┌────────────┐ ┌────────────┐ ┌─────────────┐    │  │
│  │  │ Monitoring │ │  Alerts    │ │ Signatures  │    │  │
│  │  │   Module   │ │   Module   │ │   Module    │    │  │
│  │  └────────────┘ └────────────┘ └─────────────┘    │  │
│  │  ┌────────────┐ ┌────────────┐ ┌─────────────┐    │  │
│  │  │  Webhooks  │ │ Audit Log  │ │   Health    │    │  │
│  │  │   Module   │ │   Module   │ │   Module    │    │  │
│  │  └────────────┘ └────────────┘ └─────────────┘    │  │
│  └─────────────────────────────────────────────────────┘  │
│                          │                                  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │          Integrations Layer                         │  │
│  │  ┌────────────┐ ┌────────────┐ ┌─────────────┐    │  │
│  │  │ Blockchain │ │  Discord   │ │  Telegram   │    │  │
│  │  │Integration │ │Integration │ │ Integration │    │  │
│  │  └────────────┘ └────────────┘ └─────────────┘    │  │
│  │  ┌────────────┐                                    │  │
│  │  │ PagerDuty  │                                    │  │
│  │  │Integration │                                    │  │
│  │  └────────────┘                                    │  │
│  └─────────────────────────────────────────────────────┘  │
│                          │                                  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │       Cross-Cutting Concerns (Common)              │  │
│  │  - Authentication/Authorization                    │  │
│  │  - Validation & Transformation (Pipes)             │  │
│  │  - Error Handling (Filters)                        │  │
│  │  - Logging & Tracing                              │  │
│  │  - Shared Constants & Interfaces                   │  │
│  └─────────────────────────────────────────────────────┘  │
│                          │                                  │
├─────────────────────────────────────────────────────────────┤
│                Data Layer                                   │
│  ┌──────────────┐           ┌──────────────┐               │
│  │ PostgreSQL   │           │    Redis     │               │
│  │ (Persistent) │           │   (Cache)    │               │
│  └──────────────┘           └──────────────┘               │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
sentinel/
├── apps/
│   └── backend/
│       └── src/
│           ├── main.ts                 # Application entry point
│           ├── app.module.ts           # Root module
│           ├── app.controller.ts       # Root controller
│           ├── modules/                # Business logic modules
│           │   ├── alerts/
│           │   ├── monitoring/
│           │   ├── signatures/
│           │   ├── webhooks/
│           │   ├── audit-log/
│           │   └── health/
│           ├── common/                 # Shared utilities
│           │   ├── decorators/
│           │   ├── filters/
│           │   ├── guards/
│           │   ├── pipes/
│           │   ├── interfaces/
│           │   ├── utils/
│           │   ├── constants/
│           │   └── middleware/
│           ├── integrations/           # External service integrations
│           │   ├── discord/
│           │   ├── telegram/
│           │   ├── blockchain/
│           │   └── pagerduty/
│           └── config/                 # Configuration management
├── database/                           # Shared database module
├── libs/
│   └── notify/                         # Notification library
├── prisma/                             # Database schema
├── observability/                      # OpenTelemetry setup
└── [Docker files, CI config, etc.]
```

## Core Concepts

### 1. Modules (Business Logic)

Modules are the core organizational units containing business logic:

- **Cohesive**: Each module handles one domain (alerts, monitoring, etc.)
- **Independent**: Can be developed and tested separately
- **Composable**: Import and use services from other modules
- **Testable**: All logic is injectable and mockable

```typescript
@Module({
  imports: [TypeOrmModule.forFeature([AlertEntity])],
  controllers: [AlertController],
  providers: [AlertService],
  exports: [AlertService], // Available to other modules
})
export class AlertsModule {}
```

### 2. Common (Cross-Cutting Concerns)

Shared code used across all modules:

- **Decorators**: Reusable annotations (@Audit, @CacheResult, etc.)
- **Guards**: Authentication, authorization, rate limiting
- **Pipes**: Validation, transformation, sanitization
- **Filters**: Exception handling and error formatting
- **Utils**: Helper functions
- **Interfaces**: Shared TypeScript types
- **Constants**: Enum values and fixed constants
- **Middleware**: Request/response processing

### 3. Integrations (External Services)

Adapters for external services:

- **Blockchain**: RPC providers for Stellar, Ethereum, Polygon
- **Notifications**: Discord, Telegram, PagerDuty
- **Isolated**: Each integration is self-contained
- **Testable**: Easy to mock in tests
- **Resilient**: Retry logic, circuit breakers

## Data Flow

### Alert Detection Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Blockchain Integration                                  │
│    - Connect to RPC providers                              │
│    - Monitor mempool for new transactions                  │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Monitoring Module                                        │
│    - Fetch pending transactions                            │
│    - Parse transaction calldata                            │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Signature Detection                                      │
│    - Extract function signatures                           │
│    - Compare against malicious signature database          │
│    - Calculate matching confidence                         │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Alert Rules Evaluation                                  │
│    - Check if matches any alert rules                      │
│    - Evaluate severity and priority                        │
│    - Determine notification channels                       │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Alert Module                                             │
│    - Create alert record                                   │
│    - Store in PostgreSQL                                   │
│    - Trigger webhook handlers                              │
└─────────────────┬───────────────────────────────────────────┘
                  │
        ┌─────────┴──────────┬──────────────┬──────────────┐
        ▼                    ▼              ▼              ▼
   Discord Bot         Telegram Bot    PagerDuty      Webhooks
   Notification        Notification    Incident       Circuit
                                        Creation       Breaker
        │                    │              │              │
        └─────────────────────┴──────────────┴──────────────┘
                             │
                             ▼
                  ┌───────────────────────┐
                  │   Audit Log Module    │
                  │ - Log all activities  │
                  │ - Track outcomes      │
                  │ - Maintain audit trail│
                  └───────────────────────┘
```

## Design Principles

### 1. Single Responsibility Principle
Each module/service has one reason to change.

```typescript
// ✓ Good: Clear responsibility
class SignatureDetectorService {
  detectMaliciousSignature(calldata: string): boolean { }
}

// ✗ Bad: Multiple responsibilities
class SignatureService {
  detectMalicious() { }
  sendNotification() { }
  logActivity() { }
}
```

### 2. Dependency Injection
Use NestJS DI for loose coupling.

```typescript
@Injectable()
export class AlertService {
  constructor(
    private readonly signatureService: SignatureDetectorService,
    private readonly discordService: DiscordService,
  ) {}
}
```

### 3. Interface Segregation
Small, specific interfaces instead of large monolithic ones.

```typescript
interface Alertable {
  send(payload: AlertPayload): Promise<void>;
}

interface Healthcheckable {
  isHealthy(): Promise<boolean>;
}

// Services implement only what they need
class DiscordService implements Alertable, Healthcheckable { }
```

### 4. Open/Closed Principle
Open for extension, closed for modification.

```typescript
// Add new integrations without modifying existing code
abstract class NotificationService {
  abstract send(alert: Alert): Promise<void>;
}

class SlackService extends NotificationService {
  // New implementation
}
```

### 5. Dependency Inversion
Depend on abstractions, not concrete implementations.

```typescript
// ✓ Good: Depends on interface
constructor(private alerter: Alertable) { }

// ✗ Bad: Depends on concrete class
constructor(private discord: DiscordService) { }
```

## Database Design

### Entities

Key entities in PostgreSQL:

```typescript
// Alerts
interface Alert {
  id: string;
  ruleId: string;
  severity: AlertSeverity;
  transactionHash: string;
  detectedAt: Date;
  status: AlertStatus;
  createdAt: Date;
}

// Alert Rules
interface AlertRule {
  id: string;
  name: string;
  signature: string;
  enabled: boolean;
  notificationChannels: string[];
  createdAt: Date;
}

// Audit Logs
interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  changes: Record<string, unknown>;
  actor: string;
  createdAt: Date;
}

// Webhooks
interface Webhook {
  id: string;
  url: string;
  events: string[];
  headers: Record<string, string>;
  active: boolean;
  createdAt: Date;
}
```

### Caching Strategy (Redis)

```typescript
// Cache malicious signatures for quick lookups
CACHE_KEYS = {
  SIGNATURES: 'signatures:all',
  ALERT_RULES: 'alert_rules:active',
  USER_PREFERENCES: 'user:preferences:{userId}',
}

// Cache TTL values
CACHE_TTL = {
  SIGNATURES: 3600,        // 1 hour
  ALERT_RULES: 1800,       // 30 minutes
  USER_PREFERENCES: 7200,  // 2 hours
}
```

## Error Handling

### Exception Hierarchy

```typescript
abstract class SentinelException extends Error {
  abstract getStatus(): number;
  abstract getErrorCode(): string;
}

export class SignatureNotFoundException extends SentinelException {
  getStatus() { return 404; }
  getErrorCode() { return 'SIGNATURE_NOT_FOUND'; }
}

export class InvalidAlertRuleException extends SentinelException {
  getStatus() { return 400; }
  getErrorCode() { return 'INVALID_ALERT_RULE'; }
}
```

### Global Exception Filter

```typescript
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    // Format and send error response
    // Log error with tracing
    // Track in observability system
  }
}
```

## Authentication & Authorization

### API Key Authentication
```typescript
@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // Validate API key from request headers
  }
}
```

### Role-Based Access Control
```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // Check user roles
  }
}

@UseGuards(RolesGuard)
@Roles('admin', 'moderator')
@Post('/admin-action')
adminAction() { }
```

## Observability

### OpenTelemetry Integration

All services include automatic tracing:

```typescript
@Span('alert.create')
async createAlert(dto: CreateAlertDto) {
  // Automatically traced and monitored
}
```

### Logging Levels

```typescript
Logger.log()     // Info level
Logger.warn()    // Warning level
Logger.error()   // Error level
Logger.debug()   // Debug level (dev only)
Logger.verbose() // Detailed traces
```

## Testing Strategy

### Unit Tests
- Test services in isolation
- Mock dependencies
- Focus on business logic

### Integration Tests
- Test module interactions
- Use test database
- Validate data flows

### E2E Tests
- Test complete workflows
- Full stack testing
- Docker-based test environment

### Test Structure
```
src/
├── modules/
│   └── alerts/
│       ├── alerts.service.ts
│       ├── alerts.service.spec.ts
│       ├── alerts.controller.ts
│       └── alerts.controller.spec.ts
```

## Performance Considerations

### Caching Strategy
- Cache malicious signatures (static)
- Cache alert rules (TTL-based)
- User preferences (session-based)

### Database Optimization
- Indices on frequently queried columns
- Pagination for list endpoints
- Connection pooling

### Async Processing
```typescript
// Use queues for heavy operations
this.auditQueue.add({ action: 'ALERT_CREATED', data: alert });
```

## Scaling Considerations

### Horizontal Scaling
- Stateless services
- Load balancer (nginx/Traefik)
- Shared PostgreSQL & Redis

### Vertical Scaling
- Increase Node.js memory
- Optimize database queries
- Implement caching effectively

### Multi-Tenancy (Future)
- Isolate data by tenant
- Separate webhook namespaces
- Per-tenant rate limiting

## Security Best Practices

1. **API Keys**: Validate all requests
2. **Input Validation**: Use pipes and decorators
3. **Rate Limiting**: Prevent abuse
4. **CORS**: Configure appropriately
5. **Secrets**: Use environment variables
6. **HTTPS**: Enforce in production
7. **Logging**: Never log sensitive data
8. **Dependencies**: Regular security audits

## Deployment Considerations

### Docker
- Multi-stage builds for optimization
- Non-root user execution
- Health checks configured

### Kubernetes (Future)
- Stateless service design
- ConfigMaps for configuration
- Secrets for sensitive data
- Resource limits defined

### CI/CD Pipeline
- Linting and type checking
- Automated testing
- Build verification
- Artifact storage

## Roadmap & Future Enhancements

1. **Machine Learning**: Pattern detection using ML
2. **Multi-Tenancy**: Support multiple organizations
3. **Advanced Analytics**: Historical analysis and reports
4. **Custom Rules**: User-defined detection rules
5. **API Marketplace**: Third-party integrations
6. **Mobile Alerts**: Native mobile app
7. **Kubernetes Support**: K8s deployment guides

## Contributing Guidelines

When adding new features:

1. Create feature branch
2. Follow module structure
3. Add unit tests
4. Update documentation
5. Submit pull request
6. Ensure CI passes
7. Request code review

## References

- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/)
- [Clean Code Principles](https://en.wikipedia.org/wiki/Code_smell)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [OpenTelemetry](https://opentelemetry.io/)

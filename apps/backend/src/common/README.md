# Common Utilities & Shared Concerns

The common directory contains shared functionality, utilities, and infrastructure code used across modules.

## Directory Structure

```
common/
├── decorators/            # Custom decorators
├── filters/              # Exception and HTTP filters
├── guards/               # Authentication/authorization guards
├── pipes/                # Validation and transformation pipes
├── interfaces/           # Shared TypeScript interfaces
├── utils/                # Utility functions
├── constants/            # Shared constants and enums
├── middleware/           # Express middleware
└── README.md
```

## Components

### Decorators (`decorators/`)
Custom NestJS decorators for cross-cutting concerns.

**Examples**:
```typescript
// Custom parameter decorators
@CurrentUser()
@IsAuthenticated()
@HasRole('admin')
@ApiKey()

// Method decorators
@CacheResult()
@RateLimit()
@Audit()
@TransactionLog()
```

### Filters (`filters/`)
HTTP exception and error handling filters.

**Files**:
- `http-exception.filter.ts` - Handle HTTP exceptions
- `all-exceptions.filter.ts` - Global exception handler
- `validation.filter.ts` - Validation error formatting

**Purpose**: Standardize error responses across API

### Guards (`guards/`)
Authentication and authorization guards.

**Files**:
- `api-key.guard.ts` - API key validation
- `jwt.guard.ts` - JWT token validation
- `role.guard.ts` - Role-based access control
- `rate-limit.guard.ts` - Rate limiting

**Purpose**: Protect endpoints from unauthorized access

### Pipes (`pipes/`)
Data validation and transformation pipes.

**Files**:
- `validation.pipe.ts` - DTO validation
- `parse-enum.pipe.ts` - Enum parsing
- `parse-int.pipe.ts` - Integer parsing
- `sanitize.pipe.ts` - Input sanitization

**Purpose**: Validate and transform incoming data

### Interfaces (`interfaces/`)
Shared TypeScript interfaces and types.

**Files**:
- `alert.interface.ts` - Alert-related types
- `transaction.interface.ts` - Transaction types
- `webhook.interface.ts` - Webhook types
- `response.interface.ts` - API response types
- `error.interface.ts` - Error types

**Purpose**: Ensure type consistency across codebase

### Utils (`utils/`)
Helper functions and utilities.

**Files**:
- `crypto.util.ts` - Cryptographic functions
- `validation.util.ts` - Validation helpers
- `format.util.ts` - Data formatting
- `blockchain.util.ts` - Blockchain utilities
- `date.util.ts` - Date/time helpers

**Purpose**: Reusable utility functions

### Constants (`constants/`)
Shared constants and enumerations.

**Files**:
- `alert-types.constant.ts` - Alert type enums
- `error-codes.constant.ts` - Error code definitions
- `network-names.constant.ts` - Supported networks
- `signatures.constant.ts` - Hardcoded malicious signatures
- `config.constant.ts` - Configuration constants

**Purpose**: Centralize constant values

### Middleware (`middleware/`)
Express middleware for request/response processing.

**Files**:
- `logging.middleware.ts` - Request/response logging
- `correlation-id.middleware.ts` - Add correlation IDs
- `request-timeout.middleware.ts` - Request timeouts
- `security.middleware.ts` - Security headers

**Purpose**: Cross-cutting concerns for all requests

## Usage Examples

### Using Decorators
```typescript
@Controller('alerts')
@UseGuards(JwtGuard)
export class AlertController {
  @Post()
  @Audit('CREATE_ALERT')
  @RateLimit(10, 60) // 10 requests per 60 seconds
  createAlert(@CurrentUser() user: User, @Body() dto: CreateAlertDto) {
    // Implementation
  }
}
```

### Using Guards
```typescript
@Controller('admin')
@UseGuards(JwtGuard, RoleGuard)
export class AdminController {
  @Post()
  @Roles('admin', 'moderator')
  performAdminAction() {
    // Only admins/moderators can access
  }
}
```

### Using Pipes
```typescript
@Controller('transactions')
export class TransactionController {
  @Get(':id')
  getTransaction(
    @Param('id', ParseIntPipe) id: number,
    @Query('status', ValidationPipe) status: TransactionStatus,
  ) {
    // id is validated as integer
    // status is validated as valid enum
  }
}
```

### Using Interfaces
```typescript
import { AlertResponse, TransactionInfo, WebhookPayload } from '@common/interfaces';

export class AlertService {
  sendAlert(transaction: TransactionInfo): AlertResponse {
    // Type-safe alert response
  }
}
```

### Using Utils
```typescript
import { formatAddress, parseCalldata, validateSignature } from '@common/utils';

export class SignatureService {
  detectSignature(transaction: any) {
    const data = parseCalldata(transaction.data);
    const address = formatAddress(transaction.to);
    // Use utilities
  }
}
```

### Using Constants
```typescript
import { ALERT_TYPES, ERROR_CODES, NETWORK_NAMES } from '@common/constants';

export class AlertService {
  async createAlert(type: ALERT_TYPES) {
    // Use typed constants
  }
}
```

## Best Practices

1. **Keep It Generic**: Common code should be reusable across modules
2. **Avoid Dependencies**: Common utilities shouldn't depend on specific modules
3. **Single Responsibility**: Each file should have one purpose
4. **Type Safety**: Use TypeScript interfaces
5. **Testability**: Utilities should be easily testable
6. **Documentation**: Add JSDoc comments to exports
7. **Performance**: Memoize expensive computations
8. **No Circular Dependencies**: Common should not import from modules

## Import Path Aliases

For easier imports, use path aliases in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@common/*": ["src/common/*"],
      "@modules/*": ["src/modules/*"],
      "@integrations/*": ["src/integrations/*"]
    }
  }
}
```

Usage:
```typescript
// Instead of: import { ... } from '../../../common/utils'
import { ... } from '@common/utils';
import { AlertService } from '@modules/alerts/services/alert.service';
```

## Adding New Common Components

1. Create file in appropriate subdirectory
2. Export from an `index.ts` file
3. Add path alias if needed
4. Document the component with JSDoc
5. Add unit tests in `__tests__` directory

Example:
```typescript
// common/utils/index.ts
export * from './crypto.util';
export * from './validation.util';
```

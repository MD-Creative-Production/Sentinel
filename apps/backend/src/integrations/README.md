# Integrations

The integrations directory contains adapters and clients for external services and platforms. Each integration is isolated and maintains its own lifecycle.

## Directory Structure

```
integrations/
├── discord/               # Discord bot integration
├── telegram/             # Telegram bot integration
├── blockchain/           # RPC providers and blockchain clients
├── pagerduty/            # PagerDuty incident management
└── README.md
```

## Integration Pattern

Each integration follows a consistent pattern:

```
integration-name/
├── dto/                   # Integration-specific DTOs
├── clients/               # External service clients
├── services/              # Business logic
├── interfaces/            # Integration interfaces
├── *.module.ts           # NestJS module
└── README.md             # Integration documentation
```

## Available Integrations

### Discord Integration (`discord/`)
**Purpose**: Send real-time alerts to Discord channels via webhooks.

**Features**:
- Webhook-based message delivery
- Rich embeds for alert details
- Retry logic for failed deliveries
- Message formatting and templates
- Thread support for alert discussions

**Configuration**:
```env
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
DISCORD_TIMEOUT=5000
DISCORD_RETRY_ATTEMPTS=3
```

**Usage**:
```typescript
export class AlertService {
  constructor(private discordService: DiscordService) {}
  
  async alertThreat(threat: Threat) {
    await this.discordService.sendAlert({
      title: 'Malicious Activity Detected',
      description: `Signature ${threat.signature} detected`,
      severity: 'high',
      timestamp: new Date(),
    });
  }
}
```

### Telegram Integration (`telegram/`)
**Purpose**: Send alerts to Telegram channels and direct messages.

**Features**:
- Bot token authentication
- Channel and private chat support
- Formatted messages with markdown
- Inline keyboards for actions
- File/image attachments
- Rate limiting support

**Configuration**:
```env
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
TELEGRAM_CHAT_ID=-1001234567890
TELEGRAM_TIMEOUT=5000
```

**Usage**:
```typescript
await this.telegramService.sendAlert(
  'High severity alert: Possible rug pull detected in token contract'
);
```

### Blockchain Integration (`blockchain/`)
**Purpose**: Connect to blockchain networks (Stellar, EVM) for mempool monitoring.

**Features**:
- Multi-network support (Stellar Soroban, Ethereum, etc.)
- RPC provider management
- Transaction monitoring
- Event listening
- Gas estimation
- Network failover

**Configuration**:
```env
STELLAR_RPC_URL=https://soroban-mainnet.stellar.org
ETHEREUM_RPC_URL=https://eth-mainnet.infura.io/v3/...
POLYGON_RPC_URL=https://polygon-rpc.com
NETWORK_TIMEOUT=10000
```

**Usage**:
```typescript
export class MonitoringService {
  constructor(private blockchainService: BlockchainService) {}
  
  async startMonitoring() {
    const provider = this.blockchainService.getProvider('ethereum');
    provider.on('pending', (txHash) => {
      // Process pending transaction
    });
  }
}
```

### PagerDuty Integration (`pagerduty/`)
**Purpose**: Escalate critical alerts to PagerDuty for incident management.

**Features**:
- Event API integration
- Incident creation and updates
- Severity-based routing
- Alert grouping (deduplication)
- Acknowledgment tracking

**Configuration**:
```env
PAGERDUTY_API_KEY=...
PAGERDUTY_SERVICE_ID=...
PAGERDUTY_ESCALATION_POLICY_ID=...
```

**Usage**:
```typescript
if (threat.severity === 'critical') {
  await this.pagerDutyService.createIncident({
    title: threat.name,
    severity: threat.severity,
    details: threat.description,
  });
}
```

## Error Handling & Resilience

All integrations implement:

1. **Retry Logic**: Exponential backoff for failures
2. **Circuit Breaker**: Prevent cascading failures
3. **Fallback**: Use alternative notification channels
4. **Logging**: Comprehensive error and success logging
5. **Monitoring**: Track integration health

## Health Checks

Each integration provides health checks:

```typescript
// DiscordService
async isHealthy(): Promise<boolean> {
  // Verify webhook is accessible
}

// BlockchainService  
async isHealthy(): Promise<boolean> {
  // Verify RPC connection
}
```

## Adding a New Integration

1. Create directory: `src/integrations/service-name/`
2. Create client/service files
3. Implement interface:
   ```typescript
   export interface IntegrationService {
     send(payload: unknown): Promise<void>;
     isHealthy(): Promise<boolean>;
   }
   ```
4. Create module and export
5. Document configuration and usage
6. Add health checks
7. Implement error handling

Example:

```typescript
// slack/slack.service.ts
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SlackService {
  private readonly logger = new Logger(SlackService.name);

  async sendAlert(message: string): Promise<void> {
    try {
      // Send to Slack API
    } catch (error) {
      this.logger.error('Failed to send Slack alert', error);
      throw error;
    }
  }

  async isHealthy(): Promise<boolean> {
    // Verify connectivity
  }
}
```

## Integration Testing

Each integration includes:

- Unit tests for services
- Mock external APIs
- Integration tests with actual services (optional)
- Load testing for high-volume scenarios

Example test:

```typescript
describe('DiscordService', () => {
  it('should send alert successfully', async () => {
    const service = new DiscordService(mockHttpClient);
    await service.sendAlert({ ... });
    expect(mockHttpClient.post).toHaveBeenCalled();
  });
});
```

## Configuration Management

Integrations use environment variables:

```env
# Discord
DISCORD_WEBHOOK_URL=...
DISCORD_ENABLED=true

# Telegram
TELEGRAM_BOT_TOKEN=...
TELEGRAM_ENABLED=true

# Blockchain
ETHEREUM_RPC_URL=...
STELLAR_RPC_URL=...

# PagerDuty
PAGERDUTY_API_KEY=...
```

Access in services:

```typescript
constructor(private configService: ConfigService) {
  this.webhookUrl = configService.get('DISCORD_WEBHOOK_URL');
}
```

## Performance Considerations

- **Async Processing**: Use queues for non-blocking sends
- **Caching**: Cache provider connections
- **Rate Limiting**: Respect API limits
- **Batching**: Group related alerts when possible
- **Timeouts**: Set appropriate timeouts per service

## Monitoring & Observability

All integrations track:

- Request/response times
- Success/failure rates
- Error types and frequencies
- API quota usage
- Health status changes

Integration with OpenTelemetry:

```typescript
@Span('discord.send_alert')
async sendAlert(message: string) {
  // Automatically traced
}
```

## Best Practices

1. **Isolation**: Each integration is independent
2. **Testability**: Mock external services in tests
3. **Documentation**: Document API usage and rate limits
4. **Error Handling**: Graceful degradation on failures
5. **Logging**: Comprehensive logs for debugging
6. **Configuration**: Externalize all configuration
7. **Health Checks**: Implement health endpoints
8. **Security**: Never log sensitive tokens or keys

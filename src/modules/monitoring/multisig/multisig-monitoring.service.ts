import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MultisigAccountConfig, MultisigEvent, MultisigAlert } from './types/multisig.types';

@Injectable()
export class MultisigMonitoringService {
  private readonly logger = new Logger(MultisigMonitoringService.name);

  // In-memory state tracking for threshold and signers
  private trackedWallets: Map<string, MultisigAccountConfig> = new Map();

  constructor(private readonly eventEmitter: EventEmitter2) {}

  /**
   * Register a multisig wallet for monitoring
   */
  registerWallet(config: MultisigAccountConfig): void {
    this.trackedWallets.set(config.address.toLowerCase(), { ...config });
    this.logger.log(
      `[MultisigMonitor] Registered wallet ${config.address} (Threshold: ${config.threshold}, Signers: ${config.signers.length})`,
    );
  }

  /**
   * Process raw multisig activity event from blockchain listener
   */
  async processActivity(event: Omit<MultisigEvent, 'id' | 'timestamp'>): Promise<void> {
    const fullEvent: MultisigEvent = {
      ...event,
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date(),
    };

    const walletKey = fullEvent.multisigAddress.toLowerCase();
    const currentState = this.trackedWallets.get(walletKey);

    this.logger.log(
      `[MultisigMonitor] Event detected on ${fullEvent.multisigAddress}: ${fullEvent.type}`,
    );

    // Track state modifications
    if (currentState) {
      this.updateWalletState(currentState, fullEvent);
    }

    // Evaluate security alerts
    const alert = this.detectSecurityAlert(fullEvent, currentState);
    if (alert) {
      this.dispatchAlert(alert);
    }

    // Emit event for downstream consumers
    this.eventEmitter.emit('multisig.activity', fullEvent);
  }

  private updateWalletState(state: MultisigAccountConfig, event: MultisigEvent): void {
    switch (event.type) {
      case 'THRESHOLD_CHANGED':
        if (event.newThreshold !== undefined) {
          state.threshold = event.newThreshold;
        }
        break;
      case 'SIGNER_ADDED':
        if (event.addedSigner && !state.signers.includes(event.addedSigner)) {
          state.signers.push(event.addedSigner);
        }
        break;
      case 'SIGNER_REMOVED':
        if (event.removedSigner) {
          state.signers = state.signers.filter(s => s !== event.removedSigner);
        }
        break;
    }
  }

  private detectSecurityAlert(
    event: MultisigEvent,
    state?: MultisigAccountConfig,
  ): MultisigAlert | null {
    let severity: 'INFO' | 'WARNING' | 'CRITICAL' | null = null;
    let title = '';
    let message = '';

    switch (event.type) {
      case 'THRESHOLD_CHANGED':
        severity = 'CRITICAL';
        title = '⚠️ Multisig Threshold Changed';
        message = `Threshold updated from ${event.oldThreshold ?? state?.threshold} to ${event.newThreshold} on ${event.multisigAddress} (Tx: ${event.txHash})`;
        break;

      case 'SIGNER_ADDED':
        severity = 'WARNING';
        title = '👤 New Signer Added';
        message = `Signer ${event.addedSigner} was added to multisig ${event.multisigAddress} (Tx: ${event.txHash})`;
        break;

      case 'SIGNER_REMOVED':
        severity = 'WARNING';
        title = '🗑️ Signer Removed';
        message = `Signer ${event.removedSigner} was removed from multisig ${event.multisigAddress} (Tx: ${event.txHash})`;
        break;

      case 'APPROVAL_SUBMITTED':
        severity = 'INFO';
        title = '✍️ Approval Submitted';
        message = `Signer ${event.signer} approved tx ${event.txHash} (${event.currentApprovals}/${event.requiredApprovals} approvals)`;
        break;

      case 'EXECUTION_FAILED':
        severity = 'CRITICAL';
        title = '🚨 Transaction Execution Failed';
        message = `Multisig transaction execution failed on ${event.multisigAddress} (Tx: ${event.txHash})`;
        break;
    }

    if (!severity) return null;

    return {
      id: `alt_${Date.now()}`,
      severity,
      multisigAddress: event.multisigAddress,
      title,
      message,
      event,
      timestamp: new Date(),
    };
  }

  private dispatchAlert(alert: MultisigAlert): void {
    this.logger.warn(`[ALERT][${alert.severity}] ${alert.title}: ${alert.message}`);
    this.eventEmitter.emit('multisig.alert', alert);
  }

  getWalletConfig(address: string): MultisigAccountConfig | undefined {
    return this.trackedWallets.get(address.toLowerCase());
  }
}

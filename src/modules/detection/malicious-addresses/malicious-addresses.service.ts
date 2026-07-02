import {
  MaliciousAddressRecord,
  AddressMatchResult,
  MaliciousAddressAlert,
  FeedUpdate,
} from './interfaces/malicious-addresses.interface';

/**
 * Service to detect and alert on interactions with known malicious addresses.
 * Supports real-time address matching, feed updates, and subscriber alerts.
 */
export class MaliciousAddressesService {
  private addressRecords = new Map<string, MaliciousAddressRecord>();
  private alertCallbacks: Array<(alert: MaliciousAddressAlert) => void> = [];

  constructor(useDefaults = true) {
    if (useDefaults) {
      this.loadDefaultMaliciousAddresses();
    }
  }

  /**
   * Helper to normalize blockchain addresses for comparison.
   * EVM/Hex addresses (starting with 0x) are case-insensitive, so we lowercase them.
   * Stellar and other addresses are trimmed.
   */
  private normalizeAddress(address: string): string {
    const trimmed = address.trim();
    if (trimmed.toLowerCase().startsWith('0x')) {
      return trimmed.toLowerCase();
    }
    return trimmed;
  }

  /**
   * Initialize the service with some known malicious default addresses.
   */
  private loadDefaultMaliciousAddresses(): void {
    const defaults: MaliciousAddressRecord[] = [
      {
        address: '0x95222290dd7278aa3ddd389cc1e1d165cc4bafe5',
        feedName: 'PhishGuard',
        reason: 'Known EVM wallet drainer involved in multiple phishing campaigns',
        severity: 'critical',
        flaggedAt: new Date().toISOString(),
      },
      {
        address: 'GA5Z3J2ABCDEFGHIJKLMNO1234567890STUVWXYZ',
        feedName: 'StellarThreatFeed',
        reason: 'Malicious Stellar account associated with fake asset distribution',
        severity: 'high',
        flaggedAt: new Date().toISOString(),
      },
    ];

    for (const record of defaults) {
      this.addressRecords.set(this.normalizeAddress(record.address), record);
    }
  }

  /**
   * Check if a single address matches any flagged address.
   */
  public matchAddress(address: string): AddressMatchResult {
    if (!address) {
      return { isMatched: false, address: '' };
    }
    const normalized = this.normalizeAddress(address);
    const matchedRecord = this.addressRecords.get(normalized);

    return {
      isMatched: !!matchedRecord,
      address,
      matchedRecord,
    };
  }

  /**
   * Batch check multiple addresses.
   */
  public checkAddresses(addresses: string[]): AddressMatchResult[] {
    return addresses.map(addr => this.matchAddress(addr));
  }

  /**
   * Scan a transaction object's standard fields (from, to, contractAddress)
   * for interactions with malicious addresses. If found, generates and emits an alert.
   */
  public checkTransaction(tx: {
    from?: string;
    to?: string;
    contractAddress?: string;
    hash?: string;
    network?: string;
    [key: string]: unknown;
  }): MaliciousAddressAlert | null {
    const addressesToCheck = [
      { field: 'from', value: tx.from },
      { field: 'to', value: tx.to },
      { field: 'contractAddress', value: tx.contractAddress },
    ].filter((item): item is { field: string; value: string } => !!item.value);

    for (const { field, value } of addressesToCheck) {
      const match = this.matchAddress(value);
      if (match.isMatched && match.matchedRecord) {
        const record = match.matchedRecord;
        const alert: MaliciousAddressAlert = {
          id: `alert-ma-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: 'Malicious Address Interaction Detected',
          description: `Transaction interacts with flagged address ${value} (${field}) from feed ${record.feedName}. Reason: ${record.reason}`,
          severity: record.severity,
          timestamp: new Date().toISOString(),
          metadata: {
            matchedAddress: value,
            feedName: record.feedName,
            reason: record.reason,
            transactionDetails: {
              field,
              hash: tx.hash,
              network: tx.network,
              ...tx,
            },
          },
        };

        this.emitAlert(alert);
        return alert;
      }
    }

    return null;
  }

  /**
   * Sync/update a feed. Clears old records for this feed and replaces them with new ones.
   */
  public updateFeed(feedUpdate: FeedUpdate): void {
    // Clear existing records from this feed
    this.clearFeed(feedUpdate.feedName);

    // Add the new records
    this.addAddresses(feedUpdate.feedName, feedUpdate.addresses);
  }

  /**
   * Add new flagged addresses under a specific feed.
   */
  public addAddresses(feedName: string, records: Omit<MaliciousAddressRecord, 'feedName'>[]): void {
    for (const record of records) {
      const normalized = this.normalizeAddress(record.address);
      this.addressRecords.set(normalized, {
        ...record,
        feedName,
      });
    }
  }

  /**
   * Clear all flagged addresses associated with a specific feed.
   */
  public clearFeed(feedName: string): void {
    for (const [key, record] of this.addressRecords.entries()) {
      if (record.feedName === feedName) {
        this.addressRecords.delete(key);
      }
    }
  }

  /**
   * Returns all currently stored malicious address records.
   */
  public getFlaggedAddresses(): MaliciousAddressRecord[] {
    return Array.from(this.addressRecords.values());
  }

  /**
   * Subscribe to alerts generated by this service.
   * Returns an unsubscribe function.
   */
  public onAlert(callback: (alert: MaliciousAddressAlert) => void): () => void {
    this.alertCallbacks.push(callback);
    return () => {
      this.alertCallbacks = this.alertCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Emit an alert to all registered subscribers.
   */
  private emitAlert(alert: MaliciousAddressAlert): void {
    for (const callback of this.alertCallbacks) {
      try {
        callback(alert);
      } catch (error) {
        // Prevent one faulty callback from aborting others
        console.error('Error in malicious address alert callback:', error);
      }
    }
  }
}

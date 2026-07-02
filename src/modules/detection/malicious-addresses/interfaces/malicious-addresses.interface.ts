/**
 * Represents a flagged malicious address entry in the detection database.
 */
export interface MaliciousAddressRecord {
  /** The blockchain address that has been flagged. */
  address: string;
  /** The name of the intelligence feed or source that flagged the address. */
  feedName: string;
  /** The reason why this address was flagged as malicious. */
  reason: string;
  /** Severity level associated with this malicious actor. */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** ISO-8601 timestamp when the address was added/flagged. */
  flaggedAt: string;
}

/**
 * Result of checking a specific address against the detection database.
 */
export interface AddressMatchResult {
  /** True if the address was found in the flagged address database. */
  isMatched: boolean;
  /** The address that was verified. */
  address: string;
  /** The matching record detailing why the address was flagged, if matched. */
  matchedRecord?: MaliciousAddressRecord;
}

/**
 * An alert generated on detecting a transaction or interaction with a malicious address.
 */
export interface MaliciousAddressAlert {
  /** Unique alert identifier. */
  id: string;
  /** Brief title for the alert. */
  title: string;
  /** Detailed description of the interaction. */
  description: string;
  /** Alert severity, matching the flagged address's severity. */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** ISO-8601 timestamp of when the alert was generated. */
  timestamp: string;
  /** Structured context/metadata about the interaction. */
  metadata: {
    /** The specific flagged address involved. */
    matchedAddress: string;
    /** The feed source that flagged the address. */
    feedName: string;
    /** The reason the address was flagged. */
    reason: string;
    /** Raw transaction or event details, if provided during checking. */
    transactionDetails?: Record<string, unknown>;
  };
}

/**
 * Payload for updating or syncing a malicious address feed.
 */
export interface FeedUpdate {
  /** Name of the threat feed being updated. */
  feedName: string;
  /** List of addresses and their attributes provided by this feed update. */
  addresses: Omit<MaliciousAddressRecord, 'feedName'>[];
}

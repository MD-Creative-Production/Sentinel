export type Severity = 'low' | 'medium' | 'high' | 'critical';

export type EventStatus = 'open' | 'investigating' | 'resolved' | 'dismissed';

export interface ThreatEvent {
  id: string;
  timestamp: string;
  chain: string;
  severity: Severity;
  signature: string;
  description: string;
  transactionHash: string;
  fromAddress: string;
  toAddress: string;
  riskScore: number;
  status: EventStatus;
}

export interface SearchResult {
  type: 'transaction' | 'address' | 'event' | 'contract';
  id: string;
  label: string;
  description: string;
  chain: string;
  timestamp: string;
}

export interface InvestigationNote {
  id: string;
  content: string;
  author: string;
  createdAt: string;
}

export interface Investigation {
  id: string;
  title: string;
  eventIds: string[];
  notes: InvestigationNote[];
  createdAt: string;
  updatedAt: string;
  status: 'open' | 'closed';
}

export const MOCK_EVENTS: ThreatEvent[] = [
  {
    id: 'evt-001',
    timestamp: '2026-06-17 08:32:01 UTC',
    chain: 'Ethereum',
    severity: 'critical',
    signature: 'renounceOwnership',
    description:
      'Ownership renouncement detected on Vault contract 0x1a2b...3c4d' +
      ' — possible rug pull precursor',
    transactionHash: '0xabcd...ef01',
    fromAddress: '0x1a2b...3c4d',
    toAddress: '0x0000...0000',
    riskScore: 95,
    status: 'open',
  },
  {
    id: 'evt-002',
    timestamp: '2026-06-17 06:15:45 UTC',
    chain: 'Soroban',
    severity: 'high',
    signature: 'set_admin',
    description: 'Unauthorized set_admin call on Soroban treasury contract',
    transactionHash: '0x2345...6789',
    fromAddress: '0x4e5f...6a7b',
    toAddress: '0x8c9d...0e1f',
    riskScore: 82,
    status: 'investigating',
  },
  {
    id: 'evt-003',
    timestamp: '2026-06-16 22:10:33 UTC',
    chain: 'Polygon',
    severity: 'high',
    signature: 'drainLiquidity',
    description: 'Sudden large-scale liquidity drain — 25% of pool removed in single transaction',
    transactionHash: '0x3456...7890',
    fromAddress: '0x5f6a...7b8c',
    toAddress: '0x9d0e...1f2a',
    riskScore: 88,
    status: 'open',
  },
  {
    id: 'evt-004',
    timestamp: '2026-06-16 14:05:12 UTC',
    chain: 'Ethereum',
    severity: 'medium',
    signature: 'emergencyPause',
    description: 'Emergency pause triggered by multisig on LendingPool',
    transactionHash: '0x4567...8901',
    fromAddress: '0x6a7b...8c9d',
    toAddress: '0x0e1f...2a3b',
    riskScore: 65,
    status: 'resolved',
  },
  {
    id: 'evt-005',
    timestamp: '2026-06-16 09:45:22 UTC',
    chain: 'Soroban',
    severity: 'medium',
    signature: 'upgrade',
    description: 'Unexpected contract upgrade detected on Soroban DEX',
    transactionHash: '0x5678...9012',
    fromAddress: '0x7b8c...9d0e',
    toAddress: '0x1f2a...3b4c',
    riskScore: 70,
    status: 'open',
  },
  {
    id: 'evt-006',
    timestamp: '2026-06-15 18:30:00 UTC',
    chain: 'Ethereum',
    severity: 'low',
    signature: 'mint',
    description: 'Unusual high-frequency minting pattern detected on Token contract',
    transactionHash: '0x6789...0123',
    fromAddress: '0x8c9d...0e1f',
    toAddress: '0x2a3b...4c5d',
    riskScore: 30,
    status: 'dismissed',
  },
  {
    id: 'evt-007',
    timestamp: '2026-06-15 11:20:15 UTC',
    chain: 'Polygon',
    severity: 'critical',
    signature: 'transfer',
    description: 'Large transfer from treasury to unknown address — 500k USDC',
    transactionHash: '0x7890...1234',
    fromAddress: '0x9d0e...1f2a',
    toAddress: '0x3b4c...5d6e',
    riskScore: 92,
    status: 'investigating',
  },
];

export const MOCK_SEARCH_RESULTS: SearchResult[] = [
  {
    type: 'transaction',
    id: 'tx-001',
    label: '0xabcd...ef01',
    description: 'Critical — renounceOwnership on Vault',
    chain: 'Ethereum',
    timestamp: '2026-06-17 08:32 UTC',
  },
  {
    type: 'address',
    id: 'addr-001',
    label: '0x1a2b...3c4d',
    description: 'Vault Contract — 3 alerts in last 24h',
    chain: 'Ethereum',
    timestamp: '2026-06-17 08:32 UTC',
  },
  {
    type: 'event',
    id: 'evt-002',
    label: 'set_admin on Soroban Treasury',
    description: 'Unauthorized admin change — investigating',
    chain: 'Soroban',
    timestamp: '2026-06-17 06:15 UTC',
  },
  {
    type: 'contract',
    id: 'contract-001',
    label: 'LendingPool (0x6a7b...8c9d)',
    description: 'Paused — contains known vulnerability',
    chain: 'Ethereum',
    timestamp: '2026-06-16 14:05 UTC',
  },
];

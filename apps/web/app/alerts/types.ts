export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface AlertEvent {
  id: string;
  timestamp: string;
  type: string;
  description: string;
  status: 'detected' | 'investigating' | 'resolved';
}

export interface Alert {
  id: string;
  title: string;
  severity: AlertSeverity;
  source: string;
  network: string;
  detectedAt: string;
  riskScore: number;
  explanation: string;
  metadata: Array<{ label: string; value: string }>;
  events: AlertEvent[];
}

export const ALERT_SEVERITIES: AlertSeverity[] = ['critical', 'high', 'medium', 'low'];

export const MOCK_ALERTS: Alert[] = [
  {
    id: 'alt-1001',
    title: 'Ownership renouncement detected on Vault',
    severity: 'critical',
    source: 'Contract monitor',
    network: 'Ethereum',
    detectedAt: '2026-08-20T09:42:00.000Z',
    riskScore: 95,
    explanation:
      'The Vault contract renounced ownership without a scheduled governance proposal. This pattern can remove emergency controls and is consistent with a potential rug-pull precursor.',
    metadata: [
      { label: 'Contract', value: '0x1a2b...3c4d' },
      { label: 'Function', value: 'renounceOwnership' },
      { label: 'Transaction', value: '0xabcd...ef01' },
    ],
    events: [
      {
        id: 'evt-1001-a',
        timestamp: '2026-08-20T09:42:00.000Z',
        type: 'Detection',
        description: 'Ownership renouncement transaction confirmed on Ethereum.',
        status: 'detected',
      },
      {
        id: 'evt-1001-b',
        timestamp: '2026-08-20T09:47:00.000Z',
        type: 'Correlation',
        description: 'No matching governance proposal found in the monitored registry.',
        status: 'investigating',
      },
    ],
  },
  {
    id: 'alt-1002',
    title: 'Unauthorized administrator change',
    severity: 'high',
    source: 'Governance monitor',
    network: 'Soroban',
    detectedAt: '2026-08-20T08:16:00.000Z',
    riskScore: 82,
    explanation: 'An administrator was changed outside the expected multisig approval path.',
    metadata: [
      { label: 'Contract', value: 'Treasury' },
      { label: 'Function', value: 'set_admin' },
      { label: 'Transaction', value: '0x2345...6789' },
    ],
    events: [
      {
        id: 'evt-1002-a',
        timestamp: '2026-08-20T08:16:00.000Z',
        type: 'Detection',
        description: 'set_admin call detected on the Treasury contract.',
        status: 'detected',
      },
    ],
  },
  {
    id: 'alt-1003',
    title: 'Large liquidity withdrawal from pool',
    severity: 'high',
    source: 'Anomaly engine',
    network: 'Polygon',
    detectedAt: '2026-08-19T22:10:00.000Z',
    riskScore: 88,
    explanation:
      'A single transaction removed 25% of available pool liquidity, well outside its normal range.',
    metadata: [
      { label: 'Pool', value: 'Stablecoin Pool' },
      { label: 'Amount', value: '25% of liquidity' },
      { label: 'Transaction', value: '0x3456...7890' },
    ],
    events: [
      {
        id: 'evt-1003-a',
        timestamp: '2026-08-19T22:10:00.000Z',
        type: 'Detection',
        description: 'Liquidity withdrawal exceeded the configured anomaly threshold.',
        status: 'detected',
      },
    ],
  },
  {
    id: 'alt-1004',
    title: 'Emergency pause triggered by multisig',
    severity: 'medium',
    source: 'Protocol monitor',
    network: 'Ethereum',
    detectedAt: '2026-08-19T14:05:00.000Z',
    riskScore: 65,
    explanation: 'A multisig paused the LendingPool after a sequence of unusual contract calls.',
    metadata: [
      { label: 'Contract', value: 'LendingPool' },
      { label: 'Function', value: 'emergencyPause' },
      { label: 'Transaction', value: '0x4567...8901' },
    ],
    events: [
      {
        id: 'evt-1004-a',
        timestamp: '2026-08-19T14:05:00.000Z',
        type: 'Detection',
        description: 'Emergency pause transaction confirmed.',
        status: 'resolved',
      },
    ],
  },
  {
    id: 'alt-1005',
    title: 'Unexpected contract upgrade',
    severity: 'medium',
    source: 'Contract monitor',
    network: 'Soroban',
    detectedAt: '2026-08-19T09:45:00.000Z',
    riskScore: 70,
    explanation: 'A contract implementation changed without the expected maintenance window.',
    metadata: [
      { label: 'Contract', value: 'Soroban DEX' },
      { label: 'Function', value: 'upgrade' },
      { label: 'Transaction', value: '0x5678...9012' },
    ],
    events: [
      {
        id: 'evt-1005-a',
        timestamp: '2026-08-19T09:45:00.000Z',
        type: 'Detection',
        description: 'Implementation slot changed on the monitored contract.',
        status: 'investigating',
      },
    ],
  },
  {
    id: 'alt-1006',
    title: 'High-frequency token minting pattern',
    severity: 'low',
    source: 'Behavioral analytics',
    network: 'Ethereum',
    detectedAt: '2026-08-18T18:30:00.000Z',
    riskScore: 30,
    explanation: 'The token contract minted more frequently than its historical baseline.',
    metadata: [
      { label: 'Contract', value: 'Token contract' },
      { label: 'Function', value: 'mint' },
      { label: 'Transaction', value: '0x6789...0123' },
    ],
    events: [
      {
        id: 'evt-1006-a',
        timestamp: '2026-08-18T18:30:00.000Z',
        type: 'Detection',
        description: 'Mint frequency returned to baseline after the initial spike.',
        status: 'resolved',
      },
    ],
  },
];

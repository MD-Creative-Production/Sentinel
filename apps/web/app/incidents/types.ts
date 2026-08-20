/**
 * Incident types for the investigation dashboard.
 *
 * The unions below mirror the string columns on the `Incident` Prisma model
 * (`prisma/schema.prisma`) so that the dashboard cannot drift from what the
 * database can actually store.
 */

/** Lifecycle states an incident moves through. */
export type IncidentStatus =
  | 'new'
  | 'open'
  | 'acknowledged'
  | 'investigating'
  | 'contained'
  | 'resolved'
  | 'closed'
  | 'reopened';

/** Response priority. P1 is the most urgent. */
export type IncidentPriority = 'p1' | 'p2' | 'p3' | 'p4';

/** Impact rating, independent of how urgently it is being worked. */
export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface Incident {
  id: string;
  title: string;
  description: string;
  status: IncidentStatus;
  severity: IncidentSeverity;
  priority: IncidentPriority;
  category?: string;
  assignedTo?: string;
  detectionSource?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

/** Every status, in lifecycle order, for rendering filters deterministically. */
export const INCIDENT_STATUSES: IncidentStatus[] = [
  'new',
  'open',
  'acknowledged',
  'investigating',
  'contained',
  'resolved',
  'closed',
  'reopened',
];

/** Every priority, most urgent first. */
export const INCIDENT_PRIORITIES: IncidentPriority[] = ['p1', 'p2', 'p3', 'p4'];

/** Human-readable labels for priorities, shown alongside the indicator dot. */
export const PRIORITY_LABELS: Record<IncidentPriority, string> = {
  p1: 'P1 — Critical',
  p2: 'P2 — High',
  p3: 'P3 — Normal',
  p4: 'P4 — Low',
};

/** Statuses that mean the incident no longer needs active work. */
export const TERMINAL_STATUSES: IncidentStatus[] = ['resolved', 'closed'];

export const isTerminal = (status: IncidentStatus): boolean => TERMINAL_STATUSES.includes(status);

export const MOCK_INCIDENTS: Incident[] = [
  {
    id: 'inc-1001',
    title: 'Unverified proxy upgrade on lending pool',
    description:
      'Proxy admin executed an implementation swap with no timelock delay. Funds remain in the pool pending review.',
    status: 'investigating',
    severity: 'critical',
    priority: 'p1',
    category: 'Smart Contract',
    assignedTo: 'A. Okafor',
    detectionSource: 'contract-monitor',
    tags: ['proxy', 'upgrade', 'ethereum'],
    createdAt: '2026-08-18T09:12:00.000Z',
    updatedAt: '2026-08-19T07:45:00.000Z',
  },
  {
    id: 'inc-1002',
    title: 'Bridge withdrawal spike from a single address',
    description:
      'One address accounted for 62% of bridge withdrawals in a ten minute window, well outside its historical pattern.',
    status: 'acknowledged',
    severity: 'high',
    priority: 'p2',
    category: 'Bridge',
    assignedTo: 'M. Adeyemi',
    detectionSource: 'anomaly-engine',
    tags: ['bridge', 'exfiltration'],
    createdAt: '2026-08-18T14:03:00.000Z',
    updatedAt: '2026-08-19T06:20:00.000Z',
  },
  {
    id: 'inc-1003',
    title: 'Oracle price deviation beyond tolerance',
    description:
      'Reported price diverged from the aggregate feed by 8.4% for three consecutive blocks.',
    status: 'contained',
    severity: 'high',
    priority: 'p2',
    category: 'Oracle',
    assignedTo: 'A. Okafor',
    detectionSource: 'price-feed-monitor',
    tags: ['oracle', 'deviation'],
    createdAt: '2026-08-17T22:47:00.000Z',
    updatedAt: '2026-08-18T11:10:00.000Z',
  },
  {
    id: 'inc-1004',
    title: 'Repeated failed admin authentication',
    description:
      'Fourteen failed sign-ins against an operator account from three regions inside an hour.',
    status: 'new',
    severity: 'medium',
    priority: 'p3',
    category: 'Access Control',
    detectionSource: 'auth-service',
    tags: ['auth', 'brute-force'],
    createdAt: '2026-08-19T05:31:00.000Z',
    updatedAt: '2026-08-19T05:31:00.000Z',
  },
  {
    id: 'inc-1005',
    title: 'Anomalous gas usage on settlement contract',
    description:
      'Settlement calls consumed roughly four times their usual gas. No loss of funds identified.',
    status: 'open',
    severity: 'low',
    priority: 'p4',
    category: 'Protocol Health',
    detectionSource: 'protocol-health',
    tags: ['gas', 'performance'],
    createdAt: '2026-08-16T18:22:00.000Z',
    updatedAt: '2026-08-17T09:05:00.000Z',
  },
  {
    id: 'inc-1006',
    title: 'Flash loan probing against vault',
    description:
      'Sequence of flash loans testing vault collateral limits. No position became liquidatable.',
    status: 'resolved',
    severity: 'medium',
    priority: 'p3',
    category: 'Smart Contract',
    assignedTo: 'M. Adeyemi',
    detectionSource: 'contract-monitor',
    tags: ['flash-loan', 'vault'],
    createdAt: '2026-08-14T11:58:00.000Z',
    updatedAt: '2026-08-15T16:40:00.000Z',
  },
  {
    id: 'inc-1007',
    title: 'Sanctioned address interaction',
    description: 'An address on the sanctions watchlist received funds from a monitored contract.',
    status: 'reopened',
    severity: 'critical',
    priority: 'p1',
    category: 'Compliance',
    assignedTo: 'A. Okafor',
    detectionSource: 'watchlist',
    tags: ['compliance', 'sanctions'],
    createdAt: '2026-08-12T08:15:00.000Z',
    updatedAt: '2026-08-19T04:02:00.000Z',
  },
  {
    id: 'inc-1008',
    title: 'Duplicate webhook deliveries from indexer',
    description:
      'Indexer replayed a block range, producing duplicate alerts. Deduplication has been confirmed working.',
    status: 'closed',
    severity: 'low',
    priority: 'p4',
    category: 'Infrastructure',
    detectionSource: 'indexer',
    tags: ['webhook', 'duplicates'],
    createdAt: '2026-08-10T13:44:00.000Z',
    updatedAt: '2026-08-11T10:12:00.000Z',
  },
];

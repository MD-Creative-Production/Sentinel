import React from 'react';
import './DashboardOverview.css';

// ── Types ──────────────────────────────────────────────────────────────────────

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';
export type ActivityType = AlertSeverity | 'info';

export interface AlertSummary {
  totalAlerts: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  resolvedCount: number;
  unresolvedCount: number;
}

export interface WatchlistEntry {
  id: string;
  name: string;
  address: string;
  network: string;
  isWallet: boolean;
  isContract: boolean;
  enabled: boolean;
}

export interface WatchlistStats {
  total: number;
  wallets: number;
  contracts: number;
  active: number;
  entries: WatchlistEntry[];
}

export interface ActivityEvent {
  id: string;
  description: string;
  chain: string;
  severity: ActivityType;
  relativeTime: string;
}

export interface DashboardData {
  generatedAt: string;
  periodDays: number;
  alertSummary: AlertSummary;
  watchlistStats: WatchlistStats;
  recentActivity: ActivityEvent[];
}

// ── Mock Data ──────────────────────────────────────────────────────────────────

const mockData: DashboardData = {
  generatedAt: new Date().toISOString(),
  periodDays: 7,
  alertSummary: {
    totalAlerts: 38,
    criticalCount: 3,
    highCount: 9,
    mediumCount: 14,
    lowCount: 12,
    resolvedCount: 29,
    unresolvedCount: 9,
  },
  watchlistStats: {
    total: 12,
    wallets: 8,
    contracts: 4,
    active: 11,
    entries: [
      {
        id: 'w-001',
        name: 'Treasury Multisig',
        address: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
        network: 'Ethereum',
        isWallet: true,
        isContract: false,
        enabled: true,
      },
      {
        id: 'w-002',
        name: 'Vault Contract',
        address: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RM',
        network: 'Soroban',
        isWallet: false,
        isContract: true,
        enabled: true,
      },
      {
        id: 'w-003',
        name: 'Hot Wallet Alpha',
        address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        network: 'Polygon',
        isWallet: true,
        isContract: false,
        enabled: true,
      },
      {
        id: 'w-004',
        name: 'Legacy LP Contract',
        address: '0xd3CdA913deB6f4967b2Ef3aa68f5A843dFb2F9E',
        network: 'Ethereum',
        isWallet: false,
        isContract: true,
        enabled: false,
      },
    ],
  },
  recentActivity: [
    {
      id: 'evt-001',
      description: 'Unauthorized set_admin call detected on Vault Contract',
      chain: 'Soroban',
      severity: 'critical',
      relativeTime: '12 min ago',
    },
    {
      id: 'evt-002',
      description: 'Large-scale transfer detected — 25% liquidity drain',
      chain: 'Polygon',
      severity: 'high',
      relativeTime: '1 hr ago',
    },
    {
      id: 'evt-003',
      description: 'Emergency Pause triggered by multisig address',
      chain: 'Ethereum',
      severity: 'high',
      relativeTime: '3 hr ago',
    },
    {
      id: 'evt-004',
      description: 'Unusual high-frequency minting behavior observed',
      chain: 'Ethereum',
      severity: 'medium',
      relativeTime: '5 hr ago',
    },
    {
      id: 'evt-005',
      description: 'New verified contract deployment matching known signature',
      chain: 'Soroban',
      severity: 'low',
      relativeTime: '9 hr ago',
    },
    {
      id: 'evt-006',
      description: 'Watchlist entry "Legacy LP Contract" disabled by user',
      chain: 'Ethereum',
      severity: 'info',
      relativeTime: '1 day ago',
    },
  ],
};

// ── Sub-components ─────────────────────────────────────────────────────────────

interface SummaryCardProps {
  value: number;
  label: string;
  variant: 'critical' | 'high' | 'warning' | 'success' | 'default';
  icon: React.ReactNode;
  delta?: string;
  delay?: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ value, label, variant, icon, delta, delay }) => (
  <div
    className={`do-card do-summary-card do-summary-card--${variant}`}
    style={{ '--delay': delay ?? '0s' } as React.CSSProperties}
    aria-label={`${label}: ${value}`}
  >
    <div className="do-summary-card__icon" aria-hidden="true">
      {icon}
    </div>
    <span className="do-summary-card__value">{value}</span>
    <span className="do-summary-card__label">{label}</span>
    {delta && <span className="do-summary-card__delta">{delta}</span>}
  </div>
);

// ── Severity Breakdown ─────────────────────────────────────────────────────────

interface SeverityBreakdownProps {
  summary: AlertSummary;
}

const SeverityBreakdown: React.FC<SeverityBreakdownProps> = ({ summary }) => {
  const levels: { key: keyof AlertSummary; label: string; variant: AlertSeverity }[] = [
    { key: 'criticalCount', label: 'Critical', variant: 'critical' },
    { key: 'highCount', label: 'High', variant: 'high' },
    { key: 'mediumCount', label: 'Medium', variant: 'medium' },
    { key: 'lowCount', label: 'Low', variant: 'low' },
  ];

  return (
    <section className="do-card do-severity" aria-label="Alert severity breakdown">
      <h2 className="do-section-title">Severity Breakdown</h2>
      <ul className="do-severity__list">
        {levels.map(({ key, label, variant }) => {
          const count = summary[key] as number;
          const pct = summary.totalAlerts > 0 ? (count / summary.totalAlerts) * 100 : 0;
          return (
            <li key={key} className="do-severity__row">
              <span className={`do-severity__badge do-severity__badge--${variant}`}>{label}</span>
              <div className="do-severity__track">
                <div
                  className={`do-severity__bar do-severity__bar--${variant}`}
                  style={{ width: `${pct}%` }}
                  role="progressbar"
                  aria-valuenow={count}
                  aria-valuemax={summary.totalAlerts}
                  aria-label={`${label} severity alerts`}
                />
              </div>
              <span className="do-severity__count">{count}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

// ── Watchlist Section ──────────────────────────────────────────────────────────

interface WatchlistSectionProps {
  stats: WatchlistStats;
}

const WatchlistSection: React.FC<WatchlistSectionProps> = ({ stats }) => (
  <section className="do-card do-watchlist" aria-label="Watchlist statistics">
    <h2 className="do-section-title">Watchlist</h2>

    <div className="do-watchlist__stats" aria-label="Watchlist summary statistics">
      <div className="do-watchlist__stat">
        <span className="do-watchlist__stat-value">{stats.total}</span>
        <span className="do-watchlist__stat-label">Total Entries</span>
      </div>
      <div className="do-watchlist__stat">
        <span className="do-watchlist__stat-value">{stats.active}</span>
        <span className="do-watchlist__stat-label">Active</span>
      </div>
      <div className="do-watchlist__stat">
        <span className="do-watchlist__stat-value">{stats.wallets}</span>
        <span className="do-watchlist__stat-label">Wallets</span>
      </div>
      <div className="do-watchlist__stat">
        <span className="do-watchlist__stat-value">{stats.contracts}</span>
        <span className="do-watchlist__stat-label">Contracts</span>
      </div>
    </div>

    <ul className="do-watchlist__entries" aria-label="Watchlist entries">
      {stats.entries.map(entry => (
        <li key={entry.id} className="do-watchlist__entry">
          <span
            className={`do-watchlist__entry-dot do-watchlist__entry-dot--${entry.enabled ? 'enabled' : 'disabled'}`}
            aria-label={entry.enabled ? 'Active' : 'Inactive'}
          />
          <div className="do-watchlist__entry-info">
            <span className="do-watchlist__entry-name">{entry.name}</span>
            <span className="do-watchlist__entry-address" title={entry.address}>
              {entry.address}
            </span>
          </div>
          <span
            className={`do-watchlist__entry-badge do-watchlist__entry-badge--${entry.isContract ? 'contract' : 'wallet'}`}
          >
            {entry.isContract ? 'Contract' : 'Wallet'}
          </span>
        </li>
      ))}
    </ul>
  </section>
);

// ── Recent Activity Feed ───────────────────────────────────────────────────────

interface ActivityFeedProps {
  events: ActivityEvent[];
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ events }) => (
  <section className="do-card do-activity" aria-label="Recent activity">
    <h2 className="do-section-title">Recent Activity</h2>
    <ol className="do-activity__feed" aria-label="Activity timeline">
      {events.map(event => (
        <li key={event.id} className="do-activity__item">
          <div className="do-activity__dot-wrap" aria-hidden="true">
            <div className={`do-activity__dot do-activity__dot--${event.severity}`} />
          </div>
          <div className="do-activity__body">
            <div className="do-activity__row">
              <span className="do-activity__desc">{event.description}</span>
              <time className="do-activity__time" dateTime={event.relativeTime}>
                {event.relativeTime}
              </time>
            </div>
            <div className="do-activity__meta">
              <span className="do-activity__chain">{event.chain}</span>
              {event.severity !== 'info' && (
                <span className={`do-activity__severity do-activity__severity--${event.severity}`}>
                  {event.severity}
                </span>
              )}
            </div>
          </div>
        </li>
      ))}
    </ol>
  </section>
);

// ── Icons ──────────────────────────────────────────────────────────────────────

const IconShield: React.FC<{ color: string }> = ({ color }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const IconAlert: React.FC<{ color: string }> = ({ color }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const IconCheck: React.FC<{ color: string }> = ({ color }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconClock: React.FC<{ color: string }> = ({ color }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconList: React.FC<{ color: string }> = ({ color }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);

// ── Main Component ─────────────────────────────────────────────────────────────

interface DashboardOverviewProps {
  data?: DashboardData;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ data = mockData }) => {
  const { generatedAt, periodDays, alertSummary, watchlistStats, recentActivity } = data;

  return (
    <main className="do-container" aria-label="Dashboard overview">
      <div className="do-inner">

        {/* Header */}
        <header className="do-header">
          <div className="do-header-left">
            <h1 className="do-title">Security Overview</h1>
            <p className="do-subtitle">Platform activity summary · Last {periodDays} days</p>
          </div>
          <time className="do-timestamp" dateTime={generatedAt}>
            Updated {new Date(generatedAt).toLocaleString()}
          </time>
        </header>

        {/* Alert Summary Cards */}
        <section className="do-summary-grid" aria-label="Alert summary">
          <SummaryCard
            value={alertSummary.totalAlerts}
            label="Total Alerts"
            variant="default"
            icon={<IconShield color="var(--do-indigo)" />}
            delay="0s"
          />
          <SummaryCard
            value={alertSummary.criticalCount}
            label="Critical"
            variant="critical"
            icon={<IconAlert color="var(--do-severity-critical-text)" />}
            delta={alertSummary.criticalCount > 0 ? 'Requires immediate attention' : 'All clear'}
            delay="0.05s"
          />
          <SummaryCard
            value={alertSummary.highCount}
            label="High Severity"
            variant="high"
            icon={<IconAlert color="var(--do-severity-high-text)" />}
            delay="0.1s"
          />
          <SummaryCard
            value={alertSummary.unresolvedCount}
            label="Unresolved"
            variant="warning"
            icon={<IconClock color="var(--do-severity-medium-text)" />}
            delay="0.15s"
          />
          <SummaryCard
            value={alertSummary.resolvedCount}
            label="Resolved"
            variant="success"
            icon={<IconCheck color="var(--do-success)" />}
            delay="0.2s"
          />
          <SummaryCard
            value={watchlistStats.total}
            label="Watchlist Items"
            variant="default"
            icon={<IconList color="var(--do-indigo)" />}
            delta={`${watchlistStats.active} active`}
            delay="0.25s"
          />
        </section>

        {/* Watchlist + Activity row */}
        <div className="do-row">
          <WatchlistSection stats={watchlistStats} />
          <ActivityFeed events={recentActivity} />
        </div>

        {/* Severity breakdown */}
        <SeverityBreakdown summary={alertSummary} />

      </div>
    </main>
  );
};

export default DashboardOverview;

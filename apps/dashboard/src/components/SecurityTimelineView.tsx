import React, { useState } from 'react';
import './SecurityTimelineView.css';

export type EventSeverity = 'critical' | 'high' | 'medium' | 'low';
export type EventGroup = 'Authentication' | 'Network' | 'Contract' | 'System';

export interface TimelineEvent {
  id: string;
  timestamp: string;
  severity: EventSeverity;
  group: EventGroup;
  title: string;
  description: string;
  chain?: string;
}

const mockEvents: TimelineEvent[] = [
  {
    id: 'tel-001',
    timestamp: '2026-06-17T14:00:00Z',
    severity: 'critical',
    group: 'Contract',
    title: 'Unauthorized Admin Change',
    description: 'set_admin called by non-owner on Vault Contract',
    chain: 'Soroban',
  },
  {
    id: 'tel-002',
    timestamp: '2026-06-17T12:45:00Z',
    severity: 'high',
    group: 'Network',
    title: 'Liquidity Drain Detected',
    description: '25% of liquidity transferred within 60 seconds',
    chain: 'Polygon',
  },
  {
    id: 'tel-003',
    timestamp: '2026-06-17T11:30:00Z',
    severity: 'medium',
    group: 'Authentication',
    title: 'Multisig Emergency Pause',
    description: 'Emergency pause triggered by multisig address',
    chain: 'Ethereum',
  },
  {
    id: 'tel-004',
    timestamp: '2026-06-17T09:15:00Z',
    severity: 'low',
    group: 'Contract',
    title: 'New Contract Deployment',
    description: 'Verified contract deployment matching known signature',
    chain: 'Soroban',
  },
  {
    id: 'tel-005',
    timestamp: '2026-06-17T08:00:00Z',
    severity: 'medium',
    group: 'System',
    title: 'High-Frequency Minting',
    description: 'Unusual high-frequency minting pattern observed',
    chain: 'Ethereum',
  },
];

const ALL = 'All';
const SEVERITY_LEVELS: EventSeverity[] = ['critical', 'high', 'medium', 'low'];
const GROUPS: EventGroup[] = ['Authentication', 'Network', 'Contract', 'System'];

interface Props {
  events?: TimelineEvent[];
}

export const SecurityTimelineView: React.FC<Props> = ({ events = mockEvents }) => {
  const [severityFilter, setSeverityFilter] = useState<string>(ALL);
  const [groupFilter, setGroupFilter] = useState<string>(ALL);

  const filtered = events
    .filter(e => severityFilter === ALL || e.severity === severityFilter)
    .filter(e => groupFilter === ALL || e.group === groupFilter)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="stv-container">
      <div className="stv-card">
        <div className="stv-header">
          <h2 className="stv-title">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Security Timeline
          </h2>

          <div className="stv-filters" role="group" aria-label="Timeline filters">
            <label htmlFor="severity-filter" className="stv-filter-label">
              Severity
            </label>
            <select
              id="severity-filter"
              className="stv-select"
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value)}
            >
              <option value={ALL}>All</option>
              {SEVERITY_LEVELS.map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <label htmlFor="group-filter" className="stv-filter-label">
              Group
            </label>
            <select
              id="group-filter"
              className="stv-select"
              value={groupFilter}
              onChange={e => setGroupFilter(e.target.value)}
            >
              <option value={ALL}>All</option>
              {GROUPS.map(g => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>

        <ol className="stv-timeline" aria-label="Security events timeline">
          {filtered.length === 0 ? (
            <li className="stv-empty">No events match the selected filters.</li>
          ) : (
            filtered.map(event => (
              <li key={event.id} className={`stv-event stv-event--${event.severity}`}>
                <div className="stv-dot" aria-hidden="true" />
                <div className="stv-content">
                  <div className="stv-meta">
                    <time className="stv-time" dateTime={event.timestamp}>
                      {new Date(event.timestamp).toLocaleString()}
                    </time>
                    <span className={`stv-badge stv-badge--${event.severity}`}>
                      {event.severity}
                    </span>
                    <span className="stv-group-badge">{event.group}</span>
                    {event.chain && <span className="stv-chain">{event.chain}</span>}
                  </div>
                  <p className="stv-event-title">{event.title}</p>
                  <p className="stv-event-desc">{event.description}</p>
                </div>
              </li>
            ))
          )}
        </ol>
      </div>
    </div>
  );
};

export default SecurityTimelineView;

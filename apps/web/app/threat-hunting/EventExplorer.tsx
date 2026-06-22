import React, { useMemo } from 'react';
import { ThreatEvent, Severity } from './types';
import './EventExplorer.css';

interface Props {
  events: ThreatEvent[];
  onInvestigate: (event: ThreatEvent) => void;
  selectedEvent: ThreatEvent | null;
  onSelectEvent: (event: ThreatEvent | null) => void;
}

function riskLevel(score: number): Severity {
  if (score >= 85) return 'critical';
  if (score >= 70) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
}

export const EventExplorer: React.FC<Props> = ({
  events,
  onInvestigate,
  selectedEvent,
  onSelectEvent,
}) => {
  const stats = useMemo(() => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0 };
    events.forEach(e => {
      if (e.severity === 'critical') counts.critical++;
      else if (e.severity === 'high') counts.high++;
      else if (e.severity === 'medium') counts.medium++;
      else counts.low++;
    });
    return counts;
  }, [events]);

  const sorted = useMemo(() => [...events].sort((a, b) => b.riskScore - a.riskScore), [events]);

  return (
    <div className="ee-container">
      <div className="ee-header">
        <div className="ee-header-left">
          <h2 className="ee-section-title">Event Explorer</h2>
          <p className="ee-section-desc">
            Browse and analyze detected security events ({events.length} total)
          </p>
        </div>
        <div className="ee-stats-row">
          {(Object.entries(stats) as [Severity, number][]).map(([severity, count]) => (
            <div key={severity} className="ee-stat">
              <span className={`ee-stat-dot ee-stat-dot--${severity}`} />
              <span className="ee-stat-count">{count}</span>
              <span className="ee-stat-label">{severity}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="ee-table-card">
        <table className="ee-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Severity</th>
              <th>Signature</th>
              <th>Chain</th>
              <th>Risk</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(event => (
              <tr
                key={event.id}
                className={selectedEvent?.id === event.id ? 'ee-row--selected' : ''}
                onClick={() => onSelectEvent(selectedEvent?.id === event.id ? null : event)}
              >
                <td>{event.timestamp}</td>
                <td>
                  <span className={`ee-severity-badge ee-severity-badge--${event.severity}`}>
                    {event.severity}
                  </span>
                </td>
                <td className="ee-signature-cell">{event.signature}</td>
                <td>
                  <span className="ee-chain-badge">{event.chain}</span>
                </td>
                <td>
                  <div className="ee-risk-bar">
                    <div className="ee-risk-track">
                      <div
                        className={`ee-risk-fill ee-risk-fill--${riskLevel(event.riskScore)}`}
                        style={{ width: `${event.riskScore}%` }}
                      />
                    </div>
                    <span className="ee-risk-score">{event.riskScore}</span>
                  </div>
                </td>
                <td>
                  <span className={`ee-status-badge ee-status-badge--${event.status}`}>
                    {event.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedEvent ? (
        <div className="ee-detail-panel">
          <div className="ee-detail-header">
            <h3 className="ee-detail-title">
              {selectedEvent.signature} &mdash; {selectedEvent.chain}
            </h3>
            <button
              className="ee-detail-investigate-btn"
              onClick={() => onInvestigate(selectedEvent)}
            >
              Start Investigation
            </button>
          </div>
          <div className="ee-detail-grid">
            <div className="ee-detail-field">
              <span className="ee-detail-field-label">Transaction Hash</span>
              <span className="ee-detail-field-value">{selectedEvent.transactionHash}</span>
            </div>
            <div className="ee-detail-field">
              <span className="ee-detail-field-label">From Address</span>
              <span className="ee-detail-field-value">{selectedEvent.fromAddress}</span>
            </div>
            <div className="ee-detail-field">
              <span className="ee-detail-field-label">To Address</span>
              <span className="ee-detail-field-value">{selectedEvent.toAddress}</span>
            </div>
            <div className="ee-detail-field">
              <span className="ee-detail-field-label">Risk Score</span>
              <span className="ee-detail-field-value">{selectedEvent.riskScore}/100</span>
            </div>
            <div className="ee-detail-field">
              <span className="ee-detail-field-label">Status</span>
              <span className="ee-detail-field-value">{selectedEvent.status}</span>
            </div>
            <div className="ee-detail-field">
              <span className="ee-detail-field-label">Description</span>
              <span className="ee-detail-field-value">{selectedEvent.description}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="ee-empty">
          <div className="ee-empty-icon">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <p>Select an event to view details</p>
        </div>
      )}
    </div>
  );
};

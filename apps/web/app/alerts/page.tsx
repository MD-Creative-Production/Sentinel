'use client';

import { useState } from 'react';
import { Alert, AlertSeverity, MOCK_ALERTS } from './types';
import './alerts.css';

const PAGE_SIZE = 4;

const formatDate = (value: string): string =>
  new Date(value).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

interface AlertFeedProps {
  alerts?: Alert[];
}

export function AlertFeed({ alerts = MOCK_ALERTS }: AlertFeedProps) {
  const [page, setPage] = useState(1);
  const [severity, setSeverity] = useState<AlertSeverity | 'all'>('all');
  const filteredAlerts =
    severity === 'all' ? alerts : alerts.filter(alert => alert.severity === severity);
  const pageCount = Math.max(1, Math.ceil(filteredAlerts.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visibleAlerts = filteredAlerts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const criticalCount = alerts.filter(alert => alert.severity === 'critical').length;

  const changeSeverity = (value: AlertSeverity | 'all') => {
    setSeverity(value);
    setPage(1);
  };

  return (
    <main className="alerts-page">
      <header className="alerts-header">
        <div>
          <h1 className="alerts-title">Alert Feed</h1>
          <p className="alerts-subtitle">Generated security alerts across monitored networks.</p>
        </div>
        <dl className="alerts-summary" aria-label="Alert summary">
          <div>
            <dt>Total alerts</dt>
            <dd>{alerts.length}</dd>
          </div>
          <div className="critical">
            <dt>Critical</dt>
            <dd>{criticalCount}</dd>
          </div>
        </dl>
      </header>

      <div className="alert-filter" role="group" aria-label="Filter alerts by severity">
        <label htmlFor="alert-severity">Severity</label>{' '}
        <select
          id="alert-severity"
          value={severity}
          onChange={event => changeSeverity(event.target.value as AlertSeverity | 'all')}
        >
          <option value="all">All severities</option>
          {(['critical', 'high', 'medium', 'low'] as AlertSeverity[]).map(value => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>

      {visibleAlerts.length === 0 ? (
        <p className="alert-empty" role="status">
          No alerts match this filter.
        </p>
      ) : (
        <ul className="alert-list" aria-label="Security alerts">
          {visibleAlerts.map(alert => (
            <li className="alert-row" key={alert.id}>
              <div className="alert-row-main">
                <div className="alert-row-heading">
                  <h2 className="alert-row-title">
                    <a href={`/alerts/${alert.id}`}>{alert.title}</a>
                  </h2>
                  <span className={`alert-severity alert-severity--${alert.severity}`}>
                    {alert.severity}
                  </span>
                </div>
                <p className="alert-row-description">{alert.explanation}</p>
                <div className="alert-row-meta">
                  <span>
                    <strong>{alert.source}</strong>
                  </span>
                  <span>{alert.network}</span>
                  <span>{formatDate(alert.detectedAt)}</span>
                </div>
              </div>
              <div className="alert-risk" aria-label={`Risk score ${alert.riskScore} out of 100`}>
                <span className="alert-risk-label">Risk</span>
                <span className="alert-risk-value">{alert.riskScore}</span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <nav className="alert-pagination" aria-label="Alert pagination">
        <button type="button" onClick={() => setPage(currentPage - 1)} disabled={currentPage === 1}>
          Previous
        </button>
        <span className="alert-page-count" aria-live="polite">
          Page {currentPage} of {pageCount}
        </span>
        <button
          type="button"
          onClick={() => setPage(currentPage + 1)}
          disabled={currentPage === pageCount}
        >
          Next
        </button>
      </nav>
    </main>
  );
}

export default AlertFeed;

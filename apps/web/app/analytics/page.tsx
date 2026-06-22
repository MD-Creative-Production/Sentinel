import React, { useState, useMemo } from 'react';
import { TrendChart } from './TrendChart';
import { AlertBreakdown } from './AlertBreakdown';
import { RiskSummary } from './RiskSummary';
import { MOCK_EVENTS } from '../threat-hunting/types';
import './analytics.css';

type TimeRange = '24h' | '7d' | '30d';

export const SecurityAnalyticsWorkspace: React.FC = () => {
  const [chainFilter, setChainFilter] = useState<string>('all');
  const [timeRangeFilter, setTimeRangeFilter] = useState<TimeRange>('7d');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  // Baseline date is June 17, 2026 matching mock data
  const baseDate = useMemo(() => new Date('2026-06-17T12:00:00Z'), []);

  // Filter events based on active filters
  const filteredEvents = useMemo(() => {
    return MOCK_EVENTS.filter(event => {
      // 1. Chain Filter
      if (chainFilter !== 'all' && event.chain.toLowerCase() !== chainFilter.toLowerCase()) {
        return false;
      }

      // 2. Severity Filter
      if (
        severityFilter !== 'all' &&
        event.severity.toLowerCase() !== severityFilter.toLowerCase()
      ) {
        return false;
      }

      // 3. Time Range Filter
      const eventTime = new Date(event.timestamp.replace(' UTC', 'Z')).getTime();
      const baseTime = baseDate.getTime();
      let thresholdTime = baseTime - 7 * 24 * 60 * 60 * 1000; // default 7d

      if (timeRangeFilter === '24h') {
        thresholdTime = baseTime - 24 * 60 * 60 * 1000;
      } else if (timeRangeFilter === '30d') {
        thresholdTime = baseTime - 30 * 24 * 60 * 60 * 1000;
      }

      return eventTime >= thresholdTime;
    });
  }, [chainFilter, timeRangeFilter, severityFilter, baseDate]);

  return (
    <div className="an-container">
      {/* Header and Title */}
      <header className="an-header">
        <div className="an-title-group">
          <h1 className="an-title">Security Insights Dashboard</h1>
          <p className="an-subtitle">
            Real-time threat analytics, trends, and risk indicators across monitored networks
          </p>
        </div>

        {/* Filters Panel */}
        <div className="an-filters-bar" role="search" aria-label="Dashboard Filters">
          {/* Chain filter selection */}
          <div className="an-filter-group">
            <label className="an-filter-label" htmlFor="chain-filter">
              Network
            </label>
            <select
              id="chain-filter"
              className="an-filter-select"
              value={chainFilter}
              onChange={e => setChainFilter(e.target.value)}
              aria-label="Filter by Network"
            >
              <option value="all">All Networks</option>
              <option value="Ethereum">Ethereum</option>
              <option value="Soroban">Soroban</option>
              <option value="Polygon">Polygon</option>
            </select>
          </div>

          {/* Time range selection */}
          <div className="an-filter-group">
            <label className="an-filter-label" htmlFor="time-filter">
              Time Range
            </label>
            <select
              id="time-filter"
              className="an-filter-select"
              value={timeRangeFilter}
              onChange={e => setTimeRangeFilter(e.target.value as TimeRange)}
              aria-label="Filter by Time Range"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>

          {/* Severity level selection */}
          <div className="an-filter-group">
            <label className="an-filter-label" htmlFor="severity-filter">
              Severity
            </label>
            <select
              id="severity-filter"
              className="an-filter-select"
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value)}
              aria-label="Filter by Severity"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </header>

      {/* Main Grid content */}
      {filteredEvents.length === 0 ? (
        <div className="an-card an-empty-state" role="status" aria-label="No data available">
          <div className="an-empty-icon">📊</div>
          <h3>No events match the selected filters</h3>
          <p>Try adjusting your filters above to view threat metrics</p>
        </div>
      ) : (
        <div className="an-grid">
          {/* Main Visual charts & breakdowns */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Trend Chart */}
            <section className="an-card" aria-label="Threat trend timeline">
              <h2 className="an-card-title">Threat Trend Timeline</h2>
              <TrendChart events={filteredEvents} timeRange={timeRangeFilter} />
            </section>

            {/* Alert Breakdowns */}
            <section className="an-card" aria-label="Alert distribution breakdowns">
              <h2 className="an-card-title">Alert Breakdowns</h2>
              <AlertBreakdown events={filteredEvents} />
            </section>
          </div>

          {/* Side Risk metrics and summaries */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <section className="an-card" aria-label="Overall risk analysis">
              <h2 className="an-card-title">Risk Assessment Summary</h2>
              <RiskSummary events={filteredEvents} />
            </section>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityAnalyticsWorkspace;

import React from 'react';
import { ThreatEvent } from '../threat-hunting/types';

interface AlertBreakdownProps {
  events: ThreatEvent[];
}

export const AlertBreakdown: React.FC<AlertBreakdownProps> = ({ events }) => {
  const total = events.length;

  // 1. Severity Breakdown
  const getSeverityCount = (severity: string) => events.filter(e => e.severity === severity).length;
  const severities: { key: string; colorClass: string }[] = [
    { key: 'critical', colorClass: 'an-fill-critical' },
    { key: 'high', colorClass: 'an-fill-high' },
    { key: 'medium', colorClass: 'an-fill-medium' },
    { key: 'low', colorClass: 'an-fill-low' },
  ];

  // 2. Chain/Network Breakdown
  const chains = Array.from(new Set(events.map(e => e.chain)));
  const chainBreakdown = chains
    .map(chain => {
      const count = events.filter(e => e.chain === chain).length;
      return { chain, count, pct: total ? (count / total) * 100 : 0 };
    })
    .sort((a, b) => b.count - a.count);

  // 3. Signature Breakdown
  const signaturesMap: Record<string, number> = {};
  events.forEach(e => {
    signaturesMap[e.signature] = (signaturesMap[e.signature] || 0) + 1;
  });
  const topSignatures = Object.entries(signaturesMap)
    .map(([signature, count]) => ({ signature, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  return (
    <div className="an-breakdown-container">
      {/* Severity distribution */}
      <section className="an-breakdown-section" aria-label="Breakdown by severity">
        <div className="an-breakdown-header">Severity Distribution</div>
        {severities.map(({ key, colorClass }) => {
          const count = getSeverityCount(key);
          const pct = total ? (count / total) * 100 : 0;
          return (
            <div key={key} className="an-progress-row">
              <span className="an-progress-label">{key}</span>
              <div className="an-progress-bar">
                <div
                  className={`an-progress-fill ${colorClass}`}
                  style={{ width: `${pct}%` }}
                  role="progressbar"
                  aria-valuenow={count}
                  aria-valuemin={0}
                  aria-valuemax={total}
                  aria-label={`${key} severity percentage`}
                />
              </div>
              <span className="an-progress-val">{count}</span>
            </div>
          );
        })}
      </section>

      {/* Network breakdown */}
      <section className="an-breakdown-section" aria-label="Breakdown by chain">
        <div className="an-breakdown-header">Network breakdown</div>
        {chainBreakdown.length === 0 ? (
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
            No networks found
          </div>
        ) : (
          chainBreakdown.map(({ chain, count, pct }) => (
            <div key={chain} className="an-progress-row">
              <span className="an-progress-label">{chain}</span>
              <div className="an-progress-bar">
                <div
                  className="an-progress-fill"
                  style={{ width: `${pct}%`, backgroundColor: 'var(--color-accent-cyan)' }}
                  role="progressbar"
                  aria-valuenow={count}
                  aria-valuemin={0}
                  aria-valuemax={total}
                  aria-label={`${chain} network percentage`}
                />
              </div>
              <span className="an-progress-val">{count}</span>
            </div>
          ))
        )}
      </section>

      {/* Top Threat types (Signatures) */}
      <section className="an-breakdown-section" aria-label="Top threats by signature">
        <div className="an-breakdown-header">Top Threat Types</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {topSignatures.length === 0 ? (
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
              No threat types found
            </div>
          ) : (
            topSignatures.map(({ signature, count }) => (
              <div
                key={signature}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.85rem',
                  padding: '0.5rem 0.75rem',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '6px',
                }}
              >
                <span style={{ fontFamily: 'monospace', color: '#E2E8F0' }}>{signature}</span>
                <span style={{ fontWeight: 600 }}>
                  {count} {count === 1 ? 'alert' : 'alerts'}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

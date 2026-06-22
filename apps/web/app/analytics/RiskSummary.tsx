import React from 'react';
import { ThreatEvent } from '../threat-hunting/types';

interface RiskSummaryProps {
  events: ThreatEvent[];
}

export const RiskSummary: React.FC<RiskSummaryProps> = ({ events }) => {
  const total = events.length;

  // Calculate average risk score
  const avgScore = total ? Math.round(events.reduce((sum, e) => sum + e.riskScore, 0) / total) : 0;

  // Categorize overall risk level
  let riskCategory = 'Low';
  let badgeClass = 'an-risk--low';

  if (avgScore >= 85) {
    riskCategory = 'Critical';
    badgeClass = 'an-risk--critical';
  } else if (avgScore >= 70) {
    riskCategory = 'High';
    badgeClass = 'an-risk--high';
  } else if (avgScore >= 45) {
    riskCategory = 'Medium';
    badgeClass = 'an-risk--medium';
  }

  // Circular gauge setup
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  // Calculate dash offset based on percentage
  const strokeDashoffset = circumference - (avgScore / 100) * circumference;

  // Filter high-risk indicators (risk score >= 70)
  const highRiskEvents = events.filter(e => e.riskScore >= 70).slice(0, 3);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      {/* Circular Gauge */}
      <section className="an-risk-gauge-container" aria-label="Overall risk level gauge">
        <svg className="an-risk-ring-svg">
          <circle className="an-risk-ring-bg" cx="70" cy="70" r={radius} />
          <circle
            className="an-risk-ring-fill"
            cx="70"
            cy="70"
            r={radius}
            strokeDasharray={circumference}
            strokeDashoffset={total ? strokeDashoffset : circumference}
          />
        </svg>
        <div className="an-risk-score-display">
          <span className="an-risk-score-value">{avgScore}</span>
          <span className="an-risk-score-label">Avg Risk</span>
        </div>
      </section>

      {/* Risk Level Badge */}
      <div className={`an-risk-badge ${badgeClass}`}>{riskCategory} Threat Level</div>

      {/* Key Risk Indicators */}
      <section className="an-indicators-list" aria-label="Key risk indicators">
        <div className="an-breakdown-header" style={{ marginBottom: '0.25rem' }}>
          Key Risk Indicators
        </div>
        {highRiskEvents.length === 0 ? (
          <div
            style={{
              fontSize: '0.85rem',
              color: 'var(--color-text-secondary)',
              textAlign: 'center',
              padding: '1rem',
            }}
          >
            No high risk threats detected
          </div>
        ) : (
          highRiskEvents.map(event => (
            <div key={event.id} className="an-indicator-item">
              <div>
                <div className="an-indicator-title">{event.signature}</div>
                <div className="an-indicator-sub">
                  {event.description.length > 32
                    ? `${event.description.substring(0, 32)}...`
                    : event.description}
                </div>
              </div>
              <span
                className={`an-indicator-badge ${
                  event.chain.toLowerCase() === 'ethereum'
                    ? 'an-badge--eth'
                    : event.chain.toLowerCase() === 'soroban'
                      ? 'an-badge--soroban'
                      : 'an-badge--polygon'
                }`}
              >
                {event.chain}
              </span>
            </div>
          ))
        )}
      </section>
    </div>
  );
};
export default RiskSummary;

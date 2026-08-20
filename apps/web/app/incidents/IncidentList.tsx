import React from 'react';
import { Incident, PRIORITY_LABELS, isTerminal } from './types';

interface IncidentListProps {
  incidents: Incident[];
}

const formatTimestamp = (iso: string): string => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toISOString().replace('T', ' ').slice(0, 16);
};

/**
 * The incident listing.
 *
 * Each row leads with a priority indicator: a colour-coded dot plus its literal
 * priority text. Colour alone would leave the most important signal on the page
 * unreadable to anyone who cannot distinguish the hues, so the label is always
 * rendered and the dot carries no information of its own.
 */
export const IncidentList: React.FC<IncidentListProps> = ({ incidents }) => {
  if (incidents.length === 0) {
    return (
      <div className="inc-empty" role="status">
        <p className="inc-empty-title">No incidents match these filters</p>
        <p className="inc-empty-hint">Clear a filter to widen the search.</p>
      </div>
    );
  }

  return (
    <ul className="inc-list" aria-label="Incidents">
      {incidents.map(incident => (
        <li
          key={incident.id}
          className={`inc-row ${isTerminal(incident.status) ? 'inc-row--terminal' : ''}`}
        >
          <div className="inc-row-priority">
            <span
              className={`inc-priority-dot inc-priority-dot--${incident.priority}`}
              aria-hidden="true"
            />
            <span className="inc-priority-label">{PRIORITY_LABELS[incident.priority]}</span>
          </div>

          <div className="inc-row-main">
            <div className="inc-row-heading">
              <h3 className="inc-row-title">{incident.title}</h3>
              <span className={`inc-status inc-status--${incident.status}`}>{incident.status}</span>
              <span className={`inc-severity inc-severity--${incident.severity}`}>
                {incident.severity}
              </span>
            </div>

            <p className="inc-row-description">{incident.description}</p>

            <dl className="inc-row-meta">
              <div className="inc-meta-item">
                <dt>ID</dt>
                <dd>{incident.id}</dd>
              </div>
              {incident.category && (
                <div className="inc-meta-item">
                  <dt>Category</dt>
                  <dd>{incident.category}</dd>
                </div>
              )}
              <div className="inc-meta-item">
                <dt>Owner</dt>
                <dd>{incident.assignedTo ?? 'Unassigned'}</dd>
              </div>
              {incident.detectionSource && (
                <div className="inc-meta-item">
                  <dt>Source</dt>
                  <dd>{incident.detectionSource}</dd>
                </div>
              )}
              <div className="inc-meta-item">
                <dt>Updated</dt>
                <dd>{formatTimestamp(incident.updatedAt)}</dd>
              </div>
            </dl>

            {incident.tags.length > 0 && (
              <ul className="inc-tags" aria-label={`Tags for ${incident.title}`}>
                {incident.tags.map(tag => (
                  <li key={tag} className="inc-tag">
                    {tag}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
};

export default IncidentList;

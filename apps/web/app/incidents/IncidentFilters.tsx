import React from 'react';
import {
  Incident,
  IncidentPriority,
  IncidentStatus,
  INCIDENT_PRIORITIES,
  INCIDENT_STATUSES,
  PRIORITY_LABELS,
} from './types';

export type StatusFilter = IncidentStatus | 'all';
export type PriorityFilter = IncidentPriority | 'all';

interface IncidentFiltersProps {
  incidents: Incident[];
  status: StatusFilter;
  priority: PriorityFilter;
  onStatusChange: (status: StatusFilter) => void;
  onPriorityChange: (priority: PriorityFilter) => void;
}

/**
 * Status and priority filters.
 *
 * Counts are computed from the unfiltered incident set so that each control
 * shows how many incidents it would reveal, rather than how many are currently
 * on screen. A filter that would show nothing is disabled instead of hidden, so
 * the set of controls stays stable as the data changes.
 */
export const IncidentFilters: React.FC<IncidentFiltersProps> = ({
  incidents,
  status,
  priority,
  onStatusChange,
  onPriorityChange,
}) => {
  const countByStatus = (value: IncidentStatus) =>
    incidents.filter(incident => incident.status === value).length;

  const countByPriority = (value: IncidentPriority) =>
    incidents.filter(incident => incident.priority === value).length;

  return (
    <section className="inc-filters" aria-label="Incident filters">
      <div className="inc-filter-group" role="group" aria-label="Filter by status">
        <span className="inc-filter-legend">Status</span>
        <button
          type="button"
          className={`inc-chip ${status === 'all' ? 'inc-chip--active' : ''}`}
          aria-pressed={status === 'all'}
          onClick={() => onStatusChange('all')}
        >
          All <span className="inc-chip-count">{incidents.length}</span>
        </button>
        {INCIDENT_STATUSES.map(value => {
          const count = countByStatus(value);
          return (
            <button
              key={value}
              type="button"
              className={`inc-chip inc-chip--${value} ${status === value ? 'inc-chip--active' : ''}`}
              aria-pressed={status === value}
              disabled={count === 0}
              onClick={() => onStatusChange(value)}
            >
              {value} <span className="inc-chip-count">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="inc-filter-group" role="group" aria-label="Filter by priority">
        <span className="inc-filter-legend">Priority</span>
        <button
          type="button"
          className={`inc-chip ${priority === 'all' ? 'inc-chip--active' : ''}`}
          aria-pressed={priority === 'all'}
          onClick={() => onPriorityChange('all')}
        >
          All <span className="inc-chip-count">{incidents.length}</span>
        </button>
        {INCIDENT_PRIORITIES.map(value => {
          const count = countByPriority(value);
          return (
            <button
              key={value}
              type="button"
              className={`inc-chip inc-chip--${value} ${priority === value ? 'inc-chip--active' : ''}`}
              aria-pressed={priority === value}
              disabled={count === 0}
              onClick={() => onPriorityChange(value)}
              title={PRIORITY_LABELS[value]}
            >
              {value.toUpperCase()} <span className="inc-chip-count">{count}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default IncidentFilters;

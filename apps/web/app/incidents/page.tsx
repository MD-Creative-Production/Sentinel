import React, { useMemo, useState } from 'react';
import { IncidentFilters, PriorityFilter, StatusFilter } from './IncidentFilters';
import { IncidentList } from './IncidentList';
import { Incident, INCIDENT_PRIORITIES, MOCK_INCIDENTS, isTerminal } from './types';
import './incidents.css';

interface IncidentDashboardProps {
  /** Injectable for tests and for wiring to a real data source later. */
  incidents?: Incident[];
}

/**
 * Incident dashboard — a dedicated workspace for active investigations.
 *
 * Data is supplied by the caller so the view stays a pure function of its
 * props; it falls back to the mock set, matching how the other workspaces in
 * `apps/web/app` currently source their data.
 */
export const IncidentDashboard: React.FC<IncidentDashboardProps> = ({
  incidents = MOCK_INCIDENTS,
}) => {
  const [status, setStatus] = useState<StatusFilter>('all');
  const [priority, setPriority] = useState<PriorityFilter>('all');

  const visibleIncidents = useMemo(
    () =>
      incidents.filter(incident => {
        const statusMatches = status === 'all' || incident.status === status;
        const priorityMatches = priority === 'all' || incident.priority === priority;
        return statusMatches && priorityMatches;
      }),
    [incidents, status, priority],
  );

  const activeCount = useMemo(
    () => incidents.filter(incident => !isTerminal(incident.status)).length,
    [incidents],
  );

  const urgentCount = useMemo(
    () =>
      incidents.filter(incident => incident.priority === 'p1' && !isTerminal(incident.status))
        .length,
    [incidents],
  );

  const unassignedCount = useMemo(
    () => incidents.filter(incident => !incident.assignedTo && !isTerminal(incident.status)).length,
    [incidents],
  );

  const filtersApplied = status !== 'all' || priority !== 'all';

  const clearFilters = () => {
    setStatus('all');
    setPriority('all');
  };

  return (
    <div className="inc-dashboard">
      <header className="inc-header">
        <div>
          <h1 className="inc-title">Incident Dashboard</h1>
          <p className="inc-subtitle">A dedicated workspace for active security investigations.</p>
        </div>

        {/* A bare <dl> exposes no ARIA role, so the label would be dropped by
            assistive tech. role="group" makes the grouping addressable. */}
        <dl className="inc-summary" role="group" aria-label="Incident summary">
          <div className="inc-summary-item">
            <dt>Active</dt>
            <dd>{activeCount}</dd>
          </div>
          <div className="inc-summary-item inc-summary-item--urgent">
            <dt>P1 open</dt>
            <dd>{urgentCount}</dd>
          </div>
          <div className="inc-summary-item">
            <dt>Unassigned</dt>
            <dd>{unassignedCount}</dd>
          </div>
        </dl>
      </header>

      <IncidentFilters
        incidents={incidents}
        status={status}
        priority={priority}
        onStatusChange={setStatus}
        onPriorityChange={setPriority}
      />

      <div className="inc-results">
        <p className="inc-results-count" role="status">
          Showing {visibleIncidents.length} of {incidents.length} incidents
        </p>
        {filtersApplied && (
          <button type="button" className="inc-clear" onClick={clearFilters}>
            Clear filters
          </button>
        )}
      </div>

      <IncidentList incidents={visibleIncidents} />
    </div>
  );
};

export default IncidentDashboard;

/** Re-exported so callers can render a priority legend without reaching into types. */
export { INCIDENT_PRIORITIES };

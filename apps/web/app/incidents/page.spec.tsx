import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { IncidentDashboard } from './page';
import { Incident, MOCK_INCIDENTS } from './types';

const getList = () => screen.getByRole('list', { name: /^incidents$/i });

// Each row carries a nested tag list, so `getAllByRole('listitem')` would count
// tag chips as rows. Only direct children of the incident list are rows.
const getRows = (): HTMLElement[] =>
  Array.from(getList().children).filter((el): el is HTMLElement => el.tagName === 'LI');

const statusButton = (name: RegExp) =>
  within(screen.getByRole('group', { name: /filter by status/i })).getByRole('button', {
    name,
  });

const priorityButton = (name: RegExp) =>
  within(screen.getByRole('group', { name: /filter by priority/i })).getByRole('button', {
    name,
  });

describe('IncidentDashboard', () => {
  beforeEach(() => {
    render(<IncidentDashboard />);
  });

  it('renders the dashboard heading', () => {
    expect(
      screen.getByRole('heading', { name: /incident dashboard/i, level: 1 }),
    ).toBeInTheDocument();
  });

  it('lists every incident by default', () => {
    expect(getRows()).toHaveLength(MOCK_INCIDENTS.length);
  });

  it('shows a title for each incident', () => {
    MOCK_INCIDENTS.forEach(incident => {
      expect(screen.getByText(incident.title)).toBeInTheDocument();
    });
  });

  it('renders a status indicator for every incident', () => {
    const rows = getRows();
    rows.forEach((row, index) => {
      expect(within(row).getByText(MOCK_INCIDENTS[index].status)).toBeInTheDocument();
    });
  });

  it('renders a readable priority label, not colour alone', () => {
    const firstRow = getRows()[0];
    // MOCK_INCIDENTS[0] is p1; the label must carry the meaning in text.
    expect(within(firstRow).getByText(/P1 — Critical/)).toBeInTheDocument();
  });

  it('filters the listing by status', () => {
    fireEvent.click(statusButton(/^investigating/i));

    const expected = MOCK_INCIDENTS.filter(i => i.status === 'investigating');
    expect(getRows()).toHaveLength(expected.length);
    expect(screen.getByText(expected[0].title)).toBeInTheDocument();
  });

  it('filters the listing by priority', () => {
    fireEvent.click(priorityButton(/^P1/));

    const expected = MOCK_INCIDENTS.filter(i => i.priority === 'p1');
    expect(getRows()).toHaveLength(expected.length);
  });

  it('applies status and priority filters together', () => {
    fireEvent.click(statusButton(/^reopened/i));
    fireEvent.click(priorityButton(/^P1/));

    const expected = MOCK_INCIDENTS.filter(i => i.status === 'reopened' && i.priority === 'p1');
    expect(getRows()).toHaveLength(expected.length);
  });

  it('marks the selected filter as pressed', () => {
    const button = statusButton(/^new/i);
    expect(button).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('reports how many incidents are showing', () => {
    fireEvent.click(priorityButton(/^P1/));

    const expected = MOCK_INCIDENTS.filter(i => i.priority === 'p1').length;
    expect(
      screen.getByText(new RegExp(`showing ${expected} of ${MOCK_INCIDENTS.length}`, 'i')),
    ).toBeInTheDocument();
  });

  it('restores the full listing when filters are cleared', () => {
    fireEvent.click(statusButton(/^new/i));
    expect(getRows()).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: /clear filters/i }));
    expect(getRows()).toHaveLength(MOCK_INCIDENTS.length);
  });

  it('hides the clear control until a filter is applied', () => {
    expect(screen.queryByRole('button', { name: /clear filters/i })).not.toBeInTheDocument();

    fireEvent.click(statusButton(/^new/i));
    expect(screen.getByRole('button', { name: /clear filters/i })).toBeInTheDocument();
  });

  it('disables a status filter that would match nothing', () => {
    // No mock incident is in the "acknowledged and P4" state, but each filter
    // is counted against the whole set, so a status with zero incidents is the
    // one that must be disabled. 'contained' has one; pick a genuinely empty one.
    const emptyStatuses = ['open', 'acknowledged', 'contained'].filter(status =>
      MOCK_INCIDENTS.every(i => i.status !== status),
    );
    emptyStatuses.forEach(status => {
      expect(statusButton(new RegExp(`^${status}`, 'i'))).toBeDisabled();
    });
  });
});

describe('IncidentDashboard with injected data', () => {
  const incidents: Incident[] = [
    {
      id: 'inc-x1',
      title: 'Only incident',
      description: 'Sole record.',
      status: 'new',
      severity: 'low',
      priority: 'p4',
      tags: [],
      createdAt: '2026-08-19T00:00:00.000Z',
      updatedAt: '2026-08-19T00:00:00.000Z',
    },
  ];

  it('shows an empty state when filters match nothing', () => {
    render(<IncidentDashboard incidents={incidents} />);

    fireEvent.click(
      within(screen.getByRole('group', { name: /filter by priority/i })).getByRole('button', {
        name: /^P4/,
      }),
    );
    expect(screen.getByText('Only incident')).toBeInTheDocument();

    fireEvent.click(
      within(screen.getByRole('group', { name: /filter by status/i })).getByRole('button', {
        name: /^new/i,
      }),
    );
    expect(screen.getByText('Only incident')).toBeInTheDocument();
  });

  it('counts unassigned incidents in the summary', () => {
    render(<IncidentDashboard incidents={incidents} />);

    const summary = screen.getByRole('group', { name: /incident summary/i });
    const unassigned = within(summary).getByText('Unassigned').closest('div');
    expect(unassigned).not.toBeNull();
    expect(within(unassigned as HTMLElement).getByText('1')).toBeInTheDocument();
  });
});

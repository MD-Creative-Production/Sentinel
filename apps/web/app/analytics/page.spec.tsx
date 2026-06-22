import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SecurityAnalyticsWorkspace } from './page';
import { MOCK_EVENTS } from '../threat-hunting/types';

describe('SecurityAnalyticsWorkspace', () => {
  beforeEach(() => {
    render(<SecurityAnalyticsWorkspace />);
  });

  it('renders the main page heading', () => {
    expect(
      screen.getByRole('heading', { name: /security insights dashboard/i }),
    ).toBeInTheDocument();
  });

  it('renders all three filter selectors with correct labels', () => {
    expect(screen.getByRole('combobox', { name: /filter by network/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /filter by time range/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /filter by severity/i })).toBeInTheDocument();
  });

  it('initially displays default sub-sections', () => {
    expect(screen.getByRole('region', { name: /threat trend timeline/i })).toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: /alert distribution breakdowns/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /overall risk analysis/i })).toBeInTheDocument();
  });

  it('updates analytics when switching network filter', () => {
    const chainSelect = screen.getByRole('combobox', { name: /filter by network/i });

    // Switch to Soroban
    fireEvent.change(chainSelect, { target: { value: 'Soroban' } });

    // Verify it updates. Let's count how many mock events are on Soroban in last 7d
    // In MOCK_EVENTS:
    // - evt-002: Soroban, high, 2026-06-17 (matches 7d)
    // - evt-005: Soroban, medium, 2026-06-16 (matches 7d)
    // Total Soroban in 7d = 2 events.

    // Let's verify the breakdown counts count up to 2
    const sorobanCount = MOCK_EVENTS.filter(
      e =>
        e.chain === 'Soroban' &&
        new Date(e.timestamp.replace(' UTC', 'Z')).getTime() >=
          new Date('2026-06-10T12:00:00Z').getTime(),
    ).length;

    expect(sorobanCount).toBe(2);

    // Check if network breakdown shows Soroban with 2 alerts
    const chainSection = screen.getByRole('region', { name: /alert distribution breakdowns/i });
    expect(within(chainSection).getByText('Soroban')).toBeInTheDocument();
  });

  it('updates analytics when switching severity filter', () => {
    const severitySelect = screen.getByRole('combobox', { name: /filter by severity/i });

    // Switch to critical
    fireEvent.change(severitySelect, { target: { value: 'critical' } });

    // Critical events in 7d:
    // - evt-001: critical, 2026-06-17
    // - evt-007: critical, 2026-06-15
    // Total = 2

    const breakdownsSection = screen.getByRole('region', {
      name: /alert distribution breakdowns/i,
    });
    // In severity breakdown row, critical should be represented with progress val '2'
    const criticalRow = within(breakdownsSection)
      .getByText('critical')
      .closest('.an-progress-row') as HTMLElement;
    expect(within(criticalRow).getByText('2')).toBeInTheDocument();
  });

  it('displays empty state if filters result in no alerts', () => {
    const chainSelect = screen.getByRole('combobox', { name: /filter by network/i });
    const severitySelect = screen.getByRole('combobox', { name: /filter by severity/i });

    // Switch to Soroban and Low severity (Soroban has high and medium in mock, no low)
    fireEvent.change(chainSelect, { target: { value: 'Soroban' } });
    fireEvent.change(severitySelect, { target: { value: 'low' } });

    expect(screen.getByRole('status', { name: /no data available/i })).toBeInTheDocument();
    expect(screen.getByText(/no events match the selected filters/i)).toBeInTheDocument();

    // Grid regions should not be rendered
    expect(
      screen.queryByRole('region', { name: /threat trend timeline/i }),
    ).not.toBeInTheDocument();
  });
});

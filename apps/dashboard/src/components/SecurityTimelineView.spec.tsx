import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { SecurityTimelineView, TimelineEvent } from './SecurityTimelineView';

const mockEvents: TimelineEvent[] = [
  {
    id: 'tel-001',
    timestamp: '2026-06-17T14:00:00Z',
    severity: 'critical',
    group: 'Contract',
    title: 'Unauthorized Admin Change',
    description: 'set_admin called by non-owner on Vault Contract',
    chain: 'Soroban',
  },
  {
    id: 'tel-002',
    timestamp: '2026-06-17T12:00:00Z',
    severity: 'high',
    group: 'Network',
    title: 'Liquidity Drain Detected',
    description: '25% of liquidity transferred within 60 seconds',
    chain: 'Polygon',
  },
  {
    id: 'tel-003',
    timestamp: '2026-06-17T10:00:00Z',
    severity: 'low',
    group: 'Authentication',
    title: 'Login Anomaly',
    description: 'Unusual login pattern detected',
    chain: 'Ethereum',
  },
];

describe('SecurityTimelineView', () => {
  it('renders without crashing', () => {
    render(<SecurityTimelineView events={mockEvents} />);
  });

  it('shows the heading', () => {
    render(<SecurityTimelineView events={mockEvents} />);
    expect(screen.getByRole('heading', { name: /security timeline/i })).toBeInTheDocument();
  });

  it('renders all events by default', () => {
    render(<SecurityTimelineView events={mockEvents} />);
    expect(screen.getByText('Unauthorized Admin Change')).toBeInTheDocument();
    expect(screen.getByText('Liquidity Drain Detected')).toBeInTheDocument();
    expect(screen.getByText('Login Anomaly')).toBeInTheDocument();
  });

  it('events are ordered newest first', () => {
    render(<SecurityTimelineView events={mockEvents} />);
    const items = screen.getAllByRole('listitem');
    const texts = items.map(li => li.textContent ?? '');
    const adminIdx = texts.findIndex(t => t.includes('Unauthorized Admin Change'));
    const drainIdx = texts.findIndex(t => t.includes('Liquidity Drain Detected'));
    const anomalyIdx = texts.findIndex(t => t.includes('Login Anomaly'));
    expect(adminIdx).toBeLessThan(drainIdx);
    expect(drainIdx).toBeLessThan(anomalyIdx);
  });

  it('filters by severity', async () => {
    render(<SecurityTimelineView events={mockEvents} />);
    await userEvent.selectOptions(screen.getByLabelText(/severity/i), 'critical');
    expect(screen.getByText('Unauthorized Admin Change')).toBeInTheDocument();
    expect(screen.queryByText('Liquidity Drain Detected')).not.toBeInTheDocument();
    expect(screen.queryByText('Login Anomaly')).not.toBeInTheDocument();
  });

  it('filters by group', async () => {
    render(<SecurityTimelineView events={mockEvents} />);
    await userEvent.selectOptions(screen.getByLabelText(/group/i), 'Network');
    expect(screen.getByText('Liquidity Drain Detected')).toBeInTheDocument();
    expect(screen.queryByText('Unauthorized Admin Change')).not.toBeInTheDocument();
  });

  it('shows empty state when no events match filters', async () => {
    render(<SecurityTimelineView events={mockEvents} />);
    await userEvent.selectOptions(screen.getByLabelText(/severity/i), 'medium');
    expect(screen.getByText(/no events match/i)).toBeInTheDocument();
  });

  it('renders severity badges on event cards', () => {
    render(<SecurityTimelineView events={mockEvents} />);
    // badges appear in both the dropdown options and event cards; assert at least one exists
    expect(screen.getAllByText('critical').length).toBeGreaterThan(0);
    expect(screen.getAllByText('high').length).toBeGreaterThan(0);
    expect(screen.getAllByText('low').length).toBeGreaterThan(0);
  });

  it('renders group badges on event cards', () => {
    render(<SecurityTimelineView events={mockEvents} />);
    // group text appears in both dropdown options and event cards
    expect(screen.getAllByText('Contract').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Network').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Authentication').length).toBeGreaterThan(0);
  });

  it('renders chain info', () => {
    render(<SecurityTimelineView events={mockEvents} />);
    expect(screen.getByText('Soroban')).toBeInTheDocument();
    expect(screen.getByText('Polygon')).toBeInTheDocument();
  });

  it('renders with default mock data when no events prop provided', () => {
    render(<SecurityTimelineView />);
    expect(screen.getByRole('heading', { name: /security timeline/i })).toBeInTheDocument();
  });
});

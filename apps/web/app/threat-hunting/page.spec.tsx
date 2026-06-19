import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThreatHuntingWorkspace } from './page';
import { MOCK_EVENTS } from './types';

describe('ThreatHuntingWorkspace', () => {
  beforeEach(() => {
    render(<ThreatHuntingWorkspace />);
  });

  const getNav = () => screen.getByRole('navigation');

  it('renders the workspace title', () => {
    expect(screen.getByRole('heading', { name: /threat hunting/i })).toBeInTheDocument();
  });

  it('renders all three tab navigation buttons', () => {
    const nav = getNav();
    expect(within(nav).getByRole('button', { name: /^search$/i })).toBeInTheDocument();
    expect(within(nav).getByRole('button', { name: /^events$/i })).toBeInTheDocument();
    expect(within(nav).getByRole('button', { name: /investigations/i })).toBeInTheDocument();
  });

  it('shows Search tab as active by default', () => {
    const searchTab = within(getNav()).getByRole('button', { name: /^search$/i });
    expect(searchTab.className).toContain('th-tab--active');
  });

  it('switches to Events tab on click', () => {
    fireEvent.click(screen.getByRole('button', { name: /^events$/i }));
    expect(screen.getByText(/event explorer/i)).toBeInTheDocument();
  });

  it('switches to Investigations tab on click', () => {
    fireEvent.click(screen.getByRole('button', { name: /investigations/i }));
    expect(screen.getByText(/no investigations yet/i)).toBeInTheDocument();
  });

  it('displays stats for each severity in Events tab', () => {
    fireEvent.click(screen.getByRole('button', { name: /^events$/i }));
    const criticalCount = MOCK_EVENTS.filter(e => e.severity === 'critical').length;
    const highCount = MOCK_EVENTS.filter(e => e.severity === 'high').length;
    const criticalLabel = screen
      .getAllByText('critical')
      .find(el => el.classList.contains('ee-stat-label'))!;
    const highLabel = screen
      .getAllByText('high')
      .find(el => el.classList.contains('ee-stat-label'))!;
    expect(within(criticalLabel.parentElement!).getByText(criticalCount)).toBeInTheDocument();
    expect(within(highLabel.parentElement!).getByText(highCount)).toBeInTheDocument();
  });

  it('shows all events in the explorer table', () => {
    fireEvent.click(screen.getByRole('button', { name: /^events$/i }));
    MOCK_EVENTS.forEach(event => {
      expect(screen.getByText(event.signature)).toBeInTheDocument();
    });
  });

  it('shows event detail when an event row is clicked', () => {
    fireEvent.click(screen.getByRole('button', { name: /^events$/i }));
    fireEvent.click(screen.getByText(MOCK_EVENTS[0].signature));
    expect(screen.getByText(/start investigation/i)).toBeInTheDocument();
    expect(screen.getByText(MOCK_EVENTS[0].transactionHash)).toBeInTheDocument();
  });
});

describe('ThreatHuntingWorkspace - Search', () => {
  it('has a search input and search button', () => {
    render(<ThreatHuntingWorkspace />);
    expect(screen.getByRole('textbox', { name: /search threats/i })).toBeInTheDocument();
    const searchButtons = screen.getAllByRole('button', { name: /^search$/i });
    expect(searchButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('shows ready state before searching', () => {
    render(<ThreatHuntingWorkspace />);
    expect(screen.getByText(/ready to search/i)).toBeInTheDocument();
  });
});

describe('ThreatHuntingWorkspace - Workspace', () => {
  it('shows subtitle describing the feature', () => {
    render(<ThreatHuntingWorkspace />);
    expect(screen.getByText(/proactively search for threats/i)).toBeInTheDocument();
  });
});

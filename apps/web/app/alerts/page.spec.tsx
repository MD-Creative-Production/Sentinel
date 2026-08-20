import { fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import AlertFeed from './page';
import { MOCK_ALERTS } from './types';
import { AlertDetails } from './[id]/page';

describe('AlertFeed', () => {
  it('renders alert rows with severity badges', () => {
    render(<AlertFeed />);

    expect(screen.getByRole('heading', { name: 'Alert Feed' })).toBeInTheDocument();
    const list = screen.getByRole('list', { name: 'Security alerts' });
    expect(list.children).toHaveLength(4);
    expect(within(list).getByText('critical')).toBeInTheDocument();
    expect(within(list).getAllByText('high')).toHaveLength(2);
  });

  it('paginates through the alert listing', () => {
    render(<AlertFeed />);

    const next = screen.getByRole('button', { name: 'Next' });
    fireEvent.click(next);

    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
    expect(screen.getByText(MOCK_ALERTS[4].title)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('filters by severity and resets to the first page', () => {
    render(<AlertFeed />);
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.change(screen.getByLabelText('Severity'), { target: { value: 'critical' } });

    const list = screen.getByRole('list', { name: 'Security alerts' });
    expect(list.children).toHaveLength(1);
    expect(within(list).getByText(MOCK_ALERTS[0].title)).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 1')).toBeInTheDocument();
  });
});

describe('AlertDetails', () => {
  it('renders metadata, explanation, related events, and risk score', () => {
    render(<AlertDetails alert={MOCK_ALERTS[0]} />);

    expect(screen.getByRole('heading', { name: MOCK_ALERTS[0].title })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Detection explanation' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Alert metadata' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Related events' })).toBeInTheDocument();
    expect(screen.getByText('95')).toBeInTheDocument();
    expect(screen.getByText(MOCK_ALERTS[0].events[0].description)).toBeInTheDocument();
  });

  it('renders a not-found state for an unknown alert', () => {
    render(<AlertDetails />);

    expect(screen.getByRole('heading', { name: 'Alert not found' })).toBeInTheDocument();
  });
});

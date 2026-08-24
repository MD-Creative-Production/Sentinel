import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { WatchlistCreationModal } from './WatchlistCreationModal';

describe('WatchlistCreationModal', () => {
  it('requires a name and at least one target', () => {
    const onCreate = jest.fn();
    render(<WatchlistCreationModal onClose={jest.fn()} onCreate={onCreate} />);

    fireEvent.click(screen.getByRole('button', { name: /create watchlist/i }));

    expect(screen.getByText('Enter a name for this watchlist.')).toBeTruthy();
    expect(screen.getByText('Add a wallet address, contract address, or both.')).toBeTruthy();
    expect(onCreate).not.toHaveBeenCalled();
  });

  it('submits trimmed values and closes after creation succeeds', async () => {
    const onCreate = jest.fn().mockResolvedValue(undefined);
    const onClose = jest.fn();
    render(<WatchlistCreationModal onClose={onClose} onCreate={onCreate} />);

    fireEvent.change(screen.getByLabelText('Watchlist name'), {
      target: { value: '  Treasury  ' },
    });
    fireEvent.change(screen.getByLabelText(/wallet address/i), {
      target: { value: '  GABC123  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create watchlist/i }));

    await waitFor(() =>
      expect(onCreate).toHaveBeenCalledWith({
        label: 'Treasury',
        walletAddress: 'GABC123',
        contractAddress: undefined,
      }),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps the dialog open and reports a submission error', async () => {
    const onCreate = jest.fn().mockRejectedValue(new Error('Address could not be saved.'));
    const onClose = jest.fn();
    render(<WatchlistCreationModal onClose={onClose} onCreate={onCreate} />);

    fireEvent.change(screen.getByLabelText('Watchlist name'), { target: { value: 'Treasury' } });
    fireEvent.change(screen.getByLabelText(/contract address/i), {
      target: { value: 'contract-1' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create watchlist/i }));

    expect((await screen.findByRole('alert')).textContent).toContain('Address could not be saved.');
    expect(onClose).not.toHaveBeenCalled();
  });
});

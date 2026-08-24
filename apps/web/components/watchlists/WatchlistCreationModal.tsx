'use client';

import { useState } from 'react';
import './watchlists.css';

export interface WatchlistCreationPayload {
  label: string;
  walletAddress?: string;
  contractAddress?: string;
}

interface WatchlistCreationModalProps {
  onClose: () => void;
  onCreate: (payload: WatchlistCreationPayload) => Promise<void> | void;
}

type FormErrors = Partial<Record<keyof WatchlistCreationPayload | 'targets', string>>;

const MAX_LABEL_LENGTH = 100;
const MAX_ADDRESS_LENGTH = 256;

export function WatchlistCreationModal({ onClose, onCreate }: WatchlistCreationModalProps) {
  const [label, setLabel] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [contractAddress, setContractAddress] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): FormErrors => {
    const nextErrors: FormErrors = {};
    const trimmedLabel = label.trim();
    const trimmedWallet = walletAddress.trim();
    const trimmedContract = contractAddress.trim();

    if (!trimmedLabel) nextErrors.label = 'Enter a name for this watchlist.';
    else if (trimmedLabel.length > MAX_LABEL_LENGTH) {
      nextErrors.label = `Name must be ${MAX_LABEL_LENGTH} characters or fewer.`;
    }

    if (!trimmedWallet && !trimmedContract) {
      nextErrors.targets = 'Add a wallet address, contract address, or both.';
    }
    if (trimmedWallet.length > MAX_ADDRESS_LENGTH) {
      nextErrors.walletAddress = 'Wallet address is too long.';
    }
    if (trimmedContract.length > MAX_ADDRESS_LENGTH) {
      nextErrors.contractAddress = 'Contract address is too long.';
    }
    if (trimmedWallet && trimmedContract && trimmedWallet === trimmedContract) {
      nextErrors.targets = 'Wallet and contract addresses must be different.';
    }

    return nextErrors;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError('');

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      await onCreate({
        label: label.trim(),
        walletAddress: walletAddress.trim() || undefined,
        contractAddress: contractAddress.trim() || undefined,
      });
      onClose();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to create watchlist.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="watchlist-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="watchlist-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="watchlist-modal-title"
        onMouseDown={event => event.stopPropagation()}
      >
        <header className="watchlist-modal-header">
          <div>
            <p className="watchlist-modal-eyebrow">Monitoring</p>
            <h2 id="watchlist-modal-title">Create watchlist</h2>
            <p>Choose the addresses Sentinel should keep an eye on.</p>
          </div>
          <button
            type="button"
            className="watchlist-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <form onSubmit={handleSubmit} noValidate>
          <div className="watchlist-field">
            <label htmlFor="watchlist-label">Watchlist name</label>
            <input
              id="watchlist-label"
              value={label}
              onChange={event => setLabel(event.target.value)}
              aria-invalid={Boolean(errors.label)}
              aria-describedby={errors.label ? 'watchlist-label-error' : undefined}
              placeholder="e.g. Treasury movement"
              maxLength={MAX_LABEL_LENGTH}
              disabled={isSubmitting}
            />
            {errors.label && (
              <p id="watchlist-label-error" className="watchlist-error">
                {errors.label}
              </p>
            )}
          </div>

          <div className="watchlist-field">
            <label htmlFor="watchlist-wallet">
              Wallet address <span>(optional)</span>
            </label>
            <input
              id="watchlist-wallet"
              value={walletAddress}
              onChange={event => setWalletAddress(event.target.value)}
              aria-invalid={Boolean(errors.walletAddress || errors.targets)}
              aria-describedby={errors.walletAddress ? 'watchlist-wallet-error' : undefined}
              placeholder="Paste a wallet address"
              maxLength={MAX_ADDRESS_LENGTH}
              disabled={isSubmitting}
            />
            {errors.walletAddress && (
              <p id="watchlist-wallet-error" className="watchlist-error">
                {errors.walletAddress}
              </p>
            )}
          </div>

          <div className="watchlist-field">
            <label htmlFor="watchlist-contract">
              Contract address <span>(optional)</span>
            </label>
            <input
              id="watchlist-contract"
              value={contractAddress}
              onChange={event => setContractAddress(event.target.value)}
              aria-invalid={Boolean(errors.contractAddress || errors.targets)}
              aria-describedby={errors.contractAddress ? 'watchlist-contract-error' : undefined}
              placeholder="Paste a contract address"
              maxLength={MAX_ADDRESS_LENGTH}
              disabled={isSubmitting}
            />
            {errors.contractAddress && (
              <p id="watchlist-contract-error" className="watchlist-error">
                {errors.contractAddress}
              </p>
            )}
          </div>

          {errors.targets && (
            <p className="watchlist-error" role="alert">
              {errors.targets}
            </p>
          )}
          {submitError && (
            <p className="watchlist-error" role="alert">
              {submitError}
            </p>
          )}

          <footer className="watchlist-modal-actions">
            <button type="button" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create watchlist'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

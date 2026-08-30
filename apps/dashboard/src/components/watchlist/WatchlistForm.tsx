'use client';

import { useState } from 'react';

interface WatchlistFormProps {
  onSubmit: (entry: { name: string; network: string; address: string; tags: string[] }) => Promise<void>;
  onClose: () => void;
}

const NETWORKS = ['ethereum', 'stellar', 'testnet'];

export function WatchlistForm({ onSubmit, onClose }: WatchlistFormProps) {
  const [name, setName] = useState('');
  const [network, setNetwork] = useState('ethereum');
  const [address, setAddress] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) {
      setError('Name and address are required');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
      await onSubmit({ name: name.trim(), network, address: address.trim(), tags });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add entry');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" role="dialog" aria-modal="true" aria-label="Add watchlist entry">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Add to Watchlist</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" aria-label="Close">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg text-sm text-red-700 dark:text-red-400">{error}</div>
          )}

          <div>
            <label htmlFor="wl-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
            <input id="wl-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-sentinel-500"
              placeholder="Treasury Vault" />
          </div>

          <div>
            <label htmlFor="wl-network" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Network</label>
            <select id="wl-network" value={network} onChange={(e) => setNetwork(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-sentinel-500">
              {NETWORKS.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="wl-address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
            <input id="wl-address" type="text" value={address} onChange={(e) => setAddress(e.target.value)} required
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sentinel-500"
              placeholder="0x1234...abcd" />
          </div>

          <div>
            <label htmlFor="wl-tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags (comma-separated)</label>
            <input id="wl-tags" type="text" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-sentinel-500"
              placeholder="treasury, high-value" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">Cancel</button>
            <button type="submit" disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-sentinel-600 hover:bg-sentinel-700 rounded-lg transition-colors disabled:opacity-50">
              {submitting ? 'Adding...' : 'Add Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

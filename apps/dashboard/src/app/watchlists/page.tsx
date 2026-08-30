'use client';

import { useState } from 'react';
import { useWatchlists } from '@/hooks/useWatchlists';
import { WatchlistTable } from '@/components/watchlist/WatchlistTable';
import { WatchlistForm } from '@/components/watchlist/WatchlistForm';

export default function WatchlistsPage() {
  const { entries, loading, error, addEntry, removeEntry, toggleEntry, refetch } = useWatchlists();
  const [showForm, setShowForm] = useState(false);

  const handleRemove = async (id: string) => {
    if (!confirm('Remove this entry from the watchlist?')) return;
    await removeEntry(id);
    refetch();
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    await toggleEntry(id, enabled);
    refetch();
  };

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Watchlists</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Monitor contracts and addresses across networks
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-sentinel-600 hover:bg-sentinel-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Entry
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-400 rounded-lg mb-6">
          {error}
        </div>
      )}

      <WatchlistTable
        entries={entries}
        loading={loading}
        onToggle={handleToggle}
        onRemove={handleRemove}
      />

      {showForm && <WatchlistForm onSubmit={addEntry} onClose={() => setShowForm(false)} />}
    </div>
  );
}

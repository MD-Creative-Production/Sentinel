'use client';

import type { WatchlistEntry } from '@/hooks/useWatchlists';

interface WatchlistTableProps {
  entries: WatchlistEntry[];
  loading: boolean;
  onToggle: (id: string, enabled: boolean) => void;
  onRemove: (id: string) => void;
}

const networkColors: Record<string, string> = {
  ethereum: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  stellar: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400',
  testnet: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400',
};

export function WatchlistTable({ entries, loading, onToggle, onRemove }: WatchlistTableProps) {
  if (loading) {
    return (
      <div className="sentinel-card">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-200 dark:bg-gray-800 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="sentinel-card text-center py-12">
        <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <p className="text-gray-500 dark:text-gray-400">No watchlist entries yet</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Add a contract or address to start monitoring</p>
      </div>
    );
  }

  return (
    <div className="sentinel-card overflow-hidden p-0">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-800">
            <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">Name</th>
            <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">Network</th>
            <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">Address</th>
            <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">Tags</th>
            <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">Status</th>
            <th className="text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
          {entries.map((entry) => (
            <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <td className="px-6 py-4">
                <span className="font-medium text-gray-900 dark:text-gray-100">{entry.name}</span>
              </td>
              <td className="px-6 py-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${networkColors[entry.network] ?? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
                  {entry.network}
                </span>
              </td>
              <td className="px-6 py-4">
                <code className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                  {entry.address.length > 20 ? `${entry.address.slice(0, 10)}...${entry.address.slice(-8)}` : entry.address}
                </code>
              </td>
              <td className="px-6 py-4">
                <div className="flex gap-1 flex-wrap">
                  {entry.tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                      {tag}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-6 py-4">
                <button
                  type="button"
                  onClick={() => onToggle(entry.id, !entry.enabled)}
                  className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-sentinel-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${entry.enabled ? 'bg-sentinel-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                  aria-label={`${entry.enabled ? 'Disable' : 'Enable'} ${entry.name}`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${entry.enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </td>
              <td className="px-6 py-4 text-right">
                <button
                  type="button"
                  onClick={() => onRemove(entry.id)}
                  className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors"
                  aria-label={`Remove ${entry.name}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

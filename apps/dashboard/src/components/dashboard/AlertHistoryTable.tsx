'use client';

import { useState } from 'react';

// Type definitions
export type SeverityLevel = 'high' | 'medium' | 'low';

export interface WatchdogEvent {
  id: string;
  timestamp: string;
  chain: string;
  severity: SeverityLevel;
  description: string;
}

const severityStyles: Record<SeverityLevel, string> = {
  high: 'bg-orange-950 text-orange-400 border border-orange-800',
  medium: 'bg-yellow-950 text-yellow-400 border border-yellow-800',
  low: 'bg-blue-950 text-blue-400 border border-blue-800',
};

// Mock data — replaced by API data in production
const mockEvents: WatchdogEvent[] = [
  {
    id: 'evt-001',
    timestamp: '2026-06-11 14:32:01 UTC',
    chain: 'Soroban',
    severity: 'high',
    description: 'Unauthorized set_admin call detected on Vault Contract',
  },
  {
    id: 'evt-002',
    timestamp: '2026-06-11 12:15:45 UTC',
    chain: 'Ethereum',
    severity: 'medium',
    description: 'Emergency Pause triggered by multisig address',
  },
  {
    id: 'evt-003',
    timestamp: '2026-06-10 09:05:12 UTC',
    chain: 'Soroban',
    severity: 'low',
    description: 'New verified contract deployment matching signature',
  },
  {
    id: 'evt-004',
    timestamp: '2026-06-09 18:22:30 UTC',
    chain: 'Polygon',
    severity: 'high',
    description: 'Sudden large-scale transfer (25% liquidity drain)',
  },
  {
    id: 'evt-005',
    timestamp: '2026-06-09 08:11:05 UTC',
    chain: 'Ethereum',
    severity: 'medium',
    description: 'Unusual high-frequency minting behavior',
  },
];

interface Props {
  events?: WatchdogEvent[];
}

export function AlertHistoryTable({ events = mockEvents }: Props) {
  const [filterChain, setFilterChain] = useState<string>('All');

  const uniqueChains = ['All', ...Array.from(new Set(events.map(e => e.chain)))];

  const filtered = filterChain === 'All' ? events : events.filter(e => e.chain === filterChain);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          Alert History
        </h2>

        <div className="flex items-center gap-2">
          <label htmlFor="chain-filter" className="text-sm text-gray-400 sr-only">
            Filter by Chain
          </label>
          <select
            id="chain-filter"
            className="bg-gray-800 border border-gray-700 text-sm text-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-sentinel-600"
            value={filterChain}
            onChange={e => setFilterChain(e.target.value)}
          >
            {uniqueChains.map(chain => (
              <option key={chain} value={chain}>
                {chain}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Timestamp
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Chain
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Severity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {filtered.length > 0 ? (
              filtered.map(event => (
                <tr key={event.id} className="hover:bg-gray-800/40 transition-colors">
                  <td className="px-6 py-4 text-gray-400 font-mono text-xs whitespace-nowrap">
                    {event.timestamp}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700">
                      {event.chain}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${severityStyles[event.severity]}`}
                    >
                      {event.severity}
                    </span>
                  </td>
                  <td
                    className="px-6 py-4 text-gray-300 max-w-sm truncate"
                    title={event.description}
                  >
                    {event.description}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                  No alerts found for the selected chain.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AlertHistoryTable;

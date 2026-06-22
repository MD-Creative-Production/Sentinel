'use client';

import { usePathname } from 'next/navigation';

const pageTitles: Record<string, string> = {
  '/': 'Overview',
  '/alerts': 'Alerts',
  '/contracts': 'Contracts',
  '/reports': 'Reports',
  '/settings': 'Settings',
};

export function TopBar() {
  const pathname = usePathname();
  const title = pageTitles[pathname] ?? 'Dashboard';

  return (
    <header className="h-16 flex-shrink-0 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6">
      {/* Breadcrumb / page title */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>Sentinel</span>
        <svg
          className="w-4 h-4 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-200 font-medium">{title}</span>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {/* Live indicator */}
        <div
          className="flex items-center gap-1.5 text-xs text-emerald-400"
          role="status"
          aria-label="System status: live"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          Live
        </div>

        {/* Notification bell */}
        <button
          type="button"
          className="relative p-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-gray-100 transition-colors"
          aria-label="View notifications"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          {/* Badge */}
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-gray-900"
            aria-hidden="true"
          />
        </button>

        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-full bg-sentinel-700 flex items-center justify-center text-xs font-semibold text-sentinel-200"
          aria-label="User menu"
          role="img"
        >
          SN
        </div>
      </div>
    </header>
  );
}

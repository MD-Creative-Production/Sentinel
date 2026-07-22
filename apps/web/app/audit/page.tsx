'use client';

import { useState } from 'react';
import { DEFAULT_AUDIT_FILTERS } from './types';
import { AuditSearchBar } from '../components/AuditSearchBar';
import { useAuditLogs } from '../hooks/useAuditLogs';
import { AuditFilters } from '../components/AuditFilters';
import { AuditEmptyState } from '../components/AuditEmptyState';
import { AuditTimeline } from '../components/AuditTimeline';

export default function AuditPage() {
  const [filters, setFilters] = useState(DEFAULT_AUDIT_FILTERS);
  const { items, isLoading, error, page, setPage, hasMore, total } = useAuditLogs(filters);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
      <header>
        <h1 className="text-xl font-semibold text-neutral-100">Audit Log</h1>
        <p className="text-sm text-neutral-500">
          Platform actions across your organization — {total} total events.
        </p>
      </header>

      <AuditSearchBar
        value={filters.query}
        onChange={query => setFilters(f => ({ ...f, query }))}
      />

      <div className="grid grid-cols-[280px_1fr] gap-6">
        <AuditFilters filters={filters} onChange={setFilters} />

        <div className="flex flex-col gap-4">
          {isLoading && <AuditEmptyState state="loading" />}
          {!isLoading && error && <AuditEmptyState state="error" />}
          {!isLoading && !error && items.length === 0 && <AuditEmptyState state="empty" />}
          {!isLoading && !error && items.length > 0 && <AuditTimeline entries={items} />}

          {!isLoading && !error && items.length > 0 && (
            <div className="flex justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="rounded-md border border-neutral-700 px-3 py-1 text-sm text-neutral-300 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage(page + 1)}
                disabled={!hasMore}
                className="rounded-md border border-neutral-700 px-3 py-1 text-sm text-neutral-300 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

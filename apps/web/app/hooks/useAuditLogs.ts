'use client';

import { useEffect, useRef, useState } from 'react';
import { AuditFilterState, AuditLogEntry } from '../audit/types';
import { fetchAuditLogs } from '../../lib/api/audit-api';

const PAGE_SIZE = 25;

export function useAuditLogs(filters: AuditFilterState) {
  const [items, setItems] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setPage(1);
  }, [filters.query, filters.categories, filters.severities, filters.dateFrom, filters.dateTo]);

  useEffect(() => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    // debounce search-driven refetches; filter toggles fire immediately via key change below
    const handle = setTimeout(async () => {
      try {
        const res = await fetchAuditLogs({
          filters,
          page,
          pageSize: PAGE_SIZE,
          signal: controller.signal,
        });
        setItems(res.items);
        setTotal(res.total);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setError('Could not load audit logs. Try again.');
        }
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(handle);
      controller.abort();
    };
  }, [filters, page]);

  return {
    items,
    total,
    page,
    pageSize: PAGE_SIZE,
    isLoading,
    error,
    setPage,
    hasMore: page * PAGE_SIZE < total,
  };
}

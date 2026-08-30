'use client';

import { useState, useEffect, useCallback } from 'react';

export interface WatchlistEntry {
  id: string;
  name: string;
  network: string;
  address: string;
  tags: string[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface WatchlistMeta {
  total: number;
  page: number;
  limit: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';

export function useWatchlists() {
  const [entries, setEntries] = useState<WatchlistEntry[]>([]);
  const [meta, setMeta] = useState<WatchlistMeta>({ total: 0, page: 1, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = useCallback(async (page = 1, limit = 20) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/v1/watchlists?page=${page}&limit=${limit}`);
      if (!res.ok) throw new Error(`Failed to fetch watchlists: ${res.status}`);
      const data = await res.json();
      setEntries(data.data ?? []);
      setMeta(data.meta ?? { total: 0, page, limit });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const addEntry = useCallback(
    async (entry: { name: string; network: string; address: string; tags: string[] }) => {
      const res = await fetch(`${API_BASE}/v1/watchlists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Failed to add entry: ${res.status}`);
      }
      return res.json();
    },
    [],
  );

  const removeEntry = useCallback(async (id: string) => {
    const res = await fetch(`${API_BASE}/v1/watchlists/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`Failed to remove entry: ${res.status}`);
  }, []);

  const toggleEntry = useCallback(async (id: string, enabled: boolean) => {
    const res = await fetch(`${API_BASE}/v1/watchlists/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    });
    if (!res.ok) throw new Error(`Failed to update entry: ${res.status}`);
    return res.json();
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  return {
    entries,
    meta,
    loading,
    error,
    addEntry,
    removeEntry,
    toggleEntry,
    refetch: fetchEntries,
  };
}

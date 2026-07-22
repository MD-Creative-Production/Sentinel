export function AuditEmptyState({ state }: { state: 'loading' | 'error' | 'empty' }) {
  const copy = {
    loading: 'Loading audit activity…',
    error: 'Could not load audit logs. Try again.',
    empty: 'No audit activity matches your filters.',
  }[state];

  return (
    <div className="flex items-center justify-center rounded-md border border-dashed border-neutral-800 py-12 text-sm text-neutral-500">
      {copy}
    </div>
  );
}

'use client';

interface AuditSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function AuditSearchBar({ value, onChange }: AuditSearchBarProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder="Search by action, actor, or target…"
      aria-label="Search audit logs"
      className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-neutral-500 focus:outline-none"
    />
  );
}

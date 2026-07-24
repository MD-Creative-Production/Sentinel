'use client';

import type { AuditActionCategory, AuditFilterState, AuditSeverity } from '../audit/types';

const CATEGORIES: AuditActionCategory[] = [
  'auth',
  'organization',
  'member',
  'security',
  'treasury',
  'policy',
  'system',
];
const SEVERITIES: AuditSeverity[] = ['info', 'warning', 'critical'];

interface AuditFiltersProps {
  filters: AuditFilterState;
  onChange: (filters: AuditFilterState) => void;
}

export function AuditFilters({ filters, onChange }: AuditFiltersProps) {
  function toggle<T extends string>(list: T[], value: T): T[] {
    return list.includes(value) ? list.filter(v => v !== value) : [...list, value];
  }

  return (
    <div className="flex flex-col gap-4 rounded-md border border-neutral-800 p-4">
      <fieldset>
        <legend className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
          Category
        </legend>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(category => {
            const active = filters.categories.includes(category);
            return (
              <button
                key={category}
                type="button"
                onClick={() =>
                  onChange({ ...filters, categories: toggle(filters.categories, category) })
                }
                aria-pressed={active}
                className={`rounded-full border px-3 py-1 text-xs capitalize transition ${active ? 'border-orange-500 bg-orange-500/10 text-orange-300' : 'border-neutral-700 text-neutral-400 hover:border-neutral-500'}`}
              >
                {category}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
          Severity
        </legend>
        <div className="flex flex-wrap gap-2">
          {SEVERITIES.map(severity => {
            const active = filters.severities.includes(severity);
            return (
              <button
                key={severity}
                type="button"
                onClick={() =>
                  onChange({ ...filters, severities: toggle(filters.severities, severity) })
                }
                aria-pressed={active}
                className={`rounded-full border px-3 py-1 text-xs capitalize transition ${active ? 'border-orange-500 bg-orange-500/10 text-orange-300' : 'border-neutral-700 text-neutral-400 hover:border-neutral-500'}`}
              >
                {severity}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="flex gap-3">
        <label className="flex flex-1 flex-col text-xs text-neutral-400">
          From
          <input
            type="date"
            value={filters.dateFrom ?? ''}
            onChange={e => onChange({ ...filters, dateFrom: e.target.value || undefined })}
            className="mt-1 rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm text-neutral-100"
          />
        </label>
        <label className="flex flex-1 flex-col text-xs text-neutral-400">
          To
          <input
            type="date"
            value={filters.dateTo ?? ''}
            onChange={e => onChange({ ...filters, dateTo: e.target.value || undefined })}
            className="mt-1 rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm text-neutral-100"
          />
        </label>
      </div>
    </div>
  );
}

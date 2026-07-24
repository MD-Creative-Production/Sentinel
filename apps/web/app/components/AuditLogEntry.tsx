'use client';

import { useState } from 'react';
import type { AuditLogEntry as AuditLogEntryType } from '../audit/types';

const SEVERITY_STYLES: Record<AuditLogEntryType['severity'], string> = {
  info: 'bg-neutral-700 text-neutral-200',
  warning: 'bg-yellow-500/15 text-yellow-300',
  critical: 'bg-red-500/15 text-red-300',
};

export function AuditLogEntry({ entry }: { entry: AuditLogEntryType }) {
  const [expanded, setExpanded] = useState(false);
  const hasMetadata = entry.metadata && Object.keys(entry.metadata).length > 0;

  return (
    <li className="rounded-md border border-neutral-800 bg-neutral-900/50 p-3">
      <button
        type="button"
        onClick={() => hasMetadata && setExpanded(v => !v)}
        className="flex w-full items-start justify-between gap-3 text-left"
      >
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span
              className={`rounded px-2 py-0.5 text-[10px] font-medium uppercase ${SEVERITY_STYLES[entry.severity]}`}
            >
              {entry.severity}
            </span>
            <span className="text-sm font-medium text-neutral-100">{entry.action}</span>
          </div>
          <p className="text-sm text-neutral-400">{entry.description}</p>
          <p className="text-xs text-neutral-500">
            {entry.actor.name} ({entry.actor.email}){entry.target ? ` → ${entry.target}` : ''}
          </p>
        </div>
        <time className="shrink-0 text-xs text-neutral-500" dateTime={entry.createdAt}>
          {new Date(entry.createdAt).toLocaleString()}
        </time>
      </button>

      {expanded && hasMetadata && (
        <pre className="mt-3 overflow-x-auto rounded bg-black/40 p-3 text-xs text-neutral-400">
          {JSON.stringify(entry.metadata, null, 2)}
        </pre>
      )}
    </li>
  );
}

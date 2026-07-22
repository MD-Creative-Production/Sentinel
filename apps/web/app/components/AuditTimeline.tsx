'use client';

import type { AuditLogEntry as AuditLogEntryType } from '../audit/types';
import { AuditLogEntry } from './AuditLogEntry';

function groupByDay(entries: AuditLogEntryType[]) {
  return entries.reduce<Record<string, AuditLogEntryType[]>>((acc, entry) => {
    const day = new Date(entry.createdAt).toDateString();
    acc[day] = acc[day] ?? [];
    acc[day].push(entry);
    return acc;
  }, {});
}

export function AuditTimeline({ entries }: { entries: AuditLogEntryType[] }) {
  const grouped = groupByDay(entries);

  return (
    <div className="flex flex-col gap-6">
      {Object.entries(grouped).map(([day, dayEntries]) => (
        <section key={day}>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
            {day}
          </h3>
          <ul className="flex flex-col gap-2">
            {dayEntries.map(entry => (
              <AuditLogEntry key={entry.id} entry={entry} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

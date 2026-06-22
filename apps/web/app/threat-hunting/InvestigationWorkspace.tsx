import React, { useState } from 'react';
import { Investigation, ThreatEvent } from './types';
import './InvestigationWorkspace.css';

interface Props {
  investigations: Investigation[];
  events: ThreatEvent[];
  onAddNote: (investigationId: string, content: string) => void;
  onCloseInvestigation: (investigationId: string) => void;
}

export const InvestigationWorkspace: React.FC<Props> = ({
  investigations,
  events,
  onAddNote,
  onCloseInvestigation,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const getEventById = (eventId: string): ThreatEvent | undefined => {
    return events.find(e => e.id === eventId);
  };

  const handleAddNote = (investigationId: string) => {
    const content = noteInputs[investigationId]?.trim();
    if (!content) return;
    onAddNote(investigationId, content);
    setNoteInputs(prev => ({ ...prev, [investigationId]: '' }));
  };

  const handleNoteKeyDown = (e: React.KeyboardEvent, investigationId: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddNote(investigationId);
    }
  };

  if (investigations.length === 0) {
    return (
      <div className="iw-container">
        <div className="iw-empty">
          <div className="iw-empty-icon">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <p className="iw-empty-text">No investigations yet</p>
          <p className="iw-empty-hint">
            Select an event and start an investigation to begin tracking threats
          </p>
        </div>
      </div>
    );
  }

  const sorted = [...investigations].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  return (
    <div className="iw-container">
      <h2 className="iw-header-text">Investigation Workspace</h2>
      <p className="iw-header-desc">
        Track and manage your security investigations ({investigations.length} total)
      </p>

      <div className="iw-list">
        {sorted.map(inv => {
          const isExpanded = expandedId === inv.id;
          return (
            <div key={inv.id} className="iw-item">
              <div
                className="iw-item-header"
                onClick={() => toggleExpand(inv.id)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && toggleExpand(inv.id)}
              >
                <div>
                  <h3 className="iw-item-title">{inv.title}</h3>
                  <div className="iw-item-meta">
                    Created {new Date(inv.createdAt).toLocaleString()} &middot; {inv.notes.length}{' '}
                    note{inv.notes.length !== 1 ? 's' : ''}
                  </div>
                </div>
                <div className="iw-item-badges">
                  <span className={`iw-item-badge iw-item-badge--${inv.status}`}>{inv.status}</span>
                  <span className={`iw-item-chevron ${isExpanded ? 'iw-item-chevron--open' : ''}`}>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </span>
                </div>
              </div>

              {isExpanded && (
                <div className="iw-item-body">
                  <div>
                    <span className="iw-notes-title">Related Events</span>
                    <div className="iw-events-list">
                      {inv.eventIds.map(eventId => {
                        const evt = getEventById(eventId);
                        return (
                          <span key={eventId} className="iw-event-ref" title={evt?.description}>
                            {evt ? `${evt.signature} (${evt.chain})` : eventId}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <div className="iw-notes-section">
                    <span className="iw-notes-title">Investigation Notes</span>
                    {inv.notes.map(note => (
                      <div key={note.id} className="iw-note">
                        <div className="iw-note-header">
                          <span className="iw-note-author">{note.author}</span>
                          <span className="iw-note-time">
                            {new Date(note.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="iw-note-content">{note.content}</p>
                      </div>
                    ))}
                    {inv.notes.length === 0 && (
                      <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0 }}>
                        No notes yet. Add your first observation below.
                      </p>
                    )}
                  </div>

                  <div className="iw-add-note">
                    <textarea
                      className="iw-note-input"
                      placeholder="Add an investigation note..."
                      value={noteInputs[inv.id] ?? ''}
                      onChange={e => setNoteInputs(prev => ({ ...prev, [inv.id]: e.target.value }))}
                      onKeyDown={e => handleNoteKeyDown(e, inv.id)}
                      rows={2}
                    />
                    <button
                      className="iw-note-btn"
                      disabled={!noteInputs[inv.id]?.trim()}
                      onClick={() => handleAddNote(inv.id)}
                    >
                      Add Note
                    </button>
                  </div>

                  {inv.status === 'open' && (
                    <div>
                      <button className="iw-close-btn" onClick={() => onCloseInvestigation(inv.id)}>
                        Close Investigation
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

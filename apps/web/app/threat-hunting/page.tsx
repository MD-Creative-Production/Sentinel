import React, { useState } from 'react';
import { ThreatHuntingSearch } from './ThreatHuntingSearch';
import { EventExplorer } from './EventExplorer';
import { InvestigationWorkspace } from './InvestigationWorkspace';
import { ThreatEvent, Investigation, MOCK_EVENTS } from './types';
import './threat-hunting.css';

type Tab = 'search' | 'events' | 'investigations';

export const ThreatHuntingWorkspace: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('search');
  const [events] = useState<ThreatEvent[]>(MOCK_EVENTS);
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<ThreatEvent | null>(null);

  const handleInvestigate = (
    event: ThreatEvent | Pick<ThreatEvent, 'id' | 'signature' | 'chain'>,
  ) => {
    const newInvestigation: Investigation = {
      id: `inv-${Date.now()}`,
      title: `Investigation: ${event.signature} on ${event.chain}`,
      eventIds: [event.id],
      notes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'open',
    };
    setInvestigations(prev => [newInvestigation, ...prev]);
    if ('timestamp' in event) {
      setSelectedEvent(event);
    }
    setActiveTab('investigations');
  };

  const handleAddNote = (investigationId: string, content: string) => {
    setInvestigations(prev =>
      prev.map(inv =>
        inv.id === investigationId
          ? {
              ...inv,
              notes: [
                ...inv.notes,
                {
                  id: `note-${Date.now()}`,
                  content,
                  author: 'Analyst',
                  createdAt: new Date().toISOString(),
                },
              ],
              updatedAt: new Date().toISOString(),
            }
          : inv,
      ),
    );
  };

  const handleCloseInvestigation = (investigationId: string) => {
    setInvestigations(prev =>
      prev.map(inv =>
        inv.id === investigationId
          ? { ...inv, status: 'closed' as const, updatedAt: new Date().toISOString() }
          : inv,
      ),
    );
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'search', label: 'Search' },
    { key: 'events', label: 'Events' },
    { key: 'investigations', label: `Investigations (${investigations.length})` },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'search':
        return <ThreatHuntingSearch onInvestigate={handleInvestigate} />;
      case 'events':
        return (
          <EventExplorer
            events={events}
            onInvestigate={handleInvestigate}
            selectedEvent={selectedEvent}
            onSelectEvent={setSelectedEvent}
          />
        );
      case 'investigations':
        return (
          <InvestigationWorkspace
            investigations={investigations}
            events={events}
            onAddNote={handleAddNote}
            onCloseInvestigation={handleCloseInvestigation}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="th-container">
      <header className="th-header">
        <div className="th-header-left">
          <h1 className="th-title">Threat Hunting</h1>
          <p className="th-subtitle">
            Proactively search for threats, explore security events, and manage investigations
          </p>
        </div>
        <nav className="th-tabs">
          {tabs.map(tab => (
            <button
              key={tab.key}
              className={`th-tab ${activeTab === tab.key ? 'th-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>
      <div className="th-content">{renderContent()}</div>
    </div>
  );
};

export default ThreatHuntingWorkspace;

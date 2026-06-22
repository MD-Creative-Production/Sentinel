import React, { useState, useMemo } from 'react';
import { ThreatEvent, SearchResult, MOCK_SEARCH_RESULTS } from './types';
import './ThreatHuntingSearch.css';

interface Props {
  onInvestigate: (event: Pick<ThreatEvent, 'id' | 'signature' | 'chain'>) => void;
}

const SEVERITY_FILTERS = ['all', 'critical', 'high', 'medium', 'low'] as const;
const CHAIN_FILTERS = ['all', 'Ethereum', 'Soroban', 'Polygon'] as const;

export const ThreatHuntingSearch: React.FC<Props> = ({ onInvestigate }) => {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [chainFilter, setChainFilter] = useState<string>('all');
  const [hasSearched, setHasSearched] = useState(false);

  const filteredResults = useMemo(() => {
    if (!hasSearched) return [];

    let results = [...MOCK_SEARCH_RESULTS];

    if (query.trim()) {
      const q = query.toLowerCase();
      results = results.filter(
        r =>
          r.label.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.chain.toLowerCase().includes(q) ||
          r.type.toLowerCase().includes(q),
      );
    }

    if (typeFilter !== 'all') {
      results = results.filter(r => r.type === typeFilter);
    }

    return results;
  }, [query, typeFilter, hasSearched]);

  const handleSearch = () => {
    setHasSearched(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'event') {
      onInvestigate({ id: result.id, signature: result.label, chain: result.chain });
    }
  };

  return (
    <div className="ths-container">
      <div className="ths-search-card">
        <div className="ths-search-row">
          <div className="ths-input-wrapper">
            <span className="ths-input-icon">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </span>
            <input
              className="ths-input"
              type="text"
              placeholder="Search transactions, addresses, events, contracts..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="Search threats"
            />
          </div>
          <select
            className="ths-filter-select"
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            aria-label="Filter by type"
          >
            <option value="all">All Types</option>
            <option value="transaction">Transaction</option>
            <option value="address">Address</option>
            <option value="event">Event</option>
            <option value="contract">Contract</option>
          </select>
          <button className="ths-search-btn" onClick={handleSearch}>
            Search
          </button>
        </div>

        <div className="ths-filters-row">
          <div className="ths-filter-group">
            <span className="ths-filter-label">Severity:</span>
            {SEVERITY_FILTERS.map(s => (
              <button
                key={s}
                className={`ths-filter-chip ${
                  severityFilter === s ? 'ths-filter-chip--active' : ''
                }`}
                onClick={() => setSeverityFilter(s)}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          <div className="ths-filter-group">
            <span className="ths-filter-label">Chain:</span>
            {CHAIN_FILTERS.map(c => (
              <button
                key={c}
                className={`ths-filter-chip ${chainFilter === c ? 'ths-filter-chip--active' : ''}`}
                onClick={() => setChainFilter(c)}
              >
                {c === 'all' ? 'All' : c}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="ths-results-card">
        <div className="ths-results-header">
          <h2 className="ths-results-title">
            {hasSearched ? 'Search Results' : 'Ready to Search'}
          </h2>
          {hasSearched && (
            <span className="ths-results-count">
              {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {!hasSearched ? (
          <div className="ths-results-empty">
            <div className="ths-results-empty-icon">
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
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </div>
            <p className="ths-results-empty-text">Enter a search query to find threats</p>
            <p className="ths-results-empty-hint">
              Search by transaction hash, contract address, event type, or chain
            </p>
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="ths-results-empty">
            <p className="ths-results-empty-text">No results found</p>
            <p className="ths-results-empty-hint">Try adjusting your search query or filters</p>
          </div>
        ) : (
          <div>
            {filteredResults.map(result => (
              <div
                key={result.id}
                className="ths-result-item"
                onClick={() => handleResultClick(result)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && handleResultClick(result)}
              >
                <span className={`ths-result-type-badge ths-result-type-badge--${result.type}`}>
                  {result.type}
                </span>
                <div className="ths-result-body">
                  <p className="ths-result-label">{result.label}</p>
                  <p className="ths-result-desc">{result.description}</p>
                </div>
                <div className="ths-result-meta">
                  <span className="ths-result-chain">{result.chain}</span>
                  <span className="ths-result-time">{result.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { api } from '../../services/apiClient';

export default function StockSearchInput({ onSelectStock, initialValue = '', placeholder = "Search symbol or company name..." }) {
  const [query, setQuery] = useState(initialValue);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const isSelectingRef = useRef(false);

  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  useEffect(() => {
    // If the change came from clicking an item in the dropdown, don't re-search
    if (isSelectingRef.current) {
      isSelectingRef.current = false;
      setResults([]);
      setIsOpen(false);
      return;
    }

    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.searchNseStocks(trimmed);
        setResults(data || []);
        setIsOpen(true);
      } catch (e) {
        console.warn('Search error:', e);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelect(item) {
    isSelectingRef.current = true;
    onSelectStock({
      symbol: item.symbol,
      name: item.name,
      isin: item.isin,
      sector: item.sector || '',
      series: item.series || 'EQ'
    });
    setQuery(`${item.name} (${item.symbol})`);
    setResults([]);
    setIsOpen(false);
  }

  function handleClear() {
    isSelectingRef.current = true;
    setQuery('');
    setResults([]);
    setIsOpen(false);
    onSelectStock({ symbol: '', name: '', isin: '', sector: '', series: '' });
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <Search size={16} className="absolute left-3.5" style={{ color: 'var(--text-muted)' }} />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            isSelectingRef.current = false;
            setQuery(e.target.value);
          }}
          placeholder={placeholder}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          className="w-full pl-10 pr-9 py-2.5 text-sm rounded-2xl focus:outline-none focus:ring-1 focus:ring-[var(--emerald)]"
          style={{
            background: 'var(--input-bg)',
            border: '1px solid var(--input-border)',
            color: 'var(--text)',
            fontSize: '16px'
          }}
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 hover:opacity-80 p-1"
            style={{ color: 'var(--text-muted)' }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Auto-complete Dropdown */}
      {isOpen && (
        <div
          className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-2xl shadow-xl overflow-hidden max-h-60 overflow-y-auto"
          style={{
            background: 'var(--sheet-bg)',
            border: '1px solid var(--card-border)',
          }}
        >
          {loading ? (
            <div className="p-3 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
              Searching NSE master database...
            </div>
          ) : results.length > 0 ? (
            <div className="divide-y divide-[var(--divider)]">
              {results.map((item) => (
                <button
                  key={item.symbol}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className="w-full text-left px-4 py-2.5 transition hover:bg-[var(--sheet-btn-bg)] flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm" style={{ color: 'var(--emerald)' }}>
                        {item.symbol}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-medium uppercase" style={{ background: 'var(--card-bg)', color: 'var(--text-muted)', border: '1px solid var(--card-border)' }}>
                        {item.series || 'EQ'}
                      </span>
                    </div>
                    <p className="text-xs truncate" style={{ color: 'var(--text)' }}>
                      {item.name}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                      ISIN: {item.isin}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-3 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
              No NSE instruments found for "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}

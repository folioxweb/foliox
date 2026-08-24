import { useState, useEffect, useRef } from 'react';
import { Search, X, PieChart } from 'lucide-react';
import { api } from '../../services/apiClient';

export default function MfSearchInput({ 
  onSelectScheme, 
  initialValue = '', 
  placeholder = "Search mutual fund by name, AMC or scheme code..." 
}) {
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
    if (!trimmed || trimmed.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.searchMfSchemes(trimmed);
        setResults(data || []);
        setIsOpen(true);
      } catch (e) {
        console.warn('MF search error:', e);
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
    onSelectScheme(item);
    setQuery(item.name);
    setResults([]);
    setIsOpen(false);
  }

  function handleClear() {
    isSelectingRef.current = true;
    setQuery('');
    setResults([]);
    setIsOpen(false);
    onSelectScheme({ schemeCode: '', isin: '', name: '', amcName: '', category: '', plan: '' });
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
            fontSize: '15px'
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
          className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-2xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto"
          style={{
            background: 'var(--sheet-bg)',
            border: '1px solid var(--card-border)',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
          }}
        >
          {loading ? (
            <div className="p-3 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
              Searching Mutual Fund master schemes...
            </div>
          ) : results.length > 0 ? (
            <div className="divide-y divide-[var(--divider)]">
              {results.map((item) => (
                <button
                  key={item.schemeCode}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className="w-full text-left px-4 py-3 transition hover:bg-[var(--sheet-btn-bg)] flex items-center justify-between gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {item.amcName && (
                        <span 
                          className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase" 
                          style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--emerald)' }}
                        >
                          {item.amcName.replace(' Mutual Fund', '')}
                        </span>
                      )}
                      {item.category && (
                        <span 
                          className="text-[10px] px-1.5 py-0.5 rounded font-medium" 
                          style={{ background: 'var(--card-bg)', color: 'var(--text-muted)', border: '1px solid var(--card-border)' }}
                        >
                          {item.category}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold mt-1 leading-snug line-clamp-2" style={{ color: 'var(--text)' }}>
                      {item.name}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 flex flex-col items-end gap-0.5">
                    {item.nav != null && (
                      <span className="text-xs font-extrabold" style={{ color: 'var(--emerald)' }}>
                        ₹{Number(item.nav).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                      </span>
                    )}
                    <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                      AMFI #{item.schemeCode}
                    </span>
                    {item.isin && (
                      <span className="text-[9px] font-mono text-slate-500">
                        {item.isin}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-3 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
              No mutual fund schemes found for "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}

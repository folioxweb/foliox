import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import StockSearchInput from '../ui/StockSearchInput';
import { usePortfolio } from '../../context/PortfolioContext';
import { fetchLiveStockPrice } from '../../services/stockChartService';
import { RefreshCw } from 'lucide-react';

const CONFIDENCE_OPTIONS = ["Very High", "High", "Medium", "Low"];

const SECTORS = [
  "Financial Services", "Technology", "Energy", "Consumer Cyclical",
  "Healthcare", "Housing Finance", "Communication Services", "Utilities",
  "Real Estate", "Consumer Defensive", "Industrials", "Renewable Energy",
  "Digital Advertising & Technology", "Basic Materials", "Alcoholic Beverages",
  "Travel & Visa Services", "Industrial Machinery", "Oil, Gas & Consumable Fuels",
  "Automobile and Auto Components", "Power Financing", "Capital Goods",
  "Fast Moving Consumer Goods", "Construction", "Telecommunication",
  "Metals & Mining", "Consumer Services", "Consumer Durables", "Power",
  "Services", "Chemicals", "Construction Materials", "Realty",
  "Media, Entertainment & Publication", "Textiles", "Diversified"
];

export default function AddWatchlistModal({ isOpen, onClose }) {
  const { addWatchlistItem } = usePortfolio();
  const [loading, setLoading] = useState(false);
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const [livePrice, setLivePrice] = useState(null);
  const [selectedStock, setSelectedStock] = useState({ symbol: '', name: '', isin: '', sector: '' });
  const [confidence, setConfidence] = useState('Medium');
  const [badge, setBadge] = useState('Trade');
  const [sector, setSector] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setSelectedStock({ symbol: '', name: '', isin: '', sector: '' });
      setLivePrice(null);
      setConfidence('Medium');
      setBadge('Trade');
      setSector('');
      setTargetPrice('');
      setNotes('');
    }
  }, [isOpen]);

  async function handleSelectStock(stock) {
    setSelectedStock(stock);
    if (stock.sector && SECTORS.includes(stock.sector)) {
      setSector(stock.sector);
    }
    if (stock.symbol) {
      setFetchingPrice(true);
      try {
        const quote = await fetchLiveStockPrice(stock.symbol);
        if (quote && quote.price) {
          setLivePrice(quote.price);
        }
      } catch (err) {
        console.warn('Failed to fetch live price for watchlist:', err);
      } finally {
        setFetchingPrice(false);
      }
    }
  }

  const isFormValid = selectedStock.symbol.trim() && selectedStock.name.trim() && sector && confidence;

  async function handleSave() {
    try {
      setLoading(true);
      await addWatchlistItem({
        symbol: selectedStock.symbol,
        isin: selectedStock.isin,
        name: selectedStock.name,
        sector,
        confidence,
        badge,
        added_price: livePrice || 0,
        target_price: targetPrice ? Number(targetPrice) : null,
        notes: notes.trim()
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Unable to add to watchlist');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    background: 'var(--input-bg)',
    border: '1px solid var(--input-border)',
    color: 'var(--text)',
    borderRadius: '16px',
    padding: '0.75rem 1rem',
    outline: 'none',
    fontSize: '15px',
  };

  const selectStyle = {
    ...inputStyle,
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 1rem center',
    backgroundSize: '1.2rem',
    paddingRight: '2.5rem',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 space-y-4">
        <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
          Add Stock to Watchlist
        </h2>

        <div>
          <label className="block mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Search Stock (NSE Master)
          </label>
          <StockSearchInput onSelectStock={handleSelectStock} />
        </div>

        {selectedStock.symbol && (
          <div className="p-3 rounded-xl flex items-center justify-between" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-sm" style={{ color: 'var(--emerald)' }}>{selectedStock.symbol}</p>
                {fetchingPrice && (
                  <span className="text-[10px] text-amber-400 animate-pulse flex items-center gap-1">
                    <RefreshCw size={10} className="animate-spin" /> Fetching price...
                  </span>
                )}
              </div>
              <p className="text-xs" style={{ color: 'var(--text)' }}>{selectedStock.name}</p>
            </div>
            {livePrice ? (
              <div className="text-right">
                <span className="text-xs font-extrabold block" style={{ color: 'var(--emerald)' }}>
                  ₹{livePrice.toLocaleString('en-IN')}
                </span>
                <span className="text-[9px] font-semibold uppercase text-emerald-400">Yahoo Live</span>
              </div>
            ) : selectedStock.isin ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ background: 'var(--card-bg)', color: 'var(--text-muted)' }}>
                ISIN: {selectedStock.isin}
              </span>
            ) : null}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Conviction Level
            </label>
            <select
              value={confidence}
              onChange={(e) => setConfidence(e.target.value)}
              style={selectStyle}
              className="w-full focus:ring-1 focus:ring-[var(--emerald)]"
            >
              {CONFIDENCE_OPTIONS.map(c => (
                <option key={c} value={c} style={{ background: 'var(--sheet-bg)', color: 'var(--text)' }}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Badge Type
            </label>
            <select
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
              style={selectStyle}
              className="w-full focus:ring-1 focus:ring-[var(--emerald)]"
            >
              <option value="Longterm" style={{ background: 'var(--sheet-bg)', color: 'var(--text)' }}>Longterm</option>
              <option value="Trade" style={{ background: 'var(--sheet-bg)', color: 'var(--text)' }}>Trade</option>
              <option value="None" style={{ background: 'var(--sheet-bg)', color: 'var(--text)' }}>No Badge</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Sector
          </label>
          <select
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            style={selectStyle}
            className="w-full focus:ring-1 focus:ring-[var(--emerald)]"
          >
            <option value="" disabled style={{ background: 'var(--sheet-bg)', color: 'var(--text-muted)' }}>Select Sector</option>
            {SECTORS.map(s => (
              <option key={s} value={s} style={{ background: 'var(--sheet-bg)', color: 'var(--text)' }}>{s}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            placeholder="Target Price (Optional)"
            value={targetPrice}
            onChange={(e) => setTargetPrice(e.target.value)}
            style={inputStyle}
            className="w-full focus:ring-1 focus:ring-[var(--emerald)]"
          />
          <input
            type="text"
            placeholder="Notes/Rationale (Optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={inputStyle}
            className="w-full focus:ring-1 focus:ring-[var(--emerald)]"
          />
        </div>

        <div className="mt-6 flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-full py-3 font-semibold transition"
            style={{ background: 'var(--sheet-btn-bg)', border: '1px solid var(--card-border)', color: 'var(--text-2)' }}
          >
            Cancel
          </button>
          <button
            disabled={loading || !isFormValid}
            onClick={handleSave}
            className="flex-1 rounded-full py-3 font-bold transition disabled:cursor-not-allowed"
            style={{
              background: isFormValid ? 'var(--emerald)' : 'var(--divider)',
              color: isFormValid ? '#ffffff' : 'var(--text-muted)',
              boxShadow: isFormValid ? '0 4px 12px rgba(16,185,129,0.2)' : 'none'
            }}
          >
            {loading ? 'Adding...' : 'Add to Watchlist'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

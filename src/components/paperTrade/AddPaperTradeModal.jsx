import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import StockSearchInput from '../ui/StockSearchInput';
import { usePortfolio } from '../../context/PortfolioContext';
import { fetchLiveStockPrice } from '../../services/stockChartService';
import { RefreshCw, Zap, Sliders } from 'lucide-react';

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

export default function AddPaperTradeModal({ isOpen, onClose }) {
  const { addPaperHolding, state } = usePortfolio();
  const [loading, setLoading] = useState(false);
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const [selectedStock, setSelectedStock] = useState({ symbol: '', name: '', isin: '', sector: '' });
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [livePrice, setLivePrice] = useState(null);
  const [isMarketPrice, setIsMarketPrice] = useState(true);
  const [confidence, setConfidence] = useState('Medium');
  const [badge, setBadge] = useState('Trade');
  const [sector, setSector] = useState('');

  const currentCash = state.paperTrade?.data?.summary?.currentCash || 5000000;

  useEffect(() => {
    if (!isOpen) {
      setSelectedStock({ symbol: '', name: '', isin: '', sector: '' });
      setQuantity('');
      setPrice('');
      setLivePrice(null);
      setIsMarketPrice(true);
      setConfidence('Medium');
      setBadge('Trade');
      setSector('');
    }
  }, [isOpen]);

  async function fetchPriceForStock(sym) {
    if (!sym) return;
    setFetchingPrice(true);
    try {
      const quote = await fetchLiveStockPrice(sym);
      if (quote && quote.price) {
        setLivePrice(quote.price);
        if (isMarketPrice) {
          setPrice(String(quote.price));
        }
      }
    } catch (err) {
      console.warn('Failed to fetch live price for paper trade:', err);
    } finally {
      setFetchingPrice(false);
    }
  }

  function handleSelectStock(stock) {
    setSelectedStock(stock);
    if (stock.sector && SECTORS.includes(stock.sector)) {
      setSector(stock.sector);
    }
    if (stock.symbol) {
      fetchPriceForStock(stock.symbol);
    }
  }

  const qty = Number(quantity);
  const buyPrice = Number(price);
  const totalCost = qty * buyPrice;
  const isFormValid = selectedStock.symbol.trim() && qty > 0 && buyPrice > 0 && sector && totalCost <= currentCash;

  async function handleBuy() {
    try {
      setLoading(true);
      await addPaperHolding({
        symbol: selectedStock.symbol,
        isin: selectedStock.isin,
        name: selectedStock.name,
        sector,
        confidence,
        badge,
        quantity: qty,
        price: buyPrice
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Unable to place paper trade');
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
        <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--divider)' }}>
          <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
            Buy Paper Stock (Delivery)
          </h2>
          <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--emerald)' }}>
            Cash: ₹{currentCash.toLocaleString('en-IN')}
          </span>
        </div>

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
                    <RefreshCw size={10} className="animate-spin" /> Fetching live market price...
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

        {/* Order Type Mode Toggle: Market Price vs Custom Price */}
        <div className="flex items-center justify-between p-1.5 rounded-2xl" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
          <button
            type="button"
            onClick={() => {
              setIsMarketPrice(true);
              if (livePrice) setPrice(String(livePrice));
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              isMarketPrice ? 'bg-[var(--emerald)] text-white shadow-md' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            <Zap size={14} /> At Market Price
          </button>
          <button
            type="button"
            onClick={() => setIsMarketPrice(false)}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              !isMarketPrice ? 'bg-indigo-600 text-white shadow-md' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            <Sliders size={14} /> Custom Price
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Quantity
            </label>
            <input
              type="number"
              placeholder="Quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              style={inputStyle}
              className="w-full focus:ring-1 focus:ring-[var(--emerald)]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Buy Price (₹)
              </label>
              {selectedStock.symbol && (
                <button
                  type="button"
                  onClick={() => fetchPriceForStock(selectedStock.symbol)}
                  className="text-[10px] font-bold text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <RefreshCw size={10} className={fetchingPrice ? 'animate-spin' : ''} /> Refetch
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type="number"
                placeholder={isMarketPrice ? (fetchingPrice ? "Fetching..." : "Market Price") : "Price per share"}
                value={price}
                onChange={(e) => {
                  setPrice(e.target.value);
                  if (isMarketPrice) setIsMarketPrice(false); // User edited price manually
                }}
                disabled={isMarketPrice && fetchingPrice}
                style={{
                  ...inputStyle,
                  paddingRight: isMarketPrice ? '4.25rem' : '1rem',
                  borderColor: isMarketPrice ? 'var(--emerald)' : 'var(--input-border)',
                  background: isMarketPrice ? 'rgba(16,185,129,0.06)' : 'var(--input-bg)',
                }}
                className="w-full focus:ring-1 focus:ring-[var(--emerald)]"
              />
              {isMarketPrice && (
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500 text-white uppercase tracking-wider pointer-events-none">
                  Market
                </span>
              )}
            </div>
          </div>
        </div>

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

        {totalCost > 0 && (
          <div className="p-3 rounded-2xl flex items-center justify-between text-xs" style={{ background: totalCost > currentCash ? 'rgba(239,68,68,0.1)' : 'var(--card-bg)', border: `1px solid ${totalCost > currentCash ? 'var(--loss)' : 'var(--card-border)'}` }}>
            <span style={{ color: 'var(--text-muted)' }}>Total Trade Investment:</span>
            <span className="font-bold text-sm" style={{ color: totalCost > currentCash ? 'var(--loss)' : 'var(--emerald)' }}>
              ₹{totalCost.toLocaleString('en-IN')} {totalCost > currentCash && '(Exceeds Cash Balance!)'}
            </span>
          </div>
        )}

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
            onClick={handleBuy}
            className="flex-1 rounded-full py-3 font-bold transition disabled:cursor-not-allowed"
            style={{
              background: isFormValid ? 'var(--emerald)' : 'var(--divider)',
              color: isFormValid ? '#ffffff' : 'var(--text-muted)',
              boxShadow: isFormValid ? '0 4px 12px rgba(16,185,129,0.2)' : 'none'
            }}
          >
            {loading ? 'Executing...' : 'Place Paper Trade'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

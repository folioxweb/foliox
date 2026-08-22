import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, TrendingUp, TrendingDown, Briefcase, Check, Search, X, SlidersHorizontal, Settings } from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';
import PrivacyToggle from '../../components/ui/PrivacyToggle';
import RefreshButton from '../../components/ui/RefreshButton';
import LoadingIndicator from '../../components/ui/LoadingIndicator';
import AddWatchlistModal from '../../components/watchlist/AddWatchlistModal';
import Modal from '../../components/ui/Modal';

function ConvertToPortfolioModal({ item, isOpen, onClose }) {
  const { addHolding } = usePortfolio();
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [confidence, setConfidence] = useState(item?.confidence || 'Medium');
  const [badge, setBadge] = useState(item?.badge || 'Trade');
  const [loading, setLoading] = useState(false);

  useState(() => {
    if (item) {
      setPrice(item.currentPrice ? String(item.currentPrice) : '');
      setConfidence(item.confidence || 'Medium');
      setBadge(item.badge || 'Trade');
    }
  }, [item]);

  if (!item) return null;

  async function handleAdd() {
    try {
      setLoading(true);
      await addHolding({
        assetType: 'stocks',
        symbol: item.symbol,
        name: item.name,
        sector: item.sector,
        confidence,
        badge,
        quantity: Number(quantity),
        price: Number(price || item.currentPrice),
        isin: item.isin
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to add holding to portfolio');
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

  const isFormValid = Number(quantity) > 0 && Number(price || item.currentPrice) > 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--divider)' }}>
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Add to Real Portfolio</h2>
            <p className="text-xs" style={{ color: 'var(--emerald)' }}>{item.name} ({item.symbol})</p>
          </div>
          <span className="text-[10px] font-mono px-2 py-1 rounded" style={{ background: 'var(--card-bg)', color: 'var(--text-muted)' }}>
            ISIN: {item.isin || 'N/A'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Buy Quantity
            </label>
            <input
              type="number"
              placeholder="Qty"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              style={inputStyle}
              className="w-full focus:ring-1 focus:ring-[var(--emerald)]"
            />
          </div>

          <div>
            <label className="block mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Buy Price (₹)
            </label>
            <input
              type="number"
              placeholder={`Price (Cur: ₹${item.currentPrice})`}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              style={inputStyle}
              className="w-full focus:ring-1 focus:ring-[var(--emerald)]"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Conviction
            </label>
            <select
              value={confidence}
              onChange={(e) => setConfidence(e.target.value)}
              style={inputStyle}
              className="w-full"
            >
              {["Very High", "High", "Medium", "Low"].map(c => (
                <option key={c} value={c} style={{ background: 'var(--sheet-bg)', color: 'var(--text)' }}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Badge
            </label>
            <select
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
              style={inputStyle}
              className="w-full"
            >
              <option value="Longterm" style={{ background: 'var(--sheet-bg)', color: 'var(--text)' }}>Longterm</option>
              <option value="Trade" style={{ background: 'var(--sheet-bg)', color: 'var(--text)' }}>Trade</option>
              <option value="None" style={{ background: 'var(--sheet-bg)', color: 'var(--text)' }}>No Badge</option>
            </select>
          </div>
        </div>

        <div className="p-3 rounded-xl text-xs space-y-1" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
          <div className="flex justify-between" style={{ color: 'var(--text-muted)' }}>
            <span>Sector:</span>
            <span className="font-medium" style={{ color: 'var(--text)' }}>{item.sector || 'N/A'}</span>
          </div>
          <div className="flex justify-between" style={{ color: 'var(--text-muted)' }}>
            <span>Note:</span>
            <span className="italic truncate max-w-[200px]" style={{ color: 'var(--text)' }}>Stock will remain in Watchlist with an 'In Portfolio' badge.</span>
          </div>
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
            onClick={handleAdd}
            className="flex-1 rounded-full py-3 font-bold transition disabled:cursor-not-allowed"
            style={{
              background: isFormValid ? 'var(--emerald)' : 'var(--divider)',
              color: isFormValid ? '#ffffff' : 'var(--text-muted)'
            }}
          >
            {loading ? 'Adding...' : 'Add to Portfolio'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function WatchlistPage() {
  const navigate = useNavigate();
  const { state, refreshAll, refreshing, removeWatchlistItem } = usePortfolio();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedConvertItem, setSelectedConvertItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const watchlistItems = state.watchlist?.data || [];
  const loading = state.watchlist?.loading || false;

  const filteredItems = watchlistItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sector.toLowerCase().includes(searchQuery.toLowerCase())
  );

  async function handleDelete(item) {
    if (window.confirm(`Remove ${item.name} (${item.symbol}) from Watchlist?`)) {
      try {
        await removeWatchlistItem({ watchlistId: item.watchlistId, symbol: item.symbol });
      } catch (err) {
        alert(err.message || 'Failed to remove from watchlist');
      }
    }
  }

  return (
    <main
      className="relative flex min-h-0 flex-1 flex-col overflow-y-auto"
      style={{
        background: 'var(--bg)',
        paddingBottom: 'calc(5.5rem + env(safe-area-inset-bottom))',
      }}
    >
      {/* Sticky Header */}
      <div
        className="sticky top-0 z-20 px-4"
        style={{
          paddingTop: 'max(1.25rem, env(safe-area-inset-top))',
          paddingBottom: '0.75rem',
          background: 'var(--header-bg)',
          borderBottom: '1px solid var(--header-border)',
        }}
      >
        <div className="flex items-center justify-between h-10">
          {!isSearchOpen ? (
            <div className="w-full flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0 shrink">
                <h1 className="text-xl font-bold truncate" style={{ color: 'var(--text)' }}>
                  Watchlist
                </h1>
                <span className="text-[11px] px-1.5 py-0.5 rounded-full font-extrabold shrink-0" style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--emerald)' }}>
                  {watchlistItems.length}
                </span>
                <LoadingIndicator loading={refreshing} />
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="rounded-full p-1.5 transition-colors hover:opacity-80"
                  style={{ color: 'var(--text-muted)' }}
                  aria-label="Search watchlist"
                >
                  <Search size={18} />
                </button>
                <button
                  onClick={() => setAddModalOpen(true)}
                  className="rounded-full px-2.5 py-1 text-xs font-bold text-white transition hover:opacity-90 whitespace-nowrap flex items-center gap-1"
                  style={{ background: 'var(--emerald)' }}
                >
                  + Add
                </button>
                <RefreshButton onRefresh={refreshAll} />
                <PrivacyToggle />
                <button
                  onClick={() => navigate('/settings')}
                  className="flex h-8 w-8 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--emerald)]"
                  style={{ border: '1px solid var(--card-border)', background: 'var(--card-bg)', color: 'var(--text-2)' }}
                  aria-label="Settings"
                >
                  <Settings size={18} />
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full flex items-center justify-between gap-3">
              <div className="relative flex-1 flex items-center">
                <input
                  type="text"
                  placeholder="Search watchlist stocks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl py-1.5 pl-3 pr-8 text-base focus:outline-none focus:ring-1 focus:ring-[var(--emerald)]"
                  style={{
                    background: 'var(--input-bg)',
                    border: '1px solid var(--input-border)',
                    color: 'var(--text)',
                    fontSize: '16px',
                  }}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-2.5 hover:opacity-80" style={{ color: 'var(--text-muted)' }}>
                    <X size={16} />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setIsSearchOpen(false); }}
                className="text-sm font-semibold transition hover:opacity-80"
                style={{ color: 'var(--emerald)' }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Watchlist Container */}
      <div className="px-4 pt-3 space-y-3">
        {loading && watchlistItems.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            Loading watchlist stocks...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-8 text-center rounded-3xl border border-dashed flex flex-col items-center gap-3 mt-4" style={{ borderColor: 'var(--card-border)', background: 'var(--card-bg)' }}>
            <Briefcase size={36} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
            <div>
              <p className="font-semibold text-base" style={{ color: 'var(--text)' }}>Your Watchlist is empty</p>
              <p className="text-xs max-w-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Track prospective stocks with live market prices, day change, and returns since addition.
              </p>
            </div>
            <button
              onClick={() => setAddModalOpen(true)}
              className="mt-2 rounded-full px-4 py-2 text-xs font-bold text-white transition hover:opacity-90"
              style={{ background: 'var(--emerald)' }}
            >
              + Add First Stock
            </button>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isProfit = item.returnSinceAddedPct >= 0;
            const isDayProfit = item.dayChangePercent >= 0;
            const dayChangeFormatted = Number(item.dayChangePercent || 0).toFixed(2);
            const returnSinceAddedFormatted = Number(item.returnSinceAddedPct || 0).toFixed(2);
            const returnSinceAddedAbsFormatted = Number(item.returnSinceAddedAbs || 0).toFixed(2);

            return (
              <div
                key={item.watchlistId || item.symbol}
                className="p-4 rounded-3xl relative overflow-hidden transition-all shadow-sm"
                style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--card-border)',
                }}
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-base truncate" style={{ color: 'var(--text)' }}>
                        {item.name}
                      </h3>
                      {item.inPortfolio && (
                        <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider" style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--emerald)', border: '1px solid rgba(16,185,129,0.3)' }}>
                          <Check size={10} /> In Portfolio
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-bold" style={{ color: 'var(--emerald)' }}>{item.symbol}</span>
                      {item.sector && (
                        <span className="text-[10px] truncate max-w-[140px]" style={{ color: 'var(--text-muted)' }}>• {item.sector}</span>
                      )}
                    </div>
                  </div>

                  {/* Right: Current Price & Day Change */}
                  <div className="text-right flex-shrink-0">
                    <div className="text-base font-bold" style={{ color: 'var(--text)' }}>
                      ₹{item.currentPrice ? item.currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                    </div>
                    <div className="flex items-center justify-end gap-1 text-xs font-semibold" style={{ color: isDayProfit ? 'var(--profit)' : 'var(--loss)' }}>
                      {isDayProfit ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      <span>{isDayProfit ? '+' : ''}{dayChangeFormatted}% Today</span>
                    </div>
                  </div>
                </div>

                {/* Returns Since Added Row */}
                <div className="p-3 rounded-2xl flex items-center justify-between my-2" style={{ background: 'var(--sheet-btn-bg)', border: '1px solid var(--card-border)' }}>
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                      Return Since Added
                    </span>
                    <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                      (Added @ ₹{item.addedPrice ? item.addedPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'})
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold" style={{ color: isProfit ? 'var(--profit)' : 'var(--loss)' }}>
                      {isProfit ? '+' : ''}{returnSinceAddedFormatted}%
                    </span>
                    <span className="text-xs block font-medium" style={{ color: isProfit ? 'var(--profit)' : 'var(--loss)' }}>
                      ({isProfit ? '+' : ''}₹{returnSinceAddedAbsFormatted})
                    </span>
                  </div>
                </div>

                {/* Target price & notes if available */}
                {(item.targetPrice || item.notes) && (
                  <div className="text-xs p-2 rounded-xl mb-3 space-y-1" style={{ background: 'var(--input-bg)', color: 'var(--text-2)' }}>
                    {item.targetPrice && (
                      <div className="flex justify-between">
                        <span style={{ color: 'var(--text-muted)' }}>Target Price:</span>
                        <span className="font-bold text-emerald-500">₹{item.targetPrice}</span>
                      </div>
                    )}
                    {item.notes && (
                      <div className="truncate">
                        <span style={{ color: 'var(--text-muted)' }}>Note: </span>
                        <span>{item.notes}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Bottom Action Footer */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5">
                    {item.confidence && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold" style={{ background: 'var(--sheet-btn-bg)', color: 'var(--text-2)', border: '1px solid var(--card-border)' }}>
                        {item.confidence}
                      </span>
                    )}
                    {item.badge && item.badge !== 'None' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold" style={{ background: 'var(--sheet-btn-bg)', color: 'var(--text-2)', border: '1px solid var(--card-border)' }}>
                        {item.badge}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDelete(item)}
                      className="p-2 rounded-full transition hover:bg-red-500/10 hover:text-red-500"
                      style={{ color: 'var(--text-muted)' }}
                      title="Remove from Watchlist"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button
                      onClick={() => setSelectedConvertItem(item)}
                      className="px-3.5 py-1.5 rounded-full text-xs font-bold text-white transition hover:opacity-90 flex items-center gap-1.5"
                      style={{ background: 'var(--emerald)' }}
                    >
                      <Plus size={14} /> Add to Portfolio
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <AddWatchlistModal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} />
      <ConvertToPortfolioModal item={selectedConvertItem} isOpen={Boolean(selectedConvertItem)} onClose={() => setSelectedConvertItem(null)} />
    </main>
  );
}

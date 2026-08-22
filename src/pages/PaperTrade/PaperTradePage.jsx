import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Wallet, TrendingUp, TrendingDown, RefreshCw, Plus, Briefcase, Search, X, Settings } from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';
import PrivacyToggle from '../../components/ui/PrivacyToggle';
import RefreshButton from '../../components/ui/RefreshButton';
import LoadingIndicator from '../../components/ui/LoadingIndicator';
import AddPaperTradeModal from '../../components/paperTrade/AddPaperTradeModal';
import SellPaperTradeModal from '../../components/paperTrade/SellPaperTradeModal';

export default function PaperTradePage() {
  const navigate = useNavigate();
  const { state, refreshAll, refreshing } = usePortfolio();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [sellingHolding, setSellingHolding] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const paperData = state.paperTrade?.data || { summary: {}, holdings: [] };
  const summary = paperData.summary || {
    initialCapital: 5000000,
    currentCash: 5000000,
    realizedPnl: 0,
    totalInvested: 0,
    totalCurrent: 0,
    unrealizedPnl: 0,
    totalDayChange: 0,
    portfolioValue: 5000000,
    totalPnl: 0,
    totalPnlPct: 0
  };
  const holdings = paperData.holdings || [];
  const loading = state.paperTrade?.loading || false;

  // Real-time calculated portfolio metrics
  const totalCurrentValue = holdings.reduce((acc, h) => acc + (Number(h.currentValue) || 0), 0);
  const totalInvestedValue = holdings.reduce((acc, h) => acc + (Number(h.investedValue) || 0), 0);
  const unrealizedPnl = totalCurrentValue - totalInvestedValue;

  const initialCapital = summary.initialCapital !== undefined ? Number(summary.initialCapital) : 5000000;
  const currentCash = summary.currentCash !== undefined ? Number(summary.currentCash) : 5000000;
  const realizedPnl = summary.realizedPnl !== undefined ? Number(summary.realizedPnl) : 0;

  const portfolioValue = currentCash + totalCurrentValue;
  const totalPnl = portfolioValue - initialCapital;
  const totalPnlPct = initialCapital > 0 ? (totalPnl / initialCapital) * 100 : 0;
  const isTotalProfit = totalPnl >= 0;

  const filteredHoldings = holdings.filter(h =>
    h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.sector.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                  Paper Trade
                </h1>
                <LoadingIndicator loading={refreshing} />
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="rounded-full p-1.5 transition-colors hover:opacity-80"
                  style={{ color: 'var(--text-muted)' }}
                  aria-label="Search paper trades"
                >
                  <Search size={18} />
                </button>
                <button
                  onClick={() => setAddModalOpen(true)}
                  className="rounded-full px-2.5 py-1 text-xs font-bold text-white transition hover:opacity-90 whitespace-nowrap flex items-center gap-1"
                  style={{ background: 'var(--emerald)' }}
                >
                  <Plus size={14} /> Buy
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
                  placeholder="Search paper positions..."
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

      <div className="px-4 pt-3 space-y-4">
        {/* Standard Official Paper Portfolio Summary Card */}
        <div
          className="p-5 rounded-3xl relative overflow-hidden transition-all"
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            boxShadow: 'var(--card-shadow)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--emerald)' }}>
              <Wallet size={16} /> Paper Portfolio
            </span>
            <span className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>
              Initial Capital: ₹{initialCapital.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="my-2">
            <div className="text-3xl font-extrabold" style={{ color: 'var(--text)' }}>
              ₹{portfolioValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm font-bold" style={{ color: isTotalProfit ? 'var(--profit)' : 'var(--loss)' }}>
              {isTotalProfit ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span>{isTotalProfit ? '+' : ''}₹{totalPnl.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({isTotalProfit ? '+' : ''}{totalPnlPct.toFixed(2)}%) Total Return</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t text-xs" style={{ borderColor: 'var(--divider)' }}>
            <div>
              <span className="block text-[10px] uppercase font-semibold" style={{ color: 'var(--text-muted)' }}>Available Cash</span>
              <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>₹{currentCash.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-semibold" style={{ color: 'var(--text-muted)' }}>Unrealized P&L</span>
              <span className="font-bold text-sm" style={{ color: unrealizedPnl >= 0 ? 'var(--profit)' : 'var(--loss)' }}>
                {unrealizedPnl >= 0 ? '+' : ''}₹{unrealizedPnl.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-semibold" style={{ color: 'var(--text-muted)' }}>Realized P&L</span>
              <span className="font-bold text-sm" style={{ color: realizedPnl >= 0 ? 'var(--profit)' : 'var(--loss)' }}>
                {realizedPnl >= 0 ? '+' : ''}₹{realizedPnl.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Paper Holdings Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Paper Positions</h2>
            <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{holdings.length} Holdings</span>
          </div>

          {loading && holdings.length === 0 ? (
            <div className="p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              Loading paper holdings...
            </div>
          ) : filteredHoldings.length === 0 ? (
            <div className="p-8 text-center rounded-3xl border border-dashed flex flex-col items-center gap-3 mt-2" style={{ borderColor: 'var(--card-border)', background: 'var(--card-bg)' }}>
              <Briefcase size={36} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
              <div>
                <p className="font-semibold text-base" style={{ color: 'var(--text)' }}>No Paper Trades Active</p>
                <p className="text-xs max-w-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  Start practice trading with your ₹50,00,000 virtual cash balance in delivery mode.
                </p>
              </div>
              <button
                onClick={() => setAddModalOpen(true)}
                className="mt-2 rounded-full px-4 py-2 text-xs font-bold text-white transition hover:opacity-90 flex items-center gap-1"
                style={{ background: 'var(--emerald)' }}
              >
                <Plus size={14} /> Buy First Paper Stock
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHoldings.map((h) => {
                const isProfit = h.returnPct >= 0;
                const isDayProfit = h.dayChangePercent >= 0;
                const dayChangeFormatted = Number(h.dayChangePercent || 0).toFixed(2);
                const returnPctFormatted = Number(h.returnPct || 0).toFixed(2);

                return (
                  <div
                    key={h.assetId}
                    className="p-4 rounded-3xl relative overflow-hidden transition-all shadow-sm"
                    style={{
                      background: 'var(--card-bg)',
                      border: '1px solid var(--card-border)',
                    }}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="font-bold text-base" style={{ color: 'var(--text)' }}>{h.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-bold" style={{ color: 'var(--emerald)' }}>{h.symbol}</span>
                          {h.sector && <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>• {h.sector}</span>}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-base font-bold" style={{ color: 'var(--text)' }}>
                          ₹{h.currentValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="flex items-center justify-end gap-1 text-xs font-semibold" style={{ color: isDayProfit ? 'var(--profit)' : 'var(--loss)' }}>
                          {isDayProfit ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          <span>{isDayProfit ? '+' : ''}{dayChangeFormatted}% Today</span>
                        </div>
                      </div>
                    </div>

                    {/* Metrics grid showing Quantity, Avg Price, Current Price (LTP), Return PnL */}
                    <div className="grid grid-cols-4 gap-2 p-3 rounded-2xl my-2 text-xs" style={{ background: 'var(--sheet-btn-bg)', border: '1px solid var(--card-border)' }}>
                      <div>
                        <span className="block text-[10px] uppercase font-semibold" style={{ color: 'var(--text-muted)' }}>Qty</span>
                        <span className="font-bold" style={{ color: 'var(--text)' }}>{h.quantity}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase font-semibold" style={{ color: 'var(--text-muted)' }}>Avg Price</span>
                        <span className="font-bold" style={{ color: 'var(--text)' }}>₹{h.buyPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase font-semibold" style={{ color: 'var(--text-muted)' }}>LTP</span>
                        <span className="font-bold text-emerald-400">₹{h.currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[10px] uppercase font-semibold" style={{ color: 'var(--text-muted)' }}>Return P&L</span>
                        <span className="font-extrabold" style={{ color: isProfit ? 'var(--profit)' : 'var(--loss)' }}>
                          {isProfit ? '+' : ''}{returnPctFormatted}%
                        </span>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1.5">
                        {h.confidence && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold" style={{ background: 'var(--sheet-btn-bg)', color: 'var(--text-2)', border: '1px solid var(--card-border)' }}>
                            {h.confidence}
                          </span>
                        )}
                        {h.badge && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold" style={{ background: 'var(--sheet-btn-bg)', color: 'var(--text-2)', border: '1px solid var(--card-border)' }}>
                            {h.badge}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => setSellingHolding(h)}
                        className="px-4 py-1.5 rounded-full text-xs font-bold text-white transition hover:opacity-90"
                        style={{ background: 'var(--loss)' }}
                      >
                        Sell Position
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <AddPaperTradeModal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} />
      <SellPaperTradeModal holding={sellingHolding} isOpen={Boolean(sellingHolding)} onClose={() => setSellingHolding(null)} />
    </main>
  );
}

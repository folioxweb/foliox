import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { usePortfolio } from '../../context/PortfolioContext';
import { ShieldAlert, Target, Sparkles, SlidersHorizontal, Check } from 'lucide-react';

const CONFIDENCE_OPTIONS = ['Very High', 'High', 'Medium', 'Low'];

const SECTORS = [
  'Financial Services', 'Technology', 'Energy', 'Consumer Cyclical',
  'Healthcare', 'Housing Finance', 'Communication Services', 'Utilities',
  'Real Estate', 'Consumer Defensive', 'Industrials', 'Renewable Energy',
  'Digital Advertising & Technology', 'Basic Materials', 'Alcoholic Beverages',
  'Travel & Visa Services', 'Industrial Machinery', 'Oil, Gas & Consumable Fuels',
  'Automobile and Auto Components', 'Power Financing', 'Capital Goods',
  'Fast Moving Consumer Goods', 'Construction', 'Telecommunication',
  'Metals & Mining', 'Consumer Services', 'Consumer Durables', 'Power',
  'Services', 'Chemicals', 'Construction Materials', 'Realty',
  'Media, Entertainment & Publication', 'Textiles', 'Diversified'
];

export default function UpdatePaperTradeModal({ holding, isOpen, onClose }) {
  const { updatePaperHolding } = usePortfolio();
  const [loading, setLoading] = useState(false);
  const [stopLoss, setStopLoss] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [confidence, setConfidence] = useState('Medium');
  const [badge, setBadge] = useState('Trade');
  const [sector, setSector] = useState('');

  useEffect(() => {
    if (holding && isOpen) {
      setStopLoss(holding.stopLoss != null ? String(holding.stopLoss) : '');
      setTargetPrice(holding.targetPrice != null ? String(holding.targetPrice) : '');
      setConfidence(holding.confidence || 'Medium');
      setBadge(holding.badge || 'Trade');
      setSector(holding.sector || '');
    }
  }, [holding, isOpen]);

  if (!holding) return null;

  const buyPrice = Number(holding.buyPrice || 0);
  const currentPrice = Number(holding.currentPrice || buyPrice);
  const numStopLoss = stopLoss ? parseFloat(stopLoss) : null;
  const numTargetPrice = targetPrice ? parseFloat(targetPrice) : null;

  // Percentage calculations relative to entry price
  const slPercent = numStopLoss && buyPrice > 0 ? (((numStopLoss - buyPrice) / buyPrice) * 100).toFixed(2) : null;
  const tpPercent = numTargetPrice && buyPrice > 0 ? (((numTargetPrice - buyPrice) / buyPrice) * 100).toFixed(2) : null;

  const handleUpdate = async () => {
    try {
      setLoading(true);
      await updatePaperHolding({
        assetId: holding.assetId,
        stopLoss: stopLoss.trim() !== '' ? Number(stopLoss) : null,
        targetPrice: targetPrice.trim() !== '' ? Number(targetPrice) : null,
        confidence,
        badge,
        sector: sector || null
      });
      onClose();
    } catch (err) {
      console.error('Failed to update paper holding:', err);
      alert(err.message || 'Unable to update paper trade');
    } finally {
      setLoading(false);
    }
  };

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
      <div className="p-4 sm:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--divider)' }}>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
              <SlidersHorizontal size={18} />
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
                Update Trade Position
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Adjust stop loss, target, conviction & trade type
              </p>
            </div>
          </div>
        </div>

        {/* Position Context Card */}
        <div
          className="p-3 rounded-2xl flex items-center justify-between"
          style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm" style={{ color: 'var(--emerald)' }}>
                {holding.symbol}
              </span>
              <span className="text-xs text-[var(--text-muted)] font-medium">
                {holding.quantity} shares
              </span>
            </div>
            <p className="text-xs truncate max-w-[200px]" style={{ color: 'var(--text)' }}>
              {holding.name}
            </p>
          </div>

          <div className="text-right text-xs">
            <div className="text-[var(--text-muted)]">
              Entry: <strong className="text-[var(--text)]">₹{buyPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
            </div>
            <div className="text-[var(--text-muted)]">
              LTP: <strong className="text-emerald-500">₹{currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
            </div>
          </div>
        </div>

        {/* Stop Loss Input & Quick Presets */}
        <div className="p-3.5 rounded-2xl border" style={{ background: 'var(--sheet-btn-bg)', borderColor: 'var(--card-border)' }}>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-1 text-rose-500">
              <ShieldAlert size={14} /> Stop Loss (₹)
            </label>
            {buyPrice > 0 && (
              <div className="flex items-center gap-1">
                {[-2, -5, -8, -10].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setStopLoss(String(Number((buyPrice * (1 + pct / 100)).toFixed(2))))}
                    className="text-[10px] px-1.5 py-0.5 rounded font-bold transition bg-rose-500/10 text-rose-500 hover:bg-rose-500/20"
                  >
                    {pct}%
                  </button>
                ))}
                {stopLoss && (
                  <button
                    type="button"
                    onClick={() => setStopLoss('')}
                    className="text-[10px] px-1.5 py-0.5 rounded text-[var(--text-muted)] hover:text-rose-400 font-semibold"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}
          </div>
          <input
            type="number"
            step="any"
            placeholder="e.g. 2850"
            value={stopLoss}
            onChange={(e) => setStopLoss(e.target.value)}
            style={inputStyle}
            className="w-full focus:ring-2 focus:ring-rose-500/50"
          />
          {slPercent && (
            <p className="text-[11px] mt-1 font-semibold text-rose-500">
              {slPercent}% from avg entry (₹{buyPrice})
            </p>
          )}
        </div>

        {/* Target Price Input & Quick Presets */}
        <div className="p-3.5 rounded-2xl border" style={{ background: 'var(--sheet-btn-bg)', borderColor: 'var(--card-border)' }}>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-1 text-emerald-500">
              <Target size={14} /> Target Price (₹)
            </label>
            {buyPrice > 0 && (
              <div className="flex items-center gap-1">
                {[5, 10, 15, 20].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setTargetPrice(String(Number((buyPrice * (1 + pct / 100)).toFixed(2))))}
                    className="text-[10px] px-1.5 py-0.5 rounded font-bold transition bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                  >
                    +{pct}%
                  </button>
                ))}
                {targetPrice && (
                  <button
                    type="button"
                    onClick={() => setTargetPrice('')}
                    className="text-[10px] px-1.5 py-0.5 rounded text-[var(--text-muted)] hover:text-emerald-400 font-semibold"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}
          </div>
          <input
            type="number"
            step="any"
            placeholder="e.g. 3300"
            value={targetPrice}
            onChange={(e) => setTargetPrice(e.target.value)}
            style={inputStyle}
            className="w-full focus:ring-2 focus:ring-emerald-500/50"
          />
          {tpPercent && (
            <p className="text-[11px] mt-1 font-semibold text-emerald-500">
              +{tpPercent}% from avg entry (₹{buyPrice})
            </p>
          )}
        </div>

        {/* Confidence & Badge */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Conviction Level
            </label>
            <select
              value={confidence}
              onChange={(e) => setConfidence(e.target.value)}
              style={selectStyle}
              className="w-full focus:ring-1 focus:ring-indigo-500"
            >
              {CONFIDENCE_OPTIONS.map((c) => (
                <option key={c} value={c} style={{ background: 'var(--sheet-bg)', color: 'var(--text)' }}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Trade Badge
            </label>
            <select
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
              style={selectStyle}
              className="w-full focus:ring-1 focus:ring-indigo-500"
            >
              <option value="Trade" style={{ background: 'var(--sheet-bg)', color: 'var(--text)' }}>Trade</option>
              <option value="Swing" style={{ background: 'var(--sheet-bg)', color: 'var(--text)' }}>Swing</option>
              <option value="Longterm" style={{ background: 'var(--sheet-bg)', color: 'var(--text)' }}>Longterm</option>
              <option value="None" style={{ background: 'var(--sheet-bg)', color: 'var(--text)' }}>No Badge</option>
            </select>
          </div>
        </div>

        {/* Sector */}
        <div>
          <label className="block mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Sector
          </label>
          <select
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            style={selectStyle}
            className="w-full focus:ring-1 focus:ring-indigo-500"
          >
            <option value="" style={{ background: 'var(--sheet-bg)', color: 'var(--text-muted)' }}>
              Select Sector
            </option>
            {SECTORS.map((s) => (
              <option key={s} value={s} style={{ background: 'var(--sheet-bg)', color: 'var(--text)' }}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full py-3 font-semibold transition"
            style={{ background: 'var(--sheet-btn-bg)', border: '1px solid var(--card-border)', color: 'var(--text-2)' }}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleUpdate}
            className="flex-1 rounded-full py-3 font-bold transition flex items-center justify-center gap-1.5 text-white"
            style={{
              background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
            }}
          >
            {loading ? 'Saving...' : (
              <>
                <Check size={16} /> Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}

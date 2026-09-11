import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePortfolio } from "../../context/PortfolioContext";
import Modal from "../ui/Modal";

const ACTIONS = {
  BUY: "BUY",
  UPDATE: "UPDATE",
  SELL: "SELL"
};

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
  "Media, Entertainment & Publication", "Textiles", "Diversified", "ETF"
];

export default function HoldingActionModal({ holding, isOpen, onClose }) {
  const navigate = useNavigate();
  const { buyMore, updateHolding, sellHolding, deleteHolding } = usePortfolio();
  const [action, setAction] = useState(ACTIONS.BUY);
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [sipEnabled, setSipEnabled] = useState(false);
  const [sipAmount, setSipAmount] = useState("");
  const [sipDay, setSipDay] = useState("");
  const [confidence, setConfidence] = useState("Medium");
  const [badge, setBadge] = useState("Trade");
  const [sector, setSector] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setAction(ACTIONS.BUY);
      setQuantity("");
      setPrice("");
      setSipEnabled(false);
      setSipAmount("");
      setSipDay("");
      setConfidence("Medium");
      setBadge("Trade");
      setSector("");
      setShowDeleteConfirm(false);
      setDeleting(false);
      setLoading(false);
      return;
    }
    if (!holding) return;

    // BUY should start blank
    setQuantity("");
    setPrice("");
    setSipEnabled(false);
    setSipAmount("");
    setSipDay("");
    setShowDeleteConfirm(false);
  }, [isOpen, holding]);

  useEffect(() => {
    if (!holding) return;
    setShowDeleteConfirm(false);
    switch (action) {
      case ACTIONS.BUY:
        setQuantity("");
        setPrice("");
        setSipEnabled(false);
        setSipAmount("");
        setSipDay("");
        break;
      case ACTIONS.UPDATE:
        setQuantity(String(holding.quantity));
        setPrice(
          String(
            holding.buyPrice ??
            holding.price
          )
        );
        setConfidence(holding.confidence || holding.confidenceLevel || "Medium");
        setBadge(holding.badge || holding.tradeType || holding.trade_type || "Trade");
        setSector(holding.sector || "");
        if (holding.assetType === "mutualFunds") {
          setSipEnabled(!!holding.sipEnabled);
          setSipAmount(holding.sipAmount ? String(holding.sipAmount) : "");
          setSipDay(holding.sipDay ? String(holding.sipDay) : "");
        }
        break;
      case ACTIONS.SELL:
        setQuantity("");
        setPrice("");
        setSipEnabled(false);
        setSipAmount("");
        setSipDay("");
        break;
    }
  }, [action, holding]);

  const qty = Number(quantity) || 0;
  const avg = Number(price) || 0;

  async function handleContinue() {
    let payload = null;
    try {
      setLoading(true);
      const sellPriceVal = avg > 0 ? avg : (holding.currentPrice || holding.buyPrice || 0);
      payload = {
        assetType: holding.assetType,
        ...(holding.assetId ? { assetId: holding.assetId } : {}),
        quantity: qty,
        price: action === ACTIONS.SELL ? sellPriceVal : avg
      };
      if (holding.assetType === "mutualFunds") {
        payload.name = holding.name;
        if (action === ACTIONS.UPDATE) {
          payload.sipEnabled = sipEnabled;
          payload.sipAmount = sipEnabled ? Number(sipAmount) : 0;
          payload.sipDay = sipEnabled ? Number(sipDay) : 0;
        }
      } else {
        payload.symbol = holding.symbol;
      }
      if (action === ACTIONS.UPDATE) {
        if (confidence) payload.confidence = confidence;
        if (holding.assetType !== "mutualFunds") {
          payload.badge = badge;
          payload.tradeType = badge;
        }
        if (sector) payload.sector = sector;
      }
      switch (action) {
        case ACTIONS.BUY:
          await buyMore(payload);
          break;
        case ACTIONS.UPDATE:
          console.log("Sending payload:", payload);
          await updateHolding(payload);
          break;
        case ACTIONS.SELL: {
          if (qty > holding.quantity) {
            throw new Error("Sell quantity exceeds current holding.");
          }
          const isFullySold = qty >= holding.quantity;
          await sellHolding(payload);
          setQuantity("");
          setPrice("");
          setSipEnabled(false);
          setSipAmount("");
          setSipDay("");
          onClose();
          if (isFullySold) {
            navigate('/portfolio', { replace: true });
          }
          return;
        }
      }
      setQuantity("");
      setPrice("");
      setSipEnabled(false);
      setSipAmount("");
      setSipDay("");
      onClose();
    } catch (err) {
      console.log("ERROR OBJECT:", err);
      console.log("PAYLOAD:", payload);

      alert(
        err.message ||
        JSON.stringify(err, null, 2)
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteHolding() {
    try {
      setDeleting(true);
      await deleteHolding({
        assetId: holding.assetId || holding.asset_id,
        assetType: holding.assetType,
        symbol: holding.symbol,
        name: holding.name
      });
      setShowDeleteConfirm(false);
      onClose();
      navigate('/portfolio', { replace: true });
    } catch (err) {
      console.error("Delete holding failed:", err);
      alert(err.message || "Failed to delete holding");
    } finally {
      setDeleting(false);
    }
  }

  const preview = useMemo(() => {
    if (!holding) {
      return null;
    }
    if (action === ACTIONS.BUY) {
      if (qty <= 0 || avg <= 0) {
        return null;
      }
      const totalQty = holding.quantity + qty;
      const newAverage = (holding.quantity * (holding.buyPrice ?? holding.price) + qty * avg) / totalQty;
      return { totalQty, newAverage };
    }
    if (action === ACTIONS.SELL) {
      const remaining = Math.max(holding.quantity - qty, 0);
      const effSellPrice = avg > 0 ? avg : (holding.currentPrice || holding.buyPrice || 0);
      const buyAvg = holding.buyPrice ?? holding.avgPrice ?? holding.price ?? 0;
      const realizedGain = qty > 0 && effSellPrice > 0 ? qty * (effSellPrice - buyAvg) : 0;
      const totalProceeds = qty > 0 ? qty * effSellPrice : 0;
      return { remaining, effSellPrice, realizedGain, totalProceeds };
    }
    if (action === ACTIONS.UPDATE) {
      return {
        quantity: qty,
        average: avg
      };
    }
    return null;
  }, [action, qty, avg, holding]);

  const inputStyle = {
    background: 'var(--input-bg)',
    border: '1px solid var(--input-border)',
    color: 'var(--text)',
    borderRadius: '9999px',
    padding: '0.75rem 1.25rem',
    outline: 'none',
    transition: 'all 0.2s',
    fontSize: '16px',
  };

  const selectStyle = {
    ...inputStyle,
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23888888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 1rem center',
    backgroundSize: '1.2rem',
    paddingRight: '2.5rem',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-4 sm:p-6">
        <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text)' }}>Manage Position</h2>

        {/* Action Tabs */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {[
            { id: ACTIONS.BUY, label: "Buy More", activeColor: 'var(--profit)', bg: 'rgba(34,197,94,0.12)' },
            { id: ACTIONS.UPDATE, label: "Update", activeColor: 'var(--emerald)', bg: 'rgba(16,185,129,0.12)' },
            { id: ACTIONS.SELL, label: "Sell", activeColor: 'var(--loss)', bg: 'rgba(239,68,68,0.12)' },
          ].map((tab) => {
            const isActive = action === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setAction(tab.id)}
                className="rounded-full py-3 font-semibold transition"
                style={{
                  background: isActive ? tab.bg : 'var(--sheet-btn-bg)',
                  border: `1.5px solid ${isActive ? tab.activeColor : 'var(--card-border)'}`,
                  color: isActive ? tab.activeColor : 'var(--text-2)',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Holding Info */}
        <div className="mb-5 flex flex-col gap-0.5">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Holding</p>
          <p className="text-lg font-bold" style={{ color: 'var(--text)' }}>{holding?.name}</p>
        </div>

        {/* Dynamic Form */}
        <div className="space-y-4">
          <div>
            <label className="block mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              {action === ACTIONS.SELL ? "Quantity To Sell" : "Quantity"}
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={action === ACTIONS.SELL ? "Quantity To Sell" : "Quantity"}
              style={inputStyle}
              className="w-full focus:ring-1 focus:ring-[var(--emerald)]"
            />
          </div>

          <div>
            <label className="block mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              {action === ACTIONS.SELL
                ? (holding?.assetType === "mutualFunds" ? "Selling NAV (₹)" : "Selling Price (₹)")
                : (holding?.assetType === "mutualFunds"
                    ? (action === ACTIONS.UPDATE ? "Avg NAV (₹)" : "Buy NAV (₹)")
                    : (action === ACTIONS.UPDATE ? "Average Price (₹)" : "Buy Price (₹)"))}
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder={
                action === ACTIONS.SELL
                  ? (holding?.assetType === "mutualFunds" ? "Selling NAV" : "Selling Price (₹)")
                  : (holding?.assetType === "mutualFunds"
                      ? (action === ACTIONS.UPDATE ? "Avg NAV" : "Buy NAV")
                      : (action === ACTIONS.UPDATE ? "Average Price" : "Buy Price"))
              }
              style={inputStyle}
              className="w-full focus:ring-1 focus:ring-[var(--emerald)]"
            />
          </div>

          {action === ACTIONS.UPDATE && (
            <>
              {/* Conviction & Badge for Stocks / ETFs */}
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
                    {CONFIDENCE_OPTIONS.map((item) => (
                      <option key={item} value={item} style={{ background: 'var(--sheet-bg)', color: 'var(--text)' }}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                {holding?.assetType !== "mutualFunds" ? (
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
                ) : (
                  <div>
                    <label className="block mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      Category
                    </label>
                    <input
                      type="text"
                      placeholder="Category"
                      value={holding?.category || "Mutual Fund"}
                      disabled
                      style={{ ...inputStyle, opacity: 0.6, cursor: 'not-allowed' }}
                      className="w-full"
                    />
                  </div>
                )}
              </div>

              {/* Sector Selection */}
              {holding?.assetType !== "mutualFunds" && (
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
                    <option value="" style={{ background: 'var(--sheet-bg)', color: 'var(--text-muted)' }}>
                      Select Sector
                    </option>
                    {SECTORS.map((item) => (
                      <option key={item} value={item} style={{ background: 'var(--sheet-bg)', color: 'var(--text)' }}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          {action === ACTIONS.UPDATE && holding?.assetType === "mutualFunds" && (
            <div className="flex flex-col gap-3 p-3 rounded-2xl" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
              <div className="flex items-center justify-between px-1">
                <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>SIP Enabled</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={sipEnabled} onChange={(e) => setSipEnabled(e.target.checked)} />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[var(--emerald)]"></div>
                </label>
              </div>
              {sipEnabled && (
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    placeholder="SIP Amount"
                    value={sipAmount}
                    onChange={(e) => setSipAmount(e.target.value)}
                    style={inputStyle}
                    className="w-full focus:ring-1 focus:ring-[var(--emerald)] text-sm px-3 py-2"
                  />
                  <input
                    type="number"
                    placeholder="SIP Day (1-30)"
                    value={sipDay}
                    onChange={(e) => setSipDay(e.target.value)}
                    min="1" max="30"
                    style={inputStyle}
                    className="w-full focus:ring-1 focus:ring-[var(--emerald)] text-sm px-3 py-2"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Preview Panel */}
        {preview && (
          <div
            className="mt-6 rounded-2xl p-4 space-y-1"
            style={{
              background: 'var(--input-bg)',
              border: '1px solid var(--card-border)',
              color: 'var(--text-2)',
            }}
          >
            {action === ACTIONS.BUY && (
              <>
                <p className="text-sm">New Quantity: <b style={{ color: 'var(--text)' }}>{preview.totalQty}</b></p>
                <p className="text-sm">New Average: <b style={{ color: 'var(--text)' }}>₹{preview.newAverage.toFixed(2)}</b></p>
              </>
            )}
            {action === ACTIONS.SELL && (
              <>
                <p className="text-sm">Remaining Quantity: <b style={{ color: 'var(--text)' }}>{preview.remaining}</b></p>
                {preview.totalProceeds > 0 && (
                  <p className="text-sm">Estimated Proceeds: <b style={{ color: 'var(--text)' }}>₹{preview.totalProceeds.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b></p>
                )}
                {preview.realizedGain !== 0 && (
                  <p className="text-sm">
                    Estimated Realized P&L: <b style={{ color: preview.realizedGain >= 0 ? 'var(--profit)' : 'var(--loss)' }}>
                      {preview.realizedGain >= 0 ? '+' : ''}₹{preview.realizedGain.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </b>
                  </p>
                )}
              </>
            )}
            {action === ACTIONS.UPDATE && (
              <>
                <p className="text-sm">Updated Quantity: <b style={{ color: 'var(--text)' }}>{preview.quantity}</b></p>
                <p className="text-sm">Updated Average: <b style={{ color: 'var(--text)' }}>₹{preview.average.toFixed(2)}</b></p>
              </>
            )}
          </div>
        )}

        {/* Delete Position Section in Update mode */}
        {action === ACTIONS.UPDATE && (
          showDeleteConfirm ? (
            <div
              className="mt-6 rounded-2xl p-4 space-y-3"
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
              }}
            >
              <div className="flex items-start gap-2.5">
                <svg className="w-5 h-5 text-[var(--loss)] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--loss)' }}>
                    Permanently Delete Position?
                  </p>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    This will remove all transaction history and data for <b style={{ color: 'var(--text)' }}>{holding?.name}</b>. This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="flex-1 py-2 px-3 rounded-full text-xs font-semibold transition hover:opacity-80"
                  style={{
                    background: 'var(--sheet-btn-bg)',
                    border: '1px solid var(--card-border)',
                    color: 'var(--text-2)',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteHolding}
                  disabled={deleting}
                  className="flex-1 py-2 px-3 rounded-full text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                  style={{
                    background: 'var(--loss)',
                  }}
                >
                  {deleting ? "Deleting..." : "Yes, Delete Position"}
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-5 pt-4 border-t" style={{ borderColor: 'var(--card-border)' }}>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full py-2.5 px-4 rounded-full text-xs font-semibold flex items-center justify-center gap-2 transition hover:opacity-80"
                style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  color: 'var(--loss)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Position
              </button>
            </div>
          )
        )}

        {/* Footer actions */}
        <div className="mt-8 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-full py-3 font-semibold transition hover:opacity-80"
            style={{
              background: 'var(--sheet-btn-bg)',
              border: '1px solid var(--card-border)',
              color: 'var(--text-2)',
            }}
          >
            Cancel
          </button>
          <button
            disabled={
              loading || 
              qty <= 0 || 
              (action !== ACTIONS.SELL && avg <= 0) ||
              (action === ACTIONS.UPDATE && holding?.assetType === "mutualFunds" && sipEnabled && (Number(sipAmount) <= 0 || Number(sipDay) < 1 || Number(sipDay) > 30))
            }
            onClick={handleContinue}
            className="flex-1 rounded-full py-3 font-bold text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: action === ACTIONS.BUY
                ? 'var(--profit)'
                : action === ACTIONS.UPDATE
                  ? 'var(--emerald)'
                  : 'var(--loss)',
              boxShadow: 'none',
            }}
          >
            {loading
              ? "Saving..."
              : action === ACTIONS.BUY
                ? "Buy More"
                : action === ACTIONS.UPDATE
                  ? "Update Position"
                  : "Sell Position"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
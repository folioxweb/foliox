import { useEffect, useRef, useState } from "react";
import { usePortfolio } from "../../context/PortfolioContext";
import Modal from "../ui/Modal";

const ASSET_TYPES = {
  STOCK: "stocks",
  ETF: "etfs",
  MF: "mutualFunds",
  FD: "fds",
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
  "Media, Entertainment & Publication", "Textiles", "Diversified"
];

/**
 * DateInput — custom date picker for iOS/Android PWA.
 * Shows a styled display (formatted date text + calendar icon).
 * An opacity-0 native <input type="date"> overlaid on top handles
 * taps and opens the system date picker — works on Safari/WebKit PWA.
 */
function DateInput({ label, value, onChange, disabled, style: inputStyle }) {
  const inputRef = useRef(null);

  function formatDisplay(dateStr) {
    if (!dateStr) return null;
    try {
      const [y, m, d] = dateStr.split('-');
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]} ${y}`;
    } catch { return dateStr; }
  }

  function openPicker() {
    if (disabled || !inputRef.current) return;
    try { inputRef.current.showPicker(); } catch { inputRef.current.focus(); }
  }

  return (
    <div className="flex-1 min-w-0">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
        {label}
      </p>
      <div
        onClick={openPicker}
        style={{
          ...inputStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '6px',
          borderRadius: '14px',
          position: 'relative',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          userSelect: 'none',
          WebkitUserSelect: 'none',
          padding: '0.65rem 0.9rem',
        }}
      >
        <span style={{
          color: value ? 'var(--text)' : 'var(--text-muted)',
          fontSize: '13px',
          lineHeight: 1.2,
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {value ? formatDisplay(value) : 'Select date'}
        </span>
        {/* Inline calendar SVG — always visible regardless of theme */}
        <svg
          width="15" height="15"
          viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.2"
          strokeLinecap="round" strokeLinejoin="round"
          style={{ color: 'var(--text-muted)', flexShrink: 0 }}
        >
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        {/* Invisible native date input — handles taps to open system picker */}
        <input
          ref={inputRef}
          type="date"
          value={value}
          onChange={onChange}
          disabled={disabled}
          tabIndex={-1}
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0,
            width: '100%',
            height: '100%',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        />
      </div>
    </div>
  );
}

export default function AddHoldingModal({ isOpen, onClose }) {
  const [assetType, setAssetType] = useState(ASSET_TYPES.STOCK);
  const { addHolding } = usePortfolio();
  const [loading, setLoading] = useState(false);
  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [confidence, setConfidence] = useState("");
  const [sector, setSector] = useState("");
  const [badge, setBadge] = useState("");
  const [fundCode, setFundCode] = useState("");
  const [mfApiCode, setMfApiCode] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [maturityDate, setMaturityDate] = useState("");

  const [sipEnabled, setSipEnabled] = useState(false);
  const [sipAmount, setSipAmount] = useState("");
  const [sipDay, setSipDay] = useState("");

  const qty = parseFloat(quantity);
  const avg = parseFloat(price);

  const isFormValid =
    assetType === ASSET_TYPES.STOCK
      ? symbol.trim() && name.trim() && qty > 0 && avg > 0 && sector && confidence && badge !== undefined
      : assetType === ASSET_TYPES.ETF
      ? symbol.trim() && name.trim() && qty > 0 && avg > 0 && confidence
      : assetType === ASSET_TYPES.MF
      ? name.trim() && qty > 0 && avg > 0 && fundCode.trim() && mfApiCode.trim() && confidence &&
        (!sipEnabled || (Number(sipAmount) > 0 && Number(sipDay) >= 1 && Number(sipDay) <= 30))
      : name.trim() && qty > 0 && Number(interestRate) > 0 && startDate && maturityDate;

  useEffect(() => {
    if (!isOpen) {
      setAssetType(ASSET_TYPES.STOCK);
      setSymbol("");
      setName("");
      setQuantity("");
      setPrice("");
      setConfidence("");
      setSector("");
      setBadge("");
      setFundCode("");
      setMfApiCode("");
      setInterestRate("");
      setStartDate("");
      setMaturityDate("");
      setSipEnabled(false);
      setSipAmount("");
      setSipDay("");
    }
  }, [isOpen]);

  async function handleSave() {
  console.log("1. handleSave called");

  try {
    setLoading(true);

    const payload = {
      assetType,
      quantity: Number(quantity),
      price: Number(price),
      confidence,
    };

    if (assetType === ASSET_TYPES.STOCK) {
      payload.symbol = symbol.trim();
      payload.name = name.trim();
      payload.sector = sector;
      payload.badge = badge;
    } else if (assetType === ASSET_TYPES.ETF) {
      payload.symbol = symbol.trim();
      payload.name = name.trim();
    } else if (assetType === ASSET_TYPES.MF) {
      payload.name = name.trim();
      payload.fundCode = fundCode.trim();
      payload.mfApiCode = mfApiCode.trim();
      payload.sipEnabled = sipEnabled;
      payload.sipAmount = sipEnabled ? Number(sipAmount) : 0;
      payload.sipDay = sipEnabled ? Number(sipDay) : 0;
    } else {
      payload.name = name.trim();
      payload.interestRate = Number(interestRate);
      payload.startDate = startDate;
      payload.maturityDate = maturityDate;
    }

    console.log("2. Payload:", payload);
    console.log("3. addHolding:", addHolding);

    await addHolding(payload);

    console.log("4. API completed");

    onClose();
  } catch (err) {
    console.error(err);
    alert(err.message || "Unable to add holding.");
  } finally {
    setLoading(false);
  }
}

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
    backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 1rem center',
    backgroundSize: '1.2rem',
    paddingRight: '2.5rem',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text)' }}>Add Asset</h2>

        {/* Dynamic Themeable Tabs */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {[
            { id: ASSET_TYPES.STOCK, label: "Stock" },
            { id: ASSET_TYPES.ETF, label: "ETF" },
            { id: ASSET_TYPES.MF, label: "MF" },
            { id: ASSET_TYPES.FD, label: "FD" },
          ].map((tab) => {
            const isActive = assetType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setAssetType(tab.id)}
                className="rounded-full py-3 font-semibold transition"
                style={{
                  background: isActive ? 'rgba(16,185,129,0.12)' : 'var(--sheet-btn-bg)',
                  border: `1.5px solid ${isActive ? 'var(--emerald)' : 'var(--card-border)'}`,
                  color: isActive ? 'var(--emerald)' : 'var(--text-2)',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="space-y-4">
          {assetType !== ASSET_TYPES.MF && assetType !== ASSET_TYPES.FD && (
            <input
              type="text"
              placeholder="Symbol (e.g. HDFCBANK)"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              style={inputStyle}
              className="w-full focus:ring-1 focus:ring-[var(--emerald)]"
            />
          )}

          <input
            type="text"
            placeholder={
              assetType === ASSET_TYPES.MF
                ? "Fund Name"
                : assetType === ASSET_TYPES.FD
                ? "Bank Name"
                : "Company Name"
            }
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
            className="w-full focus:ring-1 focus:ring-[var(--emerald)]"
          />

          {assetType === ASSET_TYPES.FD ? (
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                placeholder="Principal Amount"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                style={inputStyle}
                className="w-full focus:ring-1 focus:ring-[var(--emerald)]"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Interest Rate (%)"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                style={inputStyle}
                className="w-full focus:ring-1 focus:ring-[var(--emerald)]"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                placeholder="Quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                style={inputStyle}
                className="w-full focus:ring-1 focus:ring-[var(--emerald)]"
              />
              <input
                type="number"
                placeholder="Avg. Price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                style={inputStyle}
                className="w-full focus:ring-1 focus:ring-[var(--emerald)]"
              />
            </div>
          )}

          {assetType !== ASSET_TYPES.FD && (
            <select
              value={confidence}
              onChange={(e) => setConfidence(e.target.value)}
              style={{
                ...selectStyle,
                color: confidence ? 'var(--text)' : 'var(--text-muted)',
              }}
              className="w-full focus:ring-1 focus:ring-[var(--emerald)]"
            >
              <option value="" disabled style={{ background: 'var(--sheet-bg)', color: 'var(--text-muted)' }}>
                Conviction Level
              </option>
              {CONFIDENCE_OPTIONS.map((item) => (
                <option key={item} value={item} style={{ background: 'var(--sheet-bg)', color: 'var(--text)' }}>
                  {item}
                </option>
              ))}
            </select>
          )}

          {assetType === ASSET_TYPES.STOCK && (
            <>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                style={{
                  ...selectStyle,
                  color: sector ? 'var(--text)' : 'var(--text-muted)',
                }}
                className="w-full focus:ring-1 focus:ring-[var(--emerald)]"
              >
                <option value="" disabled style={{ background: 'var(--sheet-bg)', color: 'var(--text-muted)' }}>
                  Select Sector
                </option>
                {SECTORS.map((item) => (
                  <option key={item} value={item} style={{ background: 'var(--sheet-bg)', color: 'var(--text)' }}>
                    {item}
                  </option>
                ))}
              </select>

              <select
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                style={{
                  ...selectStyle,
                  color: badge ? 'var(--text)' : 'var(--text-muted)',
                }}
                className="w-full focus:ring-1 focus:ring-[var(--emerald)]"
              >
                <option value="" disabled style={{ background: 'var(--sheet-bg)', color: 'var(--text-muted)' }}>
                  Select Badge
                </option>
                <option value="Longterm" style={{ background: 'var(--sheet-bg)', color: 'var(--text)' }}>
                  Longterm
                </option>
                <option value="Trade" style={{ background: 'var(--sheet-bg)', color: 'var(--text)' }}>
                  Trade
                </option>
                <option value="None" style={{ background: 'var(--sheet-bg)', color: 'var(--text)' }}>
                  No Badge
                </option>
              </select>
            </>
          )}

          {assetType === ASSET_TYPES.MF && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Fund Code"
                  value={fundCode}
                  onChange={(e) => setFundCode(e.target.value)}
                  style={inputStyle}
                  className="w-full focus:ring-1 focus:ring-[var(--emerald)]"
                />
                <input
                  type="text"
                  placeholder="MFAPI Code"
                  value={mfApiCode}
                  onChange={(e) => setMfApiCode(e.target.value)}
                  style={inputStyle}
                  className="w-full focus:ring-1 focus:ring-[var(--emerald)]"
                />
              </div>
              <div className="flex flex-col gap-3 mt-1 p-3 rounded-2xl" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
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
            </>
          )}

          {assetType === ASSET_TYPES.FD && (
            <div className="flex gap-3">
              <DateInput
                label="Start Date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={inputStyle}
              />
              <DateInput
                label="Maturity Date"
                value={maturityDate}
                onChange={(e) => setMaturityDate(e.target.value)}
                style={inputStyle}
              />
            </div>
          )}
        </div>

        {/* Actions buttons */}
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
            disabled={loading || !isFormValid}
            onClick={handleSave}
            className="flex-1 rounded-full py-3 font-bold transition disabled:cursor-not-allowed"
            style={{
              background: isFormValid ? 'var(--emerald)' : 'var(--divider)',
              color: isFormValid ? '#ffffff' : 'var(--text-muted)',
              boxShadow: isFormValid ? '0 4px 12px rgba(16,185,129,0.2)' : 'none',
            }}
          >
            {loading ? "Adding..." : "Add Holding"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
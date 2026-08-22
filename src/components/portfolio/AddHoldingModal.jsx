import { useEffect, useRef, useState } from "react";
import { usePortfolio } from "../../context/PortfolioContext";
import Modal from "../ui/Modal";
import StockSearchInput from "../ui/StockSearchInput";
import { fetchLiveStockPrice } from "../../services/stockChartService";
import { RefreshCw, Zap, Sliders } from "lucide-react";

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
  "Media, Entertainment & Publication", "Textiles", "Diversified", "ETF"
];

/**
 * DateInput — custom date picker for iOS/Android PWA.
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
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const [livePrice, setLivePrice] = useState(null);
  const [isMarketPrice, setIsMarketPrice] = useState(true);

  const [symbol, setSymbol] = useState("");
  const [isin, setIsin] = useState("");
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [confidence, setConfidence] = useState("Medium");
  const [sector, setSector] = useState("");
  const [badge, setBadge] = useState("Trade");
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
      setIsin("");
      setQuantity("");
      setPrice("");
      setLivePrice(null);
      setIsMarketPrice(true);
      setConfidence("Medium");
      setSector("");
      setBadge("Trade");
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

  async function fetchPriceForInstrument(sym) {
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
      console.warn("Failed to fetch live price:", err);
    } finally {
      setFetchingPrice(false);
    }
  }

  function handleSelectInstrument(item) {
    setSymbol(item.symbol || "");
    setName(item.name || "");
    setIsin(item.isin || "");
    if (item.sector && SECTORS.includes(item.sector)) {
      setSector(item.sector);
    } else if (assetType === ASSET_TYPES.ETF) {
      setSector(item.sector || "ETF");
      setConfidence("High");
    }
    if (item.symbol) {
      fetchPriceForInstrument(item.symbol);
    }
  }

  async function handleSave() {
    try {
      setLoading(true);

      const payload = {
        assetType,
        quantity: Number(quantity),
        price: Number(price),
        confidence: confidence || "Medium",
      };

      if (assetType === ASSET_TYPES.STOCK) {
        payload.symbol = symbol.trim();
        payload.name = name.trim();
        payload.sector = sector;
        payload.badge = badge;
        payload.isin = isin;
      } else if (assetType === ASSET_TYPES.ETF) {
        payload.symbol = symbol.trim();
        payload.name = name.trim();
        payload.isin = isin;
        payload.sector = sector || "ETF";
        payload.badge = "Longterm";
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

      await addHolding(payload);
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
    borderRadius: '16px',
    padding: '0.75rem 1rem',
    outline: 'none',
    transition: 'all 0.2s',
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

  const totalInvestment = (qty > 0 && avg > 0) ? (qty * avg) : 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 space-y-4">
        <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Add to Real Portfolio</h2>

        {/* Dynamic Themeable Tabs */}
        <div className="grid grid-cols-4 gap-2">
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
                type="button"
                onClick={() => {
                  setAssetType(tab.id);
                  setSymbol("");
                  setName("");
                  setIsin("");
                  setLivePrice(null);
                }}
                className="rounded-full py-2.5 text-xs font-bold transition"
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

        {/* Stock & ETF Search Bar */}
        {(assetType === ASSET_TYPES.STOCK || assetType === ASSET_TYPES.ETF) && (
          <div>
            <label className="block mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Search {assetType === ASSET_TYPES.ETF ? "ETF" : "Stock"} (NSE Master)
            </label>
            <StockSearchInput
              onSelectStock={handleSelectInstrument}
              placeholder={assetType === ASSET_TYPES.ETF ? "Search ETF (e.g. NIFTYBEES, GOLDBEES)..." : "Search stock (e.g. AXISBANK, TCS)..."}
            />
          </div>
        )}

        {/* Selected Instrument Live Quote Card */}
        {symbol && (assetType === ASSET_TYPES.STOCK || assetType === ASSET_TYPES.ETF) && (
          <div className="p-3 rounded-2xl flex items-center justify-between" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-sm" style={{ color: 'var(--emerald)' }}>{symbol}</p>
                {fetchingPrice && (
                  <span className="text-[10px] text-amber-400 animate-pulse flex items-center gap-1">
                    <RefreshCw size={10} className="animate-spin" /> Fetching live market price...
                  </span>
                )}
              </div>
              <p className="text-xs truncate max-w-[200px]" style={{ color: 'var(--text)' }}>{name || symbol}</p>
            </div>
            {livePrice ? (
              <div className="text-right">
                <span className="text-xs font-extrabold block" style={{ color: 'var(--emerald)' }}>
                  ₹{livePrice.toLocaleString('en-IN')}
                </span>
                <span className="text-[9px] font-semibold uppercase text-emerald-400">Yahoo Live</span>
              </div>
            ) : isin ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ background: 'var(--card-bg)', color: 'var(--text-muted)' }}>
                ISIN: {isin}
              </span>
            ) : null}
          </div>
        )}

        {/* Order Mode Toggle for Stocks/ETFs: At Market Price vs Custom Price */}
        {(assetType === ASSET_TYPES.STOCK || assetType === ASSET_TYPES.ETF) && (
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
        )}

        {/* Manual Symbol & Name for non-stock or custom edits */}
        {assetType !== ASSET_TYPES.STOCK && assetType !== ASSET_TYPES.ETF && (
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
        )}

        {/* Quantity and Price Fields */}
        {assetType === ASSET_TYPES.FD ? (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Principal (₹)
              </label>
              <input
                type="number"
                placeholder="Principal Amount"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                style={inputStyle}
                className="w-full focus:ring-1 focus:ring-[var(--emerald)]"
              />
            </div>
            <div>
              <label className="block mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Interest Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="Rate (%)"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                style={inputStyle}
                className="w-full focus:ring-1 focus:ring-[var(--emerald)]"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Quantity
              </label>
              <input
                type="number"
                placeholder="Units / Quantity"
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
                {symbol && (assetType === ASSET_TYPES.STOCK || assetType === ASSET_TYPES.ETF) && (
                  <button
                    type="button"
                    onClick={() => fetchPriceForInstrument(symbol)}
                    className="text-[10px] font-bold text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <RefreshCw size={10} className={fetchingPrice ? 'animate-spin' : ''} /> Refetch
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type="number"
                  placeholder={isMarketPrice ? (fetchingPrice ? "Fetching..." : "Market Price") : "Price per unit"}
                  value={price}
                  onChange={(e) => {
                    setPrice(e.target.value);
                    if (isMarketPrice) setIsMarketPrice(false);
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
        )}

        {/* Conviction & Badge for Stocks & ETFs */}
        {(assetType === ASSET_TYPES.STOCK || assetType === ASSET_TYPES.ETF) && (
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

            {assetType === ASSET_TYPES.STOCK ? (
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
                  placeholder="e.g. Index, Commodity, Sector"
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  style={inputStyle}
                  className="w-full focus:ring-1 focus:ring-[var(--emerald)]"
                />
              </div>
            )}
          </div>
        )}

        {/* Sector Selection for Stocks */}
        {assetType === ASSET_TYPES.STOCK && (
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
              <option value="" disabled style={{ background: 'var(--sheet-bg)', color: 'var(--text-muted)' }}>
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

        {/* MF Specific Fields */}
        {assetType === ASSET_TYPES.MF && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Fund Code (e.g. MF:NIFTY_INDEX)"
                value={fundCode}
                onChange={(e) => setFundCode(e.target.value)}
                style={inputStyle}
                className="w-full focus:ring-1 focus:ring-[var(--emerald)]"
              />
              <input
                type="text"
                placeholder="MFAPI Code (e.g. 120716)"
                value={mfApiCode}
                onChange={(e) => setMfApiCode(e.target.value)}
                style={inputStyle}
                className="w-full focus:ring-1 focus:ring-[var(--emerald)]"
              />
            </div>
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
                    placeholder="SIP Amount (₹)"
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

        {/* FD Date Picker */}
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

        {/* Total Investment Summary */}
        {totalInvestment > 0 && (
          <div className="p-3 rounded-2xl flex items-center justify-between text-xs" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Total Investment Amount:</span>
            <span className="font-bold text-sm" style={{ color: 'var(--emerald)' }}>
              ₹{totalInvestment.toLocaleString('en-IN')}
            </span>
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-6 flex gap-3 pt-2">
          <button
            type="button"
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
            type="button"
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
import { useEffect, useState } from "react";
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

export default function AddHoldingModal({ isOpen, onClose }) {
  const [assetType, setAssetType] = useState(ASSET_TYPES.STOCK);
  const { addHolding } = usePortfolio();
  const [loading, setLoading] = useState(false);
  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [confidence, setConfidence] = useState("High");
  const [sector, setSector] = useState(SECTORS[0]);
  const [fundCode, setFundCode] = useState("");
  const [mfApiCode, setMfApiCode] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [maturityDate, setMaturityDate] = useState("");

  const qty = parseFloat(quantity);
  const avg = parseFloat(price);

  const isFormValid =
    assetType === ASSET_TYPES.STOCK
      ? symbol.trim() && name.trim() && qty > 0 && avg > 0 && sector
      : assetType === ASSET_TYPES.ETF
      ? symbol.trim() && name.trim() && qty > 0 && avg > 0
      : assetType === ASSET_TYPES.MF
      ? name.trim() && qty > 0 && avg > 0 && fundCode.trim() && mfApiCode.trim()
      : name.trim() && qty > 0 && Number(interestRate) > 0 && startDate && maturityDate;

  useEffect(() => {
    if (!isOpen) {
      setAssetType(ASSET_TYPES.STOCK);
      setSymbol("");
      setName("");
      setQuantity("");
      setPrice("");
      setConfidence("High");
      setSector(SECTORS[0]);
      setFundCode("");
      setMfApiCode("");
      setInterestRate("");
      setStartDate("");
      setMaturityDate("");
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
    } else if (assetType === ASSET_TYPES.ETF) {
      payload.symbol = symbol.trim();
      payload.name = name.trim();
    } else if (assetType === ASSET_TYPES.MF) {
      payload.name = name.trim();
      payload.fundCode = fundCode.trim();
      payload.mfApiCode = mfApiCode.trim();
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
              style={selectStyle}
              className="w-full focus:ring-1 focus:ring-[var(--emerald)]"
            >
              <option value="" disabled style={{ background: 'var(--sheet-bg)', color: 'var(--text)' }}>
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
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              style={selectStyle}
              className="w-full focus:ring-1 focus:ring-[var(--emerald)]"
            >
              {SECTORS.map((item) => (
                <option key={item} value={item} style={{ background: 'var(--sheet-bg)', color: 'var(--text)' }}>
                  {item}
                </option>
              ))}
            </select>
          )}

          {assetType === ASSET_TYPES.MF && (
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
          )}

          {assetType === ASSET_TYPES.FD && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={inputStyle}
                  className="w-full focus:ring-1 focus:ring-[var(--emerald)]"
                />
              </div>
              <div>
                <label className="block mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Maturity Date
                </label>
                <input
                  type="date"
                  value={maturityDate}
                  onChange={(e) => setMaturityDate(e.target.value)}
                  style={inputStyle}
                  className="w-full focus:ring-1 focus:ring-[var(--emerald)]"
                />
              </div>
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
            className="flex-1 rounded-full py-3 font-bold text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: isFormValid ? 'var(--emerald)' : 'var(--card-border)',
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
import { useState, useMemo, useEffect } from "react";
import { usePortfolio } from "../../context/PortfolioContext";
import Modal from "../ui/Modal";

const ACTIONS = {
  BUY: "BUY",
  UPDATE: "UPDATE",
  SELL: "SELL"
};

export default function HoldingActionModal({ holding, isOpen, onClose }) {
  const { buyMore, updateHolding, sellHolding } = usePortfolio();
  const [action, setAction] = useState(ACTIONS.BUY);
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setAction(ACTIONS.BUY);
      setQuantity("");
      setPrice("");
      setLoading(false);
      return;
    }
    if (!holding) return;

// BUY should start blank
setQuantity("");
setPrice("");
  }, [isOpen, holding]);

  useEffect(() => {
    if (!holding) return;
    switch (action) {
      case ACTIONS.BUY:
        setQuantity("");
        setPrice("");
        break;
      case ACTIONS.UPDATE:
        setQuantity(String(holding.quantity));
        setPrice(

          String(

            holding.buyPrice ??

            holding.price

          )

        );
        break;
      case ACTIONS.SELL:
        setQuantity("");
        setPrice("");
        break;
    }
  }, [action, holding]);

  const qty = Number(quantity) || 0;
  const avg = Number(price) || 0;

  async function handleContinue() {
    try {
      setLoading(true);
      const payload = {
        assetType: holding.assetType,
        quantity: qty,
        price: avg
      };
      if (holding.assetType === "mutualFunds") {
        payload.name = holding.name;
      } else {
        payload.symbol = holding.symbol;
      }
      switch (action) {
        case ACTIONS.BUY:
          await buyMore(payload);
          break;
        case ACTIONS.UPDATE:
          console.log("Sending payload:", payload);
          await updateHolding(payload);
          break;
        case ACTIONS.SELL:
          if (qty > holding.quantity) {
            throw new Error("Sell quantity exceeds current holding.");
          }
          await sellHolding(payload);
          break;
      }
      setQuantity("");
      setPrice("");
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
      return { remaining: Math.max(holding.quantity - qty, 0) };
    }
    if (

      action === ACTIONS.UPDATE

    ) {

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

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
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
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder={action === ACTIONS.SELL ? "Quantity To Sell" : "Quantity"}
            style={inputStyle}
            className="w-full focus:ring-1 focus:ring-[var(--emerald)]"
          />
          {action !== ACTIONS.SELL && (
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Average Price"
              style={inputStyle}
              className="w-full focus:ring-1 focus:ring-[var(--emerald)]"
            />
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
              <p className="text-sm">Remaining Quantity: <b style={{ color: 'var(--text)' }}>{preview.remaining}</b></p>
            )}
            {action === ACTIONS.UPDATE && (
              <>
                <p className="text-sm">Updated Quantity: <b style={{ color: 'var(--text)' }}>{preview.quantity}</b></p>
                <p className="text-sm">Updated Average: <b style={{ color: 'var(--text)' }}>₹{preview.average.toFixed(2)}</b></p>
              </>
            )}
          </div>
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
            disabled={loading || qty <= 0 || (action !== ACTIONS.SELL && avg <= 0)}
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
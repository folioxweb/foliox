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
    setQuantity(String(holding.quantity));
    setPrice(String(holding.buyPrice ?? holding.price));
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

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Manage Position</h2>
        {/* Tabs */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <button
            onClick={() => setAction(ACTIONS.BUY)}
            className={`rounded-full py-3 font-semibold transition ${action === ACTIONS.BUY
                ? "bg-green-500 text-white"
                : "bg-slate-800 text-slate-300"
              }`}
          >
            Buy More
          </button>
          <button
            onClick={() => setAction(ACTIONS.UPDATE)}
            className={`rounded-full py-3 font-semibold transition ${action === ACTIONS.UPDATE
                ? "bg-sky-600 text-white"
                : "bg-slate-800 text-slate-300"
              }`}
          >
            Update
          </button>
          <button
            onClick={() => setAction(ACTIONS.SELL)}
            className={`rounded-full py-3 font-semibold transition ${action === ACTIONS.SELL
                ? "bg-red-500 text-white"
                : "bg-slate-800 text-slate-300"
              }`}
          >
            Sell
          </button>
        </div>
        {/* Holding */}
        <div className="mb-5">
          <p className="text-sm text-slate-400">Holding</p>
          <p className="text-white font-semibold">{holding?.name}</p>
        </div>
        {/* Dynamic Form */}
        <div className="space-y-4">
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder={action === ACTIONS.SELL ? "Quantity To Sell" : "Quantity"}
            className="w-full rounded-full bg-slate-800 p-3 text-white"
          />
          {action !== ACTIONS.SELL && (
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Average Price"
              className="w-full rounded-full bg-slate-800 p-3 text-white"
            />
          )}
        </div>
        {/* Preview */}
        {preview && (
          <div className="mt-6 rounded-full bg-slate-800 p-4">
            {action === ACTIONS.BUY && (
              <>
                <p>New Quantity :<b> {preview.totalQty}</b></p>
                <p>New Average :<b> ₹{preview.newAverage.toFixed(2)}</b></p>
              </>
            )}
            {action === ACTIONS.SELL && (
              <p>Remaining Quantity :<b> {preview.remaining}</b></p>
            )}
            {action === ACTIONS.UPDATE && (

              <>

                <p>

                  Updated Quantity :

                  <b> {preview.quantity}</b>

                </p>

                <p>

                  Updated Average :

                  <b>

                    ₹{preview.average.toFixed(2)}

                  </b>

                </p>

              </>

            )}
          </div>
        )}
        {/* Footer */}
        <div className="mt-8 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-full bg-slate-700 py-3 text-white"
          >
            Cancel
          </button>
          <button
            disabled={loading || qty <= 0 || (action !== ACTIONS.SELL && avg <= 0)}
            onClick={handleContinue}
            className={`flex-1 rounded-full py-3 font-semibold text-white transition ${action === ACTIONS.BUY
                ? "bg-gradient-to-r from-green-500 to-green-400"
                : action === ACTIONS.UPDATE
                  ? "bg-gradient-to-r from-sky-600 to-sky-500"
                  : "bg-gradient-to-r from-red-600 to-red-500"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading
              ? "Saving..."
              : action === ACTIONS.BUY
                ? "Buy More"
                : action === ACTIONS.UPDATE
                  ? "Update Holding"
                  : "Sell Holding"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
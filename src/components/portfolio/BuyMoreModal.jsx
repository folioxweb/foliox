import { useState, useMemo } from 'react';
import Modal from '../ui/Modal';
import { api } from '../../services/apiClient';
import { usePortfolio } from '../../context/PortfolioContext';

export default function BuyMoreModal({ holding, isOpen, onClose }) {
  const { refreshAll } = usePortfolio();
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);

  const qty = Number(quantity) || 0;
  const buyPrice = Number(price) || 0;

  const preview = useMemo(() => {
    if (!holding) return null;
    if (qty <= 0 || buyPrice <= 0) return null;

    const oldQty = holding.quantity;
    const oldAvg = holding.buyPrice;
    const totalQty = oldQty + qty;
    const avg = (oldQty * oldAvg + qty * buyPrice) / totalQty;

    return { totalQty, avg };
  }, [holding, qty, buyPrice]);

  async function handleSave() {
    if (qty <= 0) {
      alert("Enter valid quantity.");
      return;
    }
    if (buyPrice <= 0) {
      alert("Enter valid purchase price.");
      return;
    }

    try {
      setLoading(true);
      await api.buyMore({
        assetType: "stocks",
        symbol: holding.symbol,
        quantity: qty,
        price: buyPrice
      });
      await refreshAll();
      setQuantity("");
      setPrice("");
      onClose();
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-4 sm:p-6">
        <h2 className="text-xl font-bold text-white mb-6">Buy More</h2>

        <div className="mb-4">
          <p className="text-gray-400 text-sm">Holding</p>
          <p className="text-white font-semibold">{holding?.name}</p>
        </div>

        <div className="space-y-4">
          <input
            type="number"
            placeholder="Quantity Purchased"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full rounded-xl bg-slate-800 p-3 text-white"
          />
          <input
            type="number"
            placeholder="Purchase Price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full rounded-xl bg-slate-800 p-3 text-white"
          />
        </div>

        {preview && (
          <div className="mt-6 rounded-xl bg-slate-800 p-4">
            <p>New Quantity : <b>{preview.totalQty}</b></p>
            <p>New Average : <b>₹{preview.avg.toFixed(2)}</b></p>
          </div>
        )}

        <div className="mt-8 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl bg-slate-700 py-3 text-white"
          >
            Cancel
          </button>
          <button
            disabled={loading}
            onClick={handleSave}
            className="flex-1 rounded-xl bg-emerald-500 py-3 text-white font-semibold"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
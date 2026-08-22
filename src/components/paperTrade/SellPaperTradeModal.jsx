import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { usePortfolio } from '../../context/PortfolioContext';

export default function SellPaperTradeModal({ holding, isOpen, onClose }) {
  const { sellPaperHolding } = usePortfolio();
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (holding) {
      setQuantity(holding.quantity ? String(holding.quantity) : '');
      setPrice(holding.currentPrice ? String(holding.currentPrice) : '');
    }
  }, [holding]);

  if (!holding) return null;

  const sellQty = Number(quantity);
  const sellPrice = Number(price);
  const isFormValid = sellQty > 0 && sellQty <= holding.quantity && sellPrice > 0;

  const estProceeds = sellQty * sellPrice;
  const estRealizedPnL = (sellPrice - holding.buyPrice) * sellQty;

  async function handleSell() {
    try {
      setLoading(true);
      await sellPaperHolding({
        assetId: holding.assetId,
        quantity: sellQty,
        price: sellPrice
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to sell paper holding');
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

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--divider)' }}>
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Sell Paper Stock</h2>
            <p className="text-xs font-semibold" style={{ color: 'var(--emerald)' }}>{holding.name} ({holding.symbol})</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase block" style={{ color: 'var(--text-muted)' }}>Holding Qty</span>
            <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>{holding.quantity}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Sell Quantity
            </label>
            <input
              type="number"
              placeholder={`Max ${holding.quantity}`}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              style={inputStyle}
              className="w-full focus:ring-1 focus:ring-[var(--emerald)]"
            />
          </div>

          <div>
            <label className="block mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Sell Price (₹)
            </label>
            <input
              type="number"
              placeholder={`Cur: ₹${holding.currentPrice}`}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              style={inputStyle}
              className="w-full focus:ring-1 focus:ring-[var(--emerald)]"
            />
          </div>
        </div>

        {sellQty > 0 && sellPrice > 0 && (
          <div className="p-3 rounded-2xl space-y-1 text-xs" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
            <div className="flex justify-between" style={{ color: 'var(--text-muted)' }}>
              <span>Estimated Proceeds:</span>
              <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>₹{estProceeds.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between" style={{ color: 'var(--text-muted)' }}>
              <span>Realized Gain/Loss:</span>
              <span className="font-bold text-sm" style={{ color: estRealizedPnL >= 0 ? 'var(--profit)' : 'var(--loss)' }}>
                {estRealizedPnL >= 0 ? '+' : ''}₹{estRealizedPnL.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        )}

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
            onClick={handleSell}
            className="flex-1 rounded-full py-3 font-bold transition disabled:cursor-not-allowed"
            style={{
              background: isFormValid ? 'var(--loss)' : 'var(--divider)',
              color: isFormValid ? '#ffffff' : 'var(--text-muted)',
              boxShadow: isFormValid ? '0 4px 12px rgba(239,68,68,0.2)' : 'none'
            }}
          >
            {loading ? 'Processing...' : 'Confirm Sell'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

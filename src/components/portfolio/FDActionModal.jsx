import { useState, useEffect } from "react";
import { usePortfolio } from "../../context/PortfolioContext";
import Modal from "../ui/Modal";

const ACTIONS = {
  UPDATE: "UPDATE",
  DELETE: "DELETE",
};

export default function FDActionModal({ holding, isOpen, onClose }) {
  const { updateFD, deleteFD } = usePortfolio();
  const [action, setAction] = useState(ACTIONS.UPDATE);
  const [bankName, setBankName] = useState("");
  const [principal, setPrincipal] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [maturityDate, setMaturityDate] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setAction(ACTIONS.UPDATE);
      setBankName("");
      setPrincipal("");
      setInterestRate("");
      setStartDate("");
      setMaturityDate("");
      setLoading(false);
      return;
    }
    if (!holding) return;

    setBankName(holding.name);
    setPrincipal(String(holding.principal));
    setInterestRate(String(holding.interestRate));
    setStartDate(holding.startDate?.substring(0, 10));
    setMaturityDate(holding.maturityDate?.substring(0, 10));
  }, [isOpen, holding]);

  const principalValue = Number(principal);
  const rate = Number(interestRate);

  async function handleContinue() {
    try {
      setLoading(true);
      if (action === ACTIONS.UPDATE) {
        await updateFD({
          srNo: holding.srNo,
          bankName,
          principal: principalValue,
          interestRate: rate,
          startDate,
          maturityDate,
        });
      } else {
        await deleteFD({
          srNo: holding.srNo,
        });
      }
      onClose();
    } catch (err) {
      alert(err.message || "An error occurred.");
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

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text)' }}>Manage Fixed Deposit</h2>

        {/* Action Tabs */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          {[
            { id: ACTIONS.UPDATE, label: "Update", activeColor: 'var(--emerald)', bg: 'rgba(16,185,129,0.12)' },
            { id: ACTIONS.DELETE, label: "Close FD", activeColor: 'var(--loss)', bg: 'rgba(239,68,68,0.12)' },
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

        {/* Form Inputs */}
        <div className="space-y-4">
          <input
            type="text"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            placeholder="Bank Name"
            style={inputStyle}
            className="w-full focus:ring-1 focus:ring-[var(--emerald)]"
            disabled={action === ACTIONS.DELETE}
          />
          <input
            type="number"
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
            placeholder="Principal"
            style={inputStyle}
            className="w-full focus:ring-1 focus:ring-[var(--emerald)]"
            disabled={action === ACTIONS.DELETE}
          />
          <input
            type="number"
            value={interestRate}
            onChange={(e) => setInterestRate(e.target.value)}
            placeholder="Interest Rate"
            style={inputStyle}
            className="w-full focus:ring-1 focus:ring-[var(--emerald)]"
            disabled={action === ACTIONS.DELETE}
          />
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
              disabled={action === ACTIONS.DELETE}
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
              disabled={action === ACTIONS.DELETE}
            />
          </div>
        </div>

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
              (action === ACTIONS.UPDATE &&
                (!bankName || principalValue <= 0 || rate <= 0 || !startDate || !maturityDate))
            }
            onClick={handleContinue}
            className="flex-1 rounded-full py-3 font-bold text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: action === ACTIONS.UPDATE ? 'var(--emerald)' : 'var(--loss)',
              boxShadow: 'none',
            }}
          >
            {loading
              ? "Saving..."
              : action === ACTIONS.UPDATE
              ? "Update FD"
              : "Delete FD"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
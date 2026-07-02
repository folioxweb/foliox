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

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Manage Fixed Deposit</h2>

        {/* Action Tabs */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          <button
            onClick={() => setAction(ACTIONS.UPDATE)}
            className={`rounded-full py-3 font-semibold transition ${
              action === ACTIONS.UPDATE
                ? "bg-sky-600 text-white"
                : "bg-slate-800 text-slate-300"
            }`}
          >
            Update
          </button>
          <button
            onClick={() => setAction(ACTIONS.DELETE)}
            className={`rounded-full py-3 font-semibold transition ${
              action === ACTIONS.DELETE
                ? "bg-red-600 text-white"
                : "bg-slate-800 text-slate-300"
            }`}
          >
            Close FD
          </button>
        </div>

        {/* Holding Info */}
        <div className="mb-5">
          <p className="text-sm text-slate-400">Holding</p>
          <p className="text-white font-semibold">{holding?.name}</p>
        </div>

        {/* Form Inputs */}
        <div className="space-y-4">
          <input
            type="text"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            placeholder="Bank Name"
            className="w-full rounded-full bg-slate-800 p-3 text-white"
            disabled={action === ACTIONS.DELETE}
          />
          <input
            type="number"
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
            placeholder="Principal"
            className="w-full rounded-full bg-slate-800 p-3 text-white"
            disabled={action === ACTIONS.DELETE}
          />
          <input
            type="number"
            value={interestRate}
            onChange={(e) => setInterestRate(e.target.value)}
            placeholder="Interest Rate"
            className="w-full rounded-full bg-slate-800 p-3 text-white"
            disabled={action === ACTIONS.DELETE}
          />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-full bg-slate-800 p-3 text-white"
            disabled={action === ACTIONS.DELETE}
          />
          <input
            type="date"
            value={maturityDate}
            onChange={(e) => setMaturityDate(e.target.value)}
            className="w-full rounded-full bg-slate-800 p-3 text-white"
            disabled={action === ACTIONS.DELETE}
          />
        </div>

        {/* Footer */}
        <div className="mt-8 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-full bg-slate-700 py-3 text-white"
          >
            Cancel
          </button>
          <button
            disabled={
  loading ||
  (
    action === ACTIONS.UPDATE &&
    (
      !bankName ||
      principalValue <= 0 ||
      rate <= 0 ||
      !startDate ||
      !maturityDate
    )
  )
}
            onClick={handleContinue}
            className={`flex-1 rounded-full py-3 font-semibold text-white transition ${
              action === ACTIONS.UPDATE
                ? "bg-gradient-to-r from-sky-600 to-sky-500"
                : "bg-gradient-to-r from-red-600 to-red-500"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
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
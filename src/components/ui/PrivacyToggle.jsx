import { Eye, EyeOff } from 'lucide-react';
import { usePrivacy } from '../../context/PrivacyContext';

export default function PrivacyToggle() {
  const { isPrivacyMode, togglePrivacyMode } = usePrivacy();

  return (
    <button
      onClick={togglePrivacyMode}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-800/70 text-slate-300 transition-colors hover:bg-slate-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
      aria-label={isPrivacyMode ? "Disable privacy mode" : "Enable privacy mode"}
    >
      {isPrivacyMode ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  );
}

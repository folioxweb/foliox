import { Eye, EyeOff } from 'lucide-react';
import { usePrivacy } from '../../context/PrivacyContext';

export default function PrivacyToggle() {
  const { isPrivacyMode, togglePrivacyMode } = usePrivacy();

  return (
    <button
      onClick={togglePrivacyMode}
      className="flex h-9 w-9 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--emerald)]"
      style={{
        border: '1px solid var(--card-border)',
        background: 'var(--card-bg)',
        color: 'var(--text-2)',
      }}
      aria-label={isPrivacyMode ? 'Disable privacy mode' : 'Enable privacy mode'}
    >
      {isPrivacyMode ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  );
}

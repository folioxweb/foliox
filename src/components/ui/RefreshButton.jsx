import { useState } from 'react';
import { RefreshCw } from 'lucide-react';

/** A compact, accessible manual refresh control for page headers. */
export default function RefreshButton({ onRefresh, label = 'Refresh data' }) {
  const [refreshing, setRefreshing] = useState(false);

  async function handleClick() {
    if (refreshing || !onRefresh) return;

    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={refreshing}
      aria-label={refreshing ? 'Refreshing data' : label}
      title={label}
      className="flex h-9 w-9 items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--emerald)]"
      style={{
        border: '1px solid var(--card-border)',
        background: 'var(--card-bg)',
        color: 'var(--text-2)',
      }}
    >
      <RefreshCw size={17} className={refreshing ? 'animate-spin' : ''} aria-hidden="true" />
    </button>
  );
}

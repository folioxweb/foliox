/**
 * Application Version & Changelog Configuration
 * Single source of truth for FolioX versioning, build metadata, and release notes.
 */

export const APP_VERSION = '2.2.0';
export const RELEASE_CODENAME = 'Tradebook & Tax Intelligence';
export const RELEASE_DATE = 'September 2026';
export const BUILD_TIMESTAMP = typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : '12 Sept 2026';

export const IS_UAT =
  import.meta.env.MODE === 'uat' ||
  (typeof window !== 'undefined' && (
    window.location.pathname.includes('/uat') ||
    window.location.href.includes('/uat')
  ));
export const ENVIRONMENT_LABEL = IS_UAT ? 'UAT' : 'Production';

export const STORAGE_SEEN_VERSION_KEY = 'foliox_seen_version';

/**
 * Current release highlights displayed in the What's New modal
 */
export const CURRENT_RELEASE = {
  version: APP_VERSION,
  codename: RELEASE_CODENAME,
  date: RELEASE_DATE,
  features: [
    {
      id: 'tradebook-ledger',
      badge: 'NEW',
      badgeColor: 'emerald',
      icon: 'Receipt',
      title: 'Institutional-Grade Tradebook',
      description:
        'A dedicated master ledger on your Portfolio page tracking all executed BUY and SELL trades, execution prices, cost basis, realized gains, turnover, and 1-click CSV export.'
    },
    {
      id: 'tax-estimator',
      badge: 'NEW',
      badgeColor: 'emerald',
      icon: 'Calculator',
      title: 'Indian Capital Gains Tax Estimator',
      description:
        'A dedicated tax planning screen in Settings built for Budget 2024-25: STCG (@ 20%) & LTCG (@ 12.5%) calculations with annual ₹1,25,000 tax-free exemption tracking.'
    },
    {
      id: 'tax-harvesting-advisor',
      badge: 'NEW',
      badgeColor: 'amber',
      icon: 'ShieldCheck',
      title: 'Tax Harvesting & LTCG Transition Advisor',
      description:
        'Proactive alerts for open lots turning from STCG to LTCG within 60 days (saving 7.5% in tax), plus unharvested tax-free gains and loss-harvesting suggestions.'
    },
    {
      id: 'mf-lookthrough',
      badge: 'IMPROVED',
      badgeColor: 'sky',
      icon: 'PieChart',
      title: 'Mutual Fund Constituents & Sector Breakdown',
      description:
        'Deep dive into mutual fund underlying stock constituents and sector weights with live indirect rupee exposure calculations.'
    },
    {
      id: 'holding-trade-history',
      badge: 'ENHANCED',
      badgeColor: 'emerald',
      icon: 'TrendingUp',
      title: 'Holding-Level Order History',
      description:
        'View complete historical order timelines directly inside each stock or mutual fund detail screen.'
    }
  ]
};

/**
 * Checks if the user has already viewed the What's New popup for the current release.
 */
export function hasSeenCurrentVersion(user) {
  try {
    const localSeen = localStorage.getItem(STORAGE_SEEN_VERSION_KEY);
    if (localSeen === APP_VERSION) return true;

    const userMetadataSeen = user?.user_metadata?.last_seen_version;
    if (userMetadataSeen === APP_VERSION) {
      localStorage.setItem(STORAGE_SEEN_VERSION_KEY, APP_VERSION);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Marks the current release as seen both locally and in user metadata.
 */
export async function markCurrentVersionAsSeen(user, updateAlertPreferences) {
  try {
    localStorage.setItem(STORAGE_SEEN_VERSION_KEY, APP_VERSION);
  } catch {
    // ignore storage quota errors
  }
}

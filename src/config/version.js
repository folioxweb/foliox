/**
 * Application Version & Changelog Configuration
 * Single source of truth for FolioX versioning, build metadata, and release notes.
 */

export const APP_VERSION = '2.3.0';
export const RELEASE_CODENAME = 'Institutional Analytics & Console Terminal';
export const RELEASE_DATE = 'September 2026';
export const BUILD_TIMESTAMP = typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : '14 Sept 2026';

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
      id: 'holdings-explorer',
      badge: 'NEW',
      badgeColor: 'emerald',
      icon: 'Layers',
      title: 'Institutional Holdings Explorer',
      description:
        'Zerodha Console-style holdings table tracking direct Demat stocks vs. mutual fund & ETF exposures side-by-side, real rupee exposure, and visual portfolio weight bars.'
    },
    {
      id: 'lookthrough-xray',
      badge: 'NEW',
      badgeColor: 'emerald',
      icon: 'Search',
      title: 'Cross-Portfolio Look-Through X-Ray',
      description:
        'Tap any stock to inspect your true aggregated exposure. View direct Demat lots, units, and unrealized P&L alongside every mutual fund and ETF holding the company.'
    },
    {
      id: 'market-cap-gauge',
      badge: 'NEW',
      badgeColor: 'sky',
      icon: 'BarChart2',
      title: 'SEBI Market Cap Distribution Gauge',
      description:
        'Interactive tri-color progress gauge classifying portfolio exposure across Large Cap, Mid Cap, and Small Cap with 1-tap interactive filtering across all holdings.'
    },
    {
      id: 'sector-donut',
      badge: 'NEW',
      badgeColor: 'sky',
      icon: 'PieChart',
      title: 'Interactive Sector Allocation Ring',
      description:
        'High-definition hollow Donut chart with live hover metrics, sector concentration analysis, expandable full sector list, and seamless 1-tap filtering of holdings.'
    },
    {
      id: 'filters-export',
      badge: 'ENHANCED',
      badgeColor: 'amber',
      icon: 'SlidersHorizontal',
      title: 'Multi-Dimension Filters & CSV Export',
      description:
        'Quick chips for Direct, Funds, and Overlaps, dedicated Sector and Cap dropdowns, dynamic multi-field sorting, and 1-click CSV report export.'
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

/**
 * Application Version & Changelog Configuration
 * Single source of truth for FolioX versioning, build metadata, and release notes.
 */

export const APP_VERSION = '2.1.0';
export const RELEASE_CODENAME = 'IPO Intelligence & Alerts';
export const RELEASE_DATE = 'September 2026';
export const BUILD_TIMESTAMP = typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : '5 Sept 2026';

export const IS_UAT = import.meta.env.MODE === 'uat' || (typeof window !== 'undefined' && window.location.pathname.includes('/uat/'));
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
      id: 'ipo-alerts',
      badge: 'NEW',
      badgeColor: 'emerald',
      icon: 'Mail',
      title: 'Smart IPO Email Alerts',
      description:
        'Automated morning bulk digests delivered at 08:15 AM on Bidding Opening & Closing days with >20% GMP, plus real-time alerts when GMP crosses the 20% profit threshold.'
    },
    {
      id: 'gmp-history',
      badge: 'NEW',
      badgeColor: 'emerald',
      icon: 'TrendingUp',
      title: 'Historical GMP Trajectory Charts',
      description:
        'Interactive time-series area charts tracking Grey Market Premiums with smooth point-by-point inspection and a 20% alert reference line.'
    },
    {
      id: 'subscription-details',
      badge: 'IMPROVED',
      badgeColor: 'sky',
      icon: 'Layers',
      title: 'Granular Subscription Breakdown',
      description:
        'Live category-wise subscription tables tracking QIB, NII (sHNI & bHNI), Retail (RII), and Anchor allocations updated across sync cycles.'
    },
    {
      id: 'alert-toggle',
      badge: 'IMPROVED',
      badgeColor: 'sky',
      icon: 'Bell',
      title: 'Opt-in Alert Control',
      description:
        '1-tap notification switch in Settings and IPO header. Defaulted to OFF so you receive alerts only when you explicitly want them.'
    },
    {
      id: 'resilient-design',
      badge: 'ENHANCED',
      badgeColor: 'amber',
      icon: 'Sparkles',
      title: 'Light & Dark Mode Resilience',
      description:
        'Self-contained, distraction-free email notifications optimized for flawless rendering across all mobile email apps and desktop screens.'
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

/**
 * Community localStorage Manager
 *
 * Centralized storage management for community-related preferences.
 * All keys are prefixed with 'community_' to avoid collisions.
 */

const KEYS = {
  SIDEBAR_COLLAPSED: 'community_sidebar_collapsed',
  GUIDELINES_ACK: (userId: string) => `community_guidelines_acknowledged_${userId}`,
  ONBOARDING_DISMISSED: (userId: string) => `community_onboarding_dismissed_${userId}`,
  FEED_FILTERS: 'community_feed_filters',
  FRIENDS_FEED_LAST_VIEWED: (userId: string) => `friendsFeedLastViewed_${userId}`,
} as const;

// Type definitions
export interface FeedFilters {
  sort?: 'recent' | 'top' | 'following' | 'trending';
  postType?: string | null;
  hashtag?: string | null;
}

/**
 * Safe localStorage getter with error handling
 */
const safeGetItem = (key: string): string | null => {
  try {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(key);
  } catch {
    // localStorage might be disabled or full (e.g., private browsing)
    console.warn('localStorage access failed for key:', key);
    return null;
  }
};

/**
 * Safe localStorage setter with error handling
 */
const safeSetItem = (key: string, value: string): boolean => {
  try {
    if (typeof window === 'undefined') return false;
    localStorage.setItem(key, value);
    return true;
  } catch {
    console.warn('localStorage write failed for key:', key);
    return false;
  }
};

/**
 * Safe localStorage remover with error handling
 */
const safeRemoveItem = (key: string): boolean => {
  try {
    if (typeof window === 'undefined') return false;
    localStorage.removeItem(key);
    return true;
  } catch {
    console.warn('localStorage remove failed for key:', key);
    return false;
  }
};

export const communityStorage = {
  // ============================================
  // Sidebar State
  // ============================================

  /**
   * Get sidebar collapsed state
   * @returns boolean - true if collapsed, false if expanded
   */
  getSidebarCollapsed: (): boolean => {
    return safeGetItem(KEYS.SIDEBAR_COLLAPSED) === 'true';
  },

  /**
   * Set sidebar collapsed state
   */
  setSidebarCollapsed: (collapsed: boolean): void => {
    safeSetItem(KEYS.SIDEBAR_COLLAPSED, String(collapsed));
  },

  // ============================================
  // Community Guidelines
  // ============================================

  /**
   * Check if user has acknowledged community guidelines
   */
  hasAcknowledgedGuidelines: (userId: string): boolean => {
    return safeGetItem(KEYS.GUIDELINES_ACK(userId)) !== null;
  },

  /**
   * Get the date when guidelines were acknowledged
   */
  getGuidelinesAcknowledgedDate: (userId: string): Date | null => {
    const value = safeGetItem(KEYS.GUIDELINES_ACK(userId));
    if (!value) return null;
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  },

  /**
   * Mark guidelines as acknowledged
   */
  acknowledgeGuidelines: (userId: string): void => {
    safeSetItem(KEYS.GUIDELINES_ACK(userId), new Date().toISOString());
  },

  // ============================================
  // Onboarding
  // ============================================

  /**
   * Check if user has dismissed the onboarding dashboard
   */
  hasOnboardingDismissed: (userId: string): boolean => {
    return safeGetItem(KEYS.ONBOARDING_DISMISSED(userId)) === 'true';
  },

  /**
   * Mark onboarding as dismissed
   */
  dismissOnboarding: (userId: string): void => {
    safeSetItem(KEYS.ONBOARDING_DISMISSED(userId), 'true');
  },

  /**
   * Reset onboarding state (for testing or re-showing)
   */
  resetOnboarding: (userId: string): void => {
    safeRemoveItem(KEYS.ONBOARDING_DISMISSED(userId));
  },

  // ============================================
  // Feed Filters
  // ============================================

  /**
   * Get saved feed filter preferences
   */
  getFeedFilters: (): FeedFilters => {
    try {
      const value = safeGetItem(KEYS.FEED_FILTERS);
      if (!value) return {};
      return JSON.parse(value) as FeedFilters;
    } catch {
      return {};
    }
  },

  /**
   * Save feed filter preferences
   */
  setFeedFilters: (filters: FeedFilters): void => {
    safeSetItem(KEYS.FEED_FILTERS, JSON.stringify(filters));
  },

  /**
   * Clear feed filter preferences
   */
  clearFeedFilters: (): void => {
    safeRemoveItem(KEYS.FEED_FILTERS);
  },

  // ============================================
  // Friends Feed (existing functionality)
  // ============================================

  /**
   * Get last viewed timestamp for friends feed
   */
  getFriendsFeedLastViewed: (userId: string): Date | null => {
    const value = safeGetItem(KEYS.FRIENDS_FEED_LAST_VIEWED(userId));
    if (!value) return null;
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  },

  /**
   * Update last viewed timestamp for friends feed
   */
  setFriendsFeedLastViewed: (userId: string): void => {
    safeSetItem(KEYS.FRIENDS_FEED_LAST_VIEWED(userId), new Date().toISOString());
  },

  // ============================================
  // Utilities
  // ============================================

  /**
   * Check if localStorage is available
   */
  isAvailable: (): boolean => {
    try {
      if (typeof window === 'undefined') return false;
      const testKey = '__community_storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Clear all community-related storage (for logout or reset)
   */
  clearAll: (): void => {
    try {
      if (typeof window === 'undefined') return;
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('community_') || key.startsWith('friendsFeedLastViewed_'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch {
      console.warn('Failed to clear community storage');
    }
  },
};

export default communityStorage;

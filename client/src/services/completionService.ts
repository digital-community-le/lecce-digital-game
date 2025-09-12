import { getStoredToken } from './authService';
import { gameStorage } from '@/lib/storage';
import { handleGameCompletion } from './devfestApiServiceFactory';
import gameData from '@/assets/game-data.json';

// Import to check test mode flag from localStorage/URL params
function isTestMode(): boolean {
  // Check URL params first
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('test') === '1') return true;

  // Check localStorage for persisted test flag
  try {
    const storedGame = localStorage.getItem('lecce-digital-game');
    if (storedGame) {
      const parsed = JSON.parse(storedGame);
      return !!parsed.test;
    }
  } catch (e) {
    // ignore parsing errors
  }

  return false;
}

type SyncQueueItem = {
  id: string;
  url: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'GET';
  headers: Record<string, string>;
  body?: any;
  attempts?: number;
  lastAttempt?: string | null;
};


/**
 * Generic helper to enqueue a network operation for offline sync.
 * Returns the generated queue id.
 */
export function queueRequest(item: Omit<SyncQueueItem, 'id' | 'attempts' | 'lastAttempt'>): string {
  const full: SyncQueueItem = {
    ...item,
    id: `sync_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    attempts: 0,
    lastAttempt: null,
  };

  gameStorage.addToSyncQueue(full);
  return full.id;
}

/**
 * Submit game completion to DevFest API and get the official badge
 * This is the new primary completion method using the real DevFest API
 * 
 * Implements persistence logic:
 * - If submission was already successful, returns cached result
 * - If submission failed previously, retries the API call
 * - Saves the result in game progress for future reference
 */
export async function submitGameCompletion(): Promise<{
  success: boolean;
  badge?: any;
  error?: string;
}> {
  const testMode = isTestMode();

  if (testMode) {
    console.log('🧪 TEST MODE - Game completion submission');
  }

  // Get current game progress to check submission status
  const currentProgress = gameStorage.getProgress(getCurrentUserId());

  if (!currentProgress) {
    console.error('❌ Game progress not found');
    return {
      success: false,
      error: 'Game progress not found'
    };
  }

  // Check if API submission was already successful
  if (currentProgress.devfestApiSubmission?.success) {
    console.log('✅ Game completion already submitted successfully, returning cached result');
    return {
      success: true,
      badge: currentProgress.devfestApiSubmission.badge
    };
  }

  // Previous submission failed or never attempted, try (again)
  if (currentProgress.devfestApiSubmission?.success === false) {
    console.log('🔄 Previous API submission failed, retrying...');
  } else {
    console.log('🚀 First-time API submission...');
  }

  try {
    const result = await handleGameCompletion();

    // Update game progress with submission result
    const updatedProgress = {
      ...currentProgress,
      devfestApiSubmission: {
        success: result.success,
        submittedAt: new Date().toISOString(),
        ...(result.badge && { badge: result.badge }),
        ...(result.error && { error: result.error }),
      },
      lastUpdated: new Date().toISOString(),
    };

    gameStorage.saveProgress(updatedProgress);

    if (result.success && result.badge) {
      console.log('🏆 Game completion successful! Badge received:', result.badge);
    } else {
      console.log('❌ Game completion failed, will retry on next attempt:', result.error);
    }

    return result;
  } catch (error) {
    console.error('💥 Game completion failed:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Update game progress with failed submission
    const updatedProgress = {
      ...currentProgress,
      devfestApiSubmission: {
        success: false,
        submittedAt: new Date().toISOString(),
        error: errorMessage,
      },
      lastUpdated: new Date().toISOString(),
    };

    gameStorage.saveProgress(updatedProgress);

    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Helper function to get current user ID from stored profile
 */
function getCurrentUserId(): string {
  const lastProfile = gameStorage.getLastProfile();
  return lastProfile?.userId || 'anonymous';
}

/**
 * Get the DevFest badge information from stored game progress
 * Returns null if no successful submission or badge data is found
 * 
 * @param userId - Optional user ID, defaults to current user
 * @returns Badge information or null
 */
export function getDevFestBadge(userId?: string): any | null {
  const targetUserId = userId || getCurrentUserId();
  const progress = gameStorage.getProgress(targetUserId);

  if (!progress?.devfestApiSubmission?.success) {
    return null;
  }

  const badge = progress.devfestApiSubmission.badge;

  // Handle case where badge is an array (API returns array) or single object
  if (Array.isArray(badge) && badge.length > 0) {
    return badge[0]; // Return first badge from array
  }

  return badge || null;
}

/**
 * Check if DevFest API submission was successful
 * 
 * @param userId - Optional user ID, defaults to current user
 * @returns True if submission was successful, false otherwise
 */
export function isDevFestSubmissionSuccessful(userId?: string): boolean {
  const targetUserId = userId || getCurrentUserId();
  const progress = gameStorage.getProgress(targetUserId);

  return progress?.devfestApiSubmission?.success === true;
}

/**
 * Get the full DevFest submission status and data
 * Useful for debugging and detailed UI information
 * 
 * @param userId - Optional user ID, defaults to current user
 * @returns DevFest submission data or null
 */
export function getDevFestSubmissionStatus(userId?: string): {
  success: boolean;
  submittedAt: string;
  badge?: any;
  error?: string;
} | null {
  const targetUserId = userId || getCurrentUserId();
  const progress = gameStorage.getProgress(targetUserId);

  return progress?.devfestApiSubmission || null;
}

/**
 * Queue a full-game completion payload for retry. 
 * DEPRECATED: Use submitGameCompletion() for DevFest API integration
 * Kept for backwards compatibility with any existing queue items
 */
export function postCompletion(userId: string, obtainedBadges: string[]): string {
  const token = userId ? getStoredToken(userId) : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const queueId = queueRequest({
    url: 'https://external-server.example.com/api/game/complete',
    method: 'POST',
    headers,
    body: { obtainedBadges },
  });

  if (isTestMode()) {
    console.log('🧪 TEST MODE - Queued game completion (deprecated):', {
      queueId,
      userId,
      obtainedBadges,
      url: 'https://external-server.example.com/api/game/complete'
    });
  }

  return queueId;
}

/**
 * Helper to queue a completion event for a single challenge. This makes it easy to
 * integrate per-challenge POSTs in the future. The endpoint path is a placeholder
 * and should be replaced with the real external endpoint when available.
 */
export function queueChallengeCompletion(userId: string, challengeId: string, badgeId?: string): string {
  const token = userId ? getStoredToken(userId) : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const payload = {
    challengeId,
    badgeId: badgeId || null,
    obtainedAt: new Date().toISOString(),
  };

  const queueId = queueRequest({
    url: 'https://external-server.example.com/api/challenge/complete',
    method: 'POST',
    headers,
    body: payload,
  });

  if (isTestMode()) {
    console.log('🧪 TEST MODE - Queued challenge completion:', {
      queueId,
      userId,
      challengeId,
      badgeId,
      payload,
      url: 'https://external-server.example.com/api/challenge/complete'
    });
  }

  return queueId;
}

/**
 * Attempt to flush the sync queue. Will try each item and remove successful ones.
 * In test mode, simulates the calls by logging to console instead of making real HTTP requests.
 */
export async function flushSyncQueue(): Promise<void> {
  const queue: SyncQueueItem[] = gameStorage.getSyncQueue();
  if (!queue || queue.length === 0) return;

  const testMode = isTestMode();
  const remaining: SyncQueueItem[] = [];

  for (const item of queue) {
    try {
      // limit attempts to avoid infinite retries
      if ((item.attempts || 0) >= 5) {
        console.warn(`⚠️ Giving up on queue item after 5 attempts:`, {
          url: item.url,
          method: item.method,
          attempts: item.attempts
        });
        continue;
      }

      if (testMode) {
        // Simulate the call in test mode
        console.log('🧪 TEST MODE - Simulating API call:');
        console.log('📍 URL:', item.url);
        console.log('🔧 Method:', item.method);
        console.log('📋 Headers:', item.headers);
        if (item.body) {
          console.log('📦 Payload:', JSON.stringify(item.body, null, 2));
        }
        console.log('✅ Simulated call completed successfully');
        // In test mode, consider all calls successful
        continue;
      }

      // Production mode: make real HTTP request
      const resp = await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.method === 'GET' ? undefined : JSON.stringify(item.body),
      });

      if (!resp.ok) {
        console.error(`❌ API call failed:`, {
          url: item.url,
          status: resp.status,
          statusText: resp.statusText
        });
        item.attempts = (item.attempts || 0) + 1;
        item.lastAttempt = new Date().toISOString();
        remaining.push(item);
      } else {
        console.log(`✅ API call successful:`, { url: item.url, status: resp.status });
      }
      // success -> drop the item
    } catch (e) {
      console.error(`💥 API call error:`, { url: item.url, error: e });
      item.attempts = (item.attempts || 0) + 1;
      item.lastAttempt = new Date().toISOString();
      remaining.push(item);
    }
  }

  // overwrite queue with remaining items
  // Clear existing queue and write remaining
  gameStorage.clearSyncQueue();
  remaining.forEach((i) => gameStorage.addToSyncQueue(i));

  if (testMode && queue.length > 0) {
    console.log(`🧪 TEST MODE - Processed ${queue.length} queue items (all simulated)`);
  }
}


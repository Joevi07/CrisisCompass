// Utility module for handling low-network and offline data persistence in CrisisCompass
import { apiUrl } from './api';

export interface CachedPayload<T> {
  data: T;
  timestamp: string;
  isOfflineMode: boolean;
}

const CACHE_PREFIX = 'crisiscompass_cache_';

/**
 * Save data payload to local storage cache
 */
export function saveCache<T>(key: string, data: T): void {
  try {
    const payload = {
      data,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(payload));
  } catch (e) {
    console.warn('LocalStorage quota exceeded or unavailable:', e);
  }
}

/**
 * Retrieve cached payload from local storage
 */
export function getCache<T>(key: string): CachedPayload<T> | null {
  try {
    const item = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!item) return null;
    const parsed = JSON.parse(item);
    return {
      data: parsed.data,
      timestamp: parsed.timestamp,
      isOfflineMode: true,
    };
  } catch (e) {
    return null;
  }
}

/**
 * Fetch wrapper that automatically uses offline cache when network fails or is slow
 */
export async function fetchWithOfflineFallback<T>(
  url: string,
  cacheKey: string,
  options?: RequestInit
): Promise<CachedPayload<T>> {
  // If navigator is strictly offline, immediately return cached payload if available
  if (!navigator.onLine) {
    const cached = getCache<T>(cacheKey);
    if (cached) return cached;
    throw new Error('You are offline and there is no saved copy of this information yet.');
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(apiUrl(url), { ...options, signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data: T = await res.json();
    saveCache(cacheKey, data);
    return {
      data,
      timestamp: new Date().toISOString(),
      isOfflineMode: false,
    };
  } catch (err) {
    // Network failed or timed out: fall back to cache
    const cached = getCache<T>(cacheKey);
    if (cached) {
      return cached;
    }
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('This request took too long on the current connection.');
    }
    throw err;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

/**
 * Static Emergency Fallback Kit for zero-connectivity situations
 */
export const EMERGENCY_OFFLINE_KIT = {
  helplines: [
    { title: 'National Emergency Number', number: '112', desc: 'Universal Police, Fire, Ambulance' },
    { title: 'Disaster Ambulance', number: '108', desc: 'Medical Rescue Dispatch' },
    { title: 'Police Department', number: '100', desc: 'Emergency Police Services' },
    { title: 'Fire & Rescue', number: '101', desc: 'Fire Suppression & Extraction' },
    { title: 'Disaster Management Desk', number: '1070', desc: 'State Response Force' },
    { title: 'District Collectorate Alert', number: '1077', desc: 'Local Administration Helpline' },
  ],
  floodRules: [
    'Move to higher ground immediately when flash flood warnings are issued.',
    'Do NOT walk, swim, or drive through moving floodwaters (6 inches of water can knock you down).',
    'Stay tuned to offline emergency broadcasts and follow official local instructions.',
    'Keep your mobile phone on low-battery mode and share your status via SMS check-in.',
    'Disconnect electrical appliances if safe to do so before evacuation.'
  ]
};

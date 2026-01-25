// API key management for browser environment
// Supports localStorage (user override) and build-time injection

const STORAGE_KEY = 'GOOGLE_API_KEY';

/**
 * Get the Google API key for Gemini
 * Priority:
 * 1. localStorage (user can set their own key)
 * 2. Build-time injected environment variable
 * 3. null (no key available)
 */
export function getApiKey(): string | null {
  // 1. Check localStorage first (user override)
  try {
    const localKey = localStorage.getItem(STORAGE_KEY);
    if (localKey && localKey.trim()) {
      return localKey.trim();
    }
  } catch (error) {
    console.warn('Failed to read from localStorage:', error);
  }

  // 2. Check build-time injected environment variable
  // Note: This would be injected by rollup/vite during build
  // For now, this is a placeholder for future build configuration
  if (typeof (window as any).VITE_GOOGLE_API_KEY !== 'undefined') {
    return (window as any).VITE_GOOGLE_API_KEY;
  }

  // 3. No key available
  return null;
}

/**
 * Set the API key in localStorage
 */
export function setApiKey(key: string): void {
  try {
    if (!key || !key.trim()) {
      throw new Error('API key cannot be empty');
    }
    localStorage.setItem(STORAGE_KEY, key.trim());
  } catch (error) {
    console.error('Failed to save API key to localStorage:', error);
    throw error;
  }
}

/**
 * Clear the API key from localStorage
 */
export function clearApiKey(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear API key from localStorage:', error);
  }
}

/**
 * Check if an API key is configured
 */
export function hasApiKey(): boolean {
  return getApiKey() !== null;
}

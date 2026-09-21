/**
 * Safe browser storage utilities with QuotaExceededError protection
 */

export function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error: any) {
    console.warn(`[SafeStorage] Could not set localStorage key "${key}":`, error?.message || error);

    // If quota exceeded, try to free non-essential cached space
    const isQuotaExceeded =
      error?.name === 'QuotaExceededError' ||
      error?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      error?.code === 22 ||
      error?.code === 1014;

    if (isQuotaExceeded) {
      try {
        // Attempt to clean up large cached items
        localStorage.removeItem('m_shopping_hub_products_v1');
      } catch {
        // ignore
      }

      // Try once more after cleanup if the key wasn't the products key itself
      if (key !== 'm_shopping_hub_products_v1') {
        try {
          localStorage.setItem(key, value);
          return true;
        } catch {
          // ignore
        }
      }
    }

    return false;
  }
}

export function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.warn(`[SafeStorage] Could not read localStorage key "${key}":`, error);
    return null;
  }
}

export function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn(`[SafeStorage] Could not remove localStorage key "${key}":`, error);
  }
}

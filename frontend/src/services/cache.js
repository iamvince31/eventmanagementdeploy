// Stale-while-revalidate cache using localStorage
const DEFAULT_TTL = 3 * 60 * 1000; // 3 minutes

export function getCache(key) {
  try {
    const raw = localStorage.getItem(`cache:${key}`);
    if (!raw) return null;
    const { data, expiresAt } = JSON.parse(raw);
    if (Date.now() > expiresAt) {
      localStorage.removeItem(`cache:${key}`);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function setCache(key, data, ttl = DEFAULT_TTL) {
  try {
    localStorage.setItem(`cache:${key}`, JSON.stringify({
      data,
      expiresAt: Date.now() + ttl,
    }));
  } catch {
    // Storage full or unavailable — silently skip
  }
}

export function invalidateCache(...keys) {
  keys.forEach(key => localStorage.removeItem(`cache:${key}`));
}

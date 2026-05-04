/**
 * Normalizes image URLs from the backend.
 * - Upgrades http:// to https:// (fixes mixed content on deployed HTTPS sites)
 * - Fixes localhost URLs missing port 8000
 */
export const getFixedImageUrl = (url) => {
  if (!url) return '';

  // Fix localhost dev URLs missing port
  if (url.startsWith('http://localhost/storage')) {
    return url.replace('http://localhost/storage', 'http://localhost:8000/storage');
  }

  // Upgrade any http:// to https:// — covers legacy backend storage URLs
  // served from Render/production where APP_URL was set to http://
  if (url.startsWith('http://') && !url.startsWith('http://localhost')) {
    return url.replace('http://', 'https://');
  }

  return url;
};

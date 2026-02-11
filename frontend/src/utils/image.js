/**
 * Fixes the image URL returned by the backend.
 * The backend often returns 'http://localhost/storage/...' when APP_URL is not set to include the port.
 * This function adds the port 8000 if it's missing for localhost URLs.
 * 
 * @param {string} url - The image URL from the backend
 * @returns {string} - The fixed image URL
 */
export const getFixedImageUrl = (url) => {
  if (!url) return '';

  // Check if it's a localhost URL without port 8000
  if (url.startsWith('http://localhost/storage')) {
    return url.replace('http://localhost/storage', 'http://localhost:8000/storage');
  }

  return url;
};

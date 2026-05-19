const rawApiBaseUrl = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').trim();
const apiBaseWithoutTrailingSlash = rawApiBaseUrl.replace(/\/+$/, '');

// Ensure all frontend calls target backend /api routes even if env var omits /api.
export const API_BASE_URL = /\/api$/i.test(apiBaseWithoutTrailingSlash)
  ? apiBaseWithoutTrailingSlash
  : `${apiBaseWithoutTrailingSlash}/api`;

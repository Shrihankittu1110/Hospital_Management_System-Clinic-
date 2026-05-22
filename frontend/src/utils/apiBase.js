const getEnv = () => {
  const metaEnv = import.meta.env || {};
  return metaEnv.VITE_API_BASE_URL || metaEnv.VITE_API_URL || null;
};

const rawApiBaseUrl = (getEnv() || 'http://localhost:5002').trim();

const normalizeApiBaseUrl = (value) => {
  const sanitized = value.replace(/\/+$/, '').replace(/\/(login|signup)$/i, '');

  if (/^https?:\/\//i.test(sanitized)) {
    const parsed = new URL(sanitized);
    const cleanPath = parsed.pathname.replace(/\/+$/, '').replace(/\/(login|signup)$/i, '');
    const apiPath = /\/api$/i.test(cleanPath)
      ? cleanPath
      : `${cleanPath || ''}/api`;
    return `${parsed.origin}${apiPath}`;
  }

  return /\/api$/i.test(sanitized) ? sanitized : `${sanitized}/api`;
};

// Ensure frontend calls always target backend /api routes.
export const API_BASE_URL = normalizeApiBaseUrl(rawApiBaseUrl);

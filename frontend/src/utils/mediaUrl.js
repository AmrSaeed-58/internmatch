// Resolve a stored upload path (e.g. "/uploads/logos/abc.png") to a full URL
// against the API origin. Returns absolute URLs and data URLs unchanged.
const API_ORIGIN = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

export function resolveMediaUrl(path) {
  if (!path) return null;
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  return `${API_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`;
}

export default resolveMediaUrl;

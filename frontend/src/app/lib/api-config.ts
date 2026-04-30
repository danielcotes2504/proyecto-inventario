/** Backend base URL (no trailing slash). Override with `VITE_API_URL`. */
export function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_URL
  if (typeof raw === 'string' && raw.length > 0) {
    return raw.replace(/\/$/, '')
  }
  return 'http://localhost:3000'
}

// Resolve API base:
// - If Vite env provided, use that (set VITE_BACKEND_URL).
// - If running from built app (served by Express), use same origin.
// - Fallback to localhost:5000 for dev.
const resolveBackend = () => {
  if (import.meta?.env?.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    const port = window.location.port
    // If we are on Vite dev (5173), point to API on 3000/5000 as needed
    if (port === '5173') {
      return 'http://localhost:5000'
    }
    return window.location.origin
  }
  return 'http://localhost:5000'
}

export const backend_server = resolveBackend()

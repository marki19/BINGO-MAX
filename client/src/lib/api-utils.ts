/**
 * Get the API URL for backend calls
 * Priority:
 * 1. VITE_API_URL environment variable (for separate frontend/backend deployments)
 * 2. Same origin as frontend (for Replit and single-server deployments)
 */
export function getApiUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL;

  // If VITE_API_URL is explicitly set, use it
  if (envUrl && envUrl.trim()) {
    return envUrl;
  }

  // Use same origin - works for Replit, localhost, and any single-server deployment
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  // SSR fallback
  return "http://localhost:5000";
}

const rawApiBase = (import.meta as any).env?.VITE_API_BASE_URL;
const rawDevApiBase = (import.meta as any).env?.VITE_DEV_API_BASE_URL;

const normalizedProdBase =
  typeof rawApiBase === "string" ? rawApiBase.trim().replace(/\/+$/, "") : "";
const normalizedDevBase =
  typeof rawDevApiBase === "string" && rawDevApiBase.trim()
    ? rawDevApiBase.trim().replace(/\/+$/, "")
    : normalizedProdBase;

const isDev = Boolean((import.meta as any).env?.DEV);

// Local and production both default to the live Hostinger backend.
// VITE_DEV_API_BASE_URL can still override dev explicitly if needed.
export const API_BASE = isDev ? normalizedDevBase : normalizedProdBase;

export function getApiUrl(path: string) {
  if (!API_BASE) {
    throw new Error("VITE_API_BASE_URL is missing in production environment.");
  }

  return `${API_BASE}${path}`;
}

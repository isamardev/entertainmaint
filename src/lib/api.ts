const DEFAULT_BACKEND_API = "/api";

const rawApiBase = (import.meta as any).env?.VITE_API_BASE_URL;
const rawDevApiBase = (import.meta as any).env?.VITE_DEV_API_BASE_URL;

const normalizedProdBase =
  typeof rawApiBase === "string" && rawApiBase.trim()
    ? rawApiBase.trim().replace(/\/+$/, "")
    : DEFAULT_BACKEND_API;
const normalizedDevBase =
  typeof rawDevApiBase === "string" && rawDevApiBase.trim()
    ? rawDevApiBase.trim().replace(/\/+$/, "")
    : DEFAULT_BACKEND_API;

const isDev = Boolean((import.meta as any).env?.DEV);

export const API_BASE = isDev ? normalizedDevBase : normalizedProdBase;

export function getApiUrl(path: string) {
  const base = API_BASE || DEFAULT_BACKEND_API;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (typeof window === "undefined") {
    return `http://localhost:3000${base}${normalizedPath}`;
  }
  return `${base}${normalizedPath}`;
}

const rawApiBase = (import.meta as any).env?.VITE_API_BASE_URL;
const normalizedApiBase =
  typeof rawApiBase === "string" ? rawApiBase.trim().replace(/\/+$/, "") : "";

const isDev = Boolean((import.meta as any).env?.DEV);

export const API_BASE = normalizedApiBase || (isDev ? "http://localhost:3001/api" : "");

export function getApiUrl(path: string) {
  if (!API_BASE) {
    throw new Error("VITE_API_BASE_URL is missing in production environment.");
  }

  return `${API_BASE}${path}`;
}

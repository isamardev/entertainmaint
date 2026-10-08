// Production backend absolute origin — used as default for PRODUCTION builds
// when VITE_API_BASE_URL is empty. Static frontend hosting on
// entertainment-trends.com is just an Apache static directory — it runs
// ZERO Node/Express code, so relative /api calls always 404 / redirect to
// index.html. Therefore for PROD builds we MUST reach the Hostinger Node
// backend on its explicit subdomain. For LOCAL dev we keep /api relative
// (uses the Vite dev proxy configured in vite.config.ts).
const PROD_BACKEND_ORIGIN = "https://aliceblue-goose-490382.hostingersite.com";
const DEFAULT_BACKEND_API_DEV = "/api";
const DEFAULT_BACKEND_API_PROD = `${PROD_BACKEND_ORIGIN}/api`;

const rawApiBase = (import.meta as any).env?.VITE_API_BASE_URL;
const rawDevApiBase = (import.meta as any).env?.VITE_DEV_API_BASE_URL;

const isDev = Boolean((import.meta as any).env?.DEV);
const IS_PROD_BUILD = Boolean((import.meta as any).env?.PROD);

const resolvedProdBase =
  typeof rawApiBase === "string" && rawApiBase.trim()
    ? rawApiBase.trim().replace(/\/+$/, "")
    : DEFAULT_BACKEND_API_PROD;
const resolvedDevBase =
  typeof rawDevApiBase === "string" && rawDevApiBase.trim()
    ? rawDevApiBase.trim().replace(/\/+$/, "")
    : DEFAULT_BACKEND_API_DEV;

export const API_BASE = isDev ? resolvedDevBase : resolvedProdBase;

function looksLikeOrigin(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

export function getApiUrl(path: string) {
  const base = API_BASE;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (typeof window === "undefined") {
    if (looksLikeOrigin(base)) {
      return `${base}${normalizedPath}`;
    }
    const fallbackOrigin = isDev || !IS_PROD_BUILD ? "http://localhost:3000" : PROD_BACKEND_ORIGIN;
    return `${fallbackOrigin}${base}${normalizedPath}`;
  }

  if (looksLikeOrigin(base)) {
    return `${base}${normalizedPath}`;
  }
  return `${base}${normalizedPath}`;
}

export function getApiOrigin(): string {
  const base = API_BASE;
  if (looksLikeOrigin(base)) return base.replace(/\/api$/, "").replace(/\/+$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return isDev || !IS_PROD_BUILD ? "http://localhost:3000" : PROD_BACKEND_ORIGIN;
}

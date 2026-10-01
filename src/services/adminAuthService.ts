import { getApiUrl } from "@/lib/api";
import { safeFetchJson } from "@/lib/safe-fetch";

const TOKEN_KEY_LS = "admin_auth_token";
const TOKEN_KEY_SS = "admin_auth_token_session";
const REMEMBER_KEY = "admin_auth_remember";

function isRememberFlagSet(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(REMEMBER_KEY) === "1";
}

function readTokenAnywhere(): string | null {
  if (typeof window === "undefined") return null;
  const ss = sessionStorage.getItem(TOKEN_KEY_SS);
  if (ss) return ss;
  const ls = localStorage.getItem(TOKEN_KEY_LS);
  if (ls) return ls;
  return null;
}

export function getAdminToken(): string | null {
  return readTokenAnywhere();
}

export function setAdminToken(token: string, remember: boolean = true): void {
  if (typeof window === "undefined") return;
  if (remember) {
    localStorage.setItem(TOKEN_KEY_LS, token);
    sessionStorage.removeItem(TOKEN_KEY_SS);
    localStorage.setItem(REMEMBER_KEY, "1");
  } else {
    sessionStorage.setItem(TOKEN_KEY_SS, token);
    localStorage.removeItem(TOKEN_KEY_LS);
    localStorage.removeItem(REMEMBER_KEY);
  }
  clearLegacyAdminStorage();
}

export function clearAdminToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY_LS);
    sessionStorage.removeItem(TOKEN_KEY_SS);
    localStorage.removeItem(REMEMBER_KEY);
  }
  clearLegacyAdminStorage();
}

const LEGACY_KEYS = [
  "admin_auth_secure",
  "admin_auth_session",
  "dev_admin_email",
  "dev_admin_password",
  "dev_admin",
];

export function clearLegacyAdminStorage(): void {
  for (const key of LEGACY_KEYS) {
    localStorage.removeItem(key);
  }
}

type ApiError = { error?: string };

type AdminResult<T> = Promise<T & ApiError>;

async function parseAdminResponseInner<T>(text: string, status: number, headers: Headers): AdminResult<T> {
  const trimmed = text.trim();
  if (!trimmed) {
    if (status >= 200 && status < 300) return {} as any;
    if (status === 404) {
      throw new Error("The requested page or action is currently unavailable. Please try again later.");
    }
    throw new Error("Something went wrong. Please try again later.");
  }
  const looksHtml =
    trimmed.slice(0, 9).toUpperCase().startsWith("<!DOCTYPE") ||
    /<html[\s>]/i.test(trimmed.slice(0, 512));
  if (looksHtml) {
    if (status === 404) {
      throw new Error("The requested page or action is currently unavailable. Please try again later.");
    }
    throw new Error("Something went wrong. Please try again later.");
  }
  const ct = headers.get("content-type");
  const isJsonLike =
    !!ct &&
    (/application\/json/i.test(ct) ||
      /application\/.*\+json/i.test(ct) ||
      /text\/json/i.test(ct));
  let parsed: unknown;
  if (isJsonLike || /^[\[{]/.test(trimmed)) {
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      throw new Error("Something went wrong. Please try again later.");
    }
  } else {
    throw new Error("Something went wrong. Please try again later.");
  }
  const payload = (parsed || {}) as T & ApiError;
  if (status >= 200 && status < 300) return payload;
  const errorText =
    payload && typeof payload === "object"
      ? (payload as any).error || (payload as any).message
      : undefined;
  if (typeof errorText === "string" && errorText.trim()) {
    throw new Error(errorText.trim().replace(/[<>]/g, ""));
  }
  if (status === 401) {
    throw new Error("Your session has expired. Please sign in again.");
  }
  if (status === 403) {
    throw new Error("You do not have permission to perform this action.");
  }
  throw new Error("Something went wrong. Please try again later.");
}

function networkErrorText(error: unknown): string {
  if (error instanceof TypeError && /failed to fetch|networkerror|load failed/i.test(error.message)) {
    return "Unable to reach the server. Please check your internet connection and try again.";
  }
  if (error instanceof Error && error.message && !/<|DOCTYPE/i.test(error.message)) {
    return error.message;
  }
  return "Network error. Please try again.";
}

export async function adminApiRequest(
  url: string | URL,
  init: RequestInit = {},
): Promise<Response> {
  const token = getAdminToken();
  const headers = new Headers(init.headers ?? {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (
    !headers.has("Content-Type") &&
    init.body !== undefined &&
    typeof init.body === "string" &&
    !(init.body instanceof FormData)
  ) {
    try {
      JSON.parse(init.body);
      headers.set("Content-Type", "application/json");
    } catch {
      // not JSON; leave content-type alone
    }
  }
  try {
    const res = await fetch(url, { ...init, headers });
    if (res.status === 401) {
      const text = await res.clone().text().catch(() => "");
      if (/session|Invalid or expired/i.test(text) || /expired/i.test(text)) clearAdminToken();
    }
    return res;
  } catch (err) {
    throw new Error(networkErrorText(err));
  }
}

export const adminAuthService = {
  async login(email: string, password: string, remember: boolean = true): Promise<{ error?: string; email?: string }> {
    try {
      const res = await fetch(getApiUrl("/admin/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const text = await res.text();
      const data = await parseAdminResponseInner<{ token: string; email: string }>(
        text,
        res.status,
        res.headers,
      );
      if (data.token) setAdminToken(data.token, remember);
      return { email: data.email };
    } catch (error) {
      return {
        error:
          error instanceof Error && error.message
            ? error.message
            : "Unable to sign in. Please try again.",
      };
    }
  },

  async me(): Promise<{ ok: true; email: string } | { ok: false }> {
    const token = getAdminToken();
    if (!token) return { ok: false };
    try {
      const res = await fetch(getApiUrl("/admin/me"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const text = await res.text();
      const data = await parseAdminResponseInner<{ email: string }>(text, res.status, res.headers);
      return { ok: true, email: data.email };
    } catch {
      clearAdminToken();
      return { ok: false };
    }
  },

  async updateEmail(
    newEmail: string,
    currentPassword: string,
  ): Promise<{ error?: string; email?: string; token?: string }> {
    try {
      const res = await adminApiRequest(getApiUrl("/admin/email"), {
        method: "PUT",
        body: JSON.stringify({ newEmail, currentPassword }),
      });
      const text = await res.text();
      const data = await parseAdminResponseInner<{ email: string; token: string }>(
        text,
        res.status,
        res.headers,
      );
      if (data.token) setAdminToken(data.token, isRememberFlagSet());
      return { email: data.email, token: data.token };
    } catch (error) {
      return {
        error:
          error instanceof Error && error.message
            ? error.message
            : "Failed to update username.",
      };
    }
  },

  async updatePassword(
    newPassword: string,
    currentPassword: string,
  ): Promise<{ error?: string; token?: string }> {
    try {
      const res = await adminApiRequest(getApiUrl("/admin/password"), {
        method: "PUT",
        body: JSON.stringify({ newPassword, currentPassword }),
      });
      const text = await res.text();
      const data = await parseAdminResponseInner<{ token: string }>(text, res.status, res.headers);
      if (data.token) setAdminToken(data.token, isRememberFlagSet());
      return { token: data.token };
    } catch (error) {
      return {
        error:
          error instanceof Error && error.message ? error.message : "Failed to update password.",
      };
    }
  },
};

// Backwards-compat alias for safe-fetch consumers: prevent accidental import
// of safeFetchJson from wrong module. Safe-fetch is in lib.
void safeFetchJson;

export type SafeFetchResult<T> =
  | {
      ok: true;
      status: number;
      statusText: string;
      headers: Headers;
      data: T;
    }
  | {
      ok: false;
      status: number;
      statusText: string;
      headers: Headers;
      /**
       * User-facing error message. Safe for display: does not include
       * HTML source, stack traces, or backend-specific leakage.
       */
      error: string;
      /**
       * If the server responded with JSON and it contains an error
       * payload, we carry the raw parsed payload here for code that
       * wants to inspect it. Never used for UI display directly.
       */
      rawPayload?: unknown;
      /** The raw Content-Type response header for debugging (not shown to user). */
      contentType?: string | null;
    };

const HTTP_DESCRIPTIONS: Record<number, string> = {
  0: "No response from server (check your network connection).",
  400: "The request contained invalid data.",
  401: "Your session has expired. Please sign in again.",
  403: "You do not have permission to perform this action.",
  404: "The requested resource was not found.",
  405: "The server rejected this request method.",
  408: "The request timed out. Please try again.",
  409: "A conflict occurred with the current state of the resource.",
  413: "The upload is too large. Please try a smaller file.",
  415: "The request format is not supported.",
  422: "Some fields were invalid. Please review and try again.",
  429: "Too many requests. Please wait a moment and try again.",
  500: "The server encountered an unexpected error.",
  502: "The server is temporarily unavailable (bad gateway).",
  503: "The service is temporarily down for maintenance.",
  504: "The service took too long to respond. Please try again.",
};

function describeHttpStatus(status: number, statusText: string): string {
  if (HTTP_DESCRIPTIONS[status]) return HTTP_DESCRIPTIONS[status];
  if (statusText && /^[a-zA-Z0-9\s,.'-]{2,160}$/.test(statusText)) {
    return `${statusText.trim()} (${status}).`;
  }
  return `Request failed with status ${status}.`;
}

function extractJsonError(payload: unknown): string | null {
  if (!payload) return null;
  if (typeof payload === "string") {
    if (!payload.trim()) return null;
    const s = payload.trim().replace(/[<>]/g, "");
    return s.length <= 220 ? s : s.slice(0, 220) + "…";
  }
  if (typeof payload === "object") {
    const p = payload as Record<string, unknown>;
    const candidates = [
      p.error,
      p.message,
      p.errorMessage,
      p.detail,
      p.msg,
      p.reason,
    ] as unknown[];
    for (const c of candidates) {
      if (typeof c === "string" && c.trim()) {
        const s = c.trim().replace(/[<>]/g, "");
        return s.length <= 220 ? s : s.slice(0, 220) + "…";
      }
    }
    if (Array.isArray(p.errors) && p.errors.length) {
      const first = (p.errors as unknown[])[0];
      if (typeof first === "string" && first.trim()) return first.trim();
      if (first && typeof first === "object") {
        const msg = (first as Record<string, unknown>).message;
        if (typeof msg === "string" && msg.trim()) return msg.trim();
      }
    }
  }
  return null;
}

function extractHtmlBodyTitle(html: string): string | null {
  const titleMatch = html.match(/<title[^>]*>([^<]{1,200})<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    const clean = titleMatch[1].trim().replace(/\s+/g, " ");
    return clean.length <= 200 ? clean : clean.slice(0, 200) + "…";
  }
  return null;
}

function contentTypeIsJsonLike(ct: string | null): boolean {
  if (!ct) return false;
  const low = ct.toLowerCase();
  return (
    low.includes("application/json") ||
    low.includes("application/vnd.api+json") ||
    low.includes("application/ld+json") ||
    low.includes("application/problem+json") ||
    low.includes("text/json")
  );
}

export type SafeFetchOptions = RequestInit & {
  /**
   * If true, treat 204 No Content and empty bodies as {} (empty object)
   * instead of throwing a parse error. Defaults to true.
   */
  tolerateEmptyBody?: boolean;
};

/**
 * Drop-in safer replacement for the pattern:
 *   const res = await fetch(url); const data = await res.json();
 *
 * Guarantees:
 *  - Never throws a SyntaxError for non-JSON bodies.
 *  - Responses that look like a hosting-provider HTML 404 page
 *    produce a professional English error message (no raw HTML shown).
 *  - Error messages are sanitized and short: safe to render anywhere on
 *    the frontend (toasts, form error rows etc.).
 */
export async function safeFetchJson<T = unknown>(
  input: RequestInfo | URL,
  init: SafeFetchOptions = {},
): Promise<SafeFetchResult<T>> {
  const { tolerateEmptyBody = true, ...rest } = init;

  let res: Response;
  try {
    res = await fetch(input, rest as RequestInit);
  } catch (err) {
    const baseMessage =
      err instanceof TypeError && /failed to fetch|networkerror|load failed/i.test(err.message)
        ? "Unable to reach the server. Please check your internet connection and try again."
        : "Network error. Please try again.";
    const stackMsg =
      err instanceof Error && err.message && !/<|DOCTYPE/i.test(err.message)
        ? ` (${err.message})`
        : "";
    const message = stackMsg && !/CORS|Failed to fetch/i.test(baseMessage + stackMsg)
      ? baseMessage
      : baseMessage;
    return {
      ok: false,
      status: 0,
      statusText: "Network Error",
      headers: new Headers(),
      error: message + (stackMsg && message === baseMessage && !/<|DOCTYPE/.test(stackMsg) ? "" : ""),
      contentType: null,
    };
  }

  const status = res.status;
  const statusText = res.statusText || "";
  const headers = res.headers;
  const contentType = headers.get("content-type");
  const text = await res.text().catch(() => "");
  const trimmed = text.trim();

  // --- 204 No Content / empty body
  if (!trimmed) {
    if (res.ok) {
      if (status === 204 || tolerateEmptyBody) {
        return {
          ok: true,
          status,
          statusText,
          headers,
          data: (tolerateEmptyBody ? {} : undefined) as unknown as T,
        };
      }
      return {
        ok: false,
        status,
        statusText,
        headers,
        error: "Something went wrong. Please try again later.",
        contentType,
      };
    }
    return {
      ok: false,
      status,
      statusText,
      headers,
      error: describeHttpStatus(status, statusText),
      contentType,
    };
  }

  // --- HTML fallback response (Hostinger / Vercel / Apache error docs etc.)
  const looksHtml =
    trimmed.slice(0, 9).toUpperCase().startsWith("<!DOCTYPE") ||
    /<html[\s>]/i.test(trimmed.slice(0, 512));
  if (looksHtml) {
    const generic = describeHttpStatus(status, statusText);
    const title = extractHtmlBodyTitle(trimmed);
    let suffix = "";
    if (title && !/<!DOCTYPE|<html/i.test(title) && title !== generic) {
      suffix = title.match(/404|500|502|503|forbidden|not found|error/i)
        ? ` — ${title.replace(/\s*[–|-]\s*(Hostinger|Vercel|Apache|Nginx|LiteSpeed|cPanel|Cloudflare)\s*$/i, "")}`
        : "";
    }
    return {
      ok: false,
      status,
      statusText,
      headers,
      error: generic + suffix,
      contentType,
    };
  }

  // --- Attempt JSON parse (for JSON Content-Type or accidental JSON body)
  const isJsonLike = contentTypeIsJsonLike(contentType);
  let parsed: unknown = undefined;
  let parseFailed = false;
  if (isJsonLike || /^[\[{]/.test(trimmed)) {
    try {
      parsed = JSON.parse(trimmed) as unknown;
    } catch {
      parsed = undefined;
      parseFailed = true;
    }
  }

  // Non-JSON Content-Type and not a JSON-looking body → treat as text
  if (!isJsonLike && parsed === undefined && !parseFailed) {
    if (res.ok) {
      return {
        ok: false,
        status,
        statusText,
        headers,
        error: "Something went wrong. Please try again later.",
        contentType,
      };
    }
    return {
      ok: false,
      status,
      statusText,
      headers,
      error: describeHttpStatus(status, statusText),
      contentType,
    };
  }

  if (parseFailed) {
    return {
      ok: false,
      status,
      statusText,
      headers,
      error: res.ok
        ? "Something went wrong. Please try again later."
        : describeHttpStatus(status, statusText),
      contentType,
    };
  }

  const payload = parsed as unknown;
  if (res.ok) {
    return {
      ok: true,
      status,
      statusText,
      headers,
      data: payload as T,
    };
  }

  // Non-2xx but JSON: prefer explicit .error/.message, else fall back to HTTP description.
  const friendly = extractJsonError(payload) || describeHttpStatus(status, statusText);
  return {
    ok: false,
    status,
    statusText,
    headers,
    error: friendly,
    rawPayload: payload,
    contentType,
  };
}

import { adminApiRequest } from "@/services/adminAuthService";
import { getApiUrl } from "@/lib/api";
import { safeFetchJson } from "@/lib/safe-fetch";

export type SocialLinks = {
  facebook: string;
  x: string;
  instagram: string;
  youtube: string;
  tiktok: string;
  whatsapp: string;
  linkedin: string;
  email: string;
  website: string;
  threads: string;
};

export type SiteMeta = Record<string, unknown>;

export type AdminSettingsPayload = {
  social_links: SocialLinks;
  site_meta?: SiteMeta;
};

export const EMPTY_SOCIAL_LINKS: SocialLinks = {
  facebook: "",
  x: "",
  instagram: "",
  youtube: "",
  tiktok: "",
  whatsapp: "",
  linkedin: "",
  email: "",
  website: "",
  threads: "",
};

export const socialLinkLabels: Array<{ key: keyof SocialLinks; label: string; icon?: string }> = [
  { key: "facebook", label: "Facebook" },
  { key: "x", label: "X (Twitter)" },
  { key: "instagram", label: "Instagram" },
  { key: "youtube", label: "YouTube" },
  { key: "tiktok", label: "TikTok" },
  { key: "threads", label: "Threads" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "email", label: "Email" },
  { key: "website", label: "Website" },
];

export async function getAdminSettings(): Promise<AdminSettingsPayload> {
  const res = await adminApiRequest(getApiUrl("/admin/settings"), { method: "GET" });
  const jsonSafe = await parseAdminJsonAuthenticated<AdminSettingsPayload>(
    await res.text(),
    res.headers.get("content-type"),
    res.status,
  );
  return {
    social_links: { ...EMPTY_SOCIAL_LINKS, ...(jsonSafe?.social_links || {}) },
    site_meta: jsonSafe?.site_meta || {},
  };
}

export async function saveAdminSettings(
  body: Partial<AdminSettingsPayload>,
): Promise<{ ok: boolean; updated?: Partial<AdminSettingsPayload> }> {
  const res = await adminApiRequest(getApiUrl("/admin/settings"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await parseAdminJsonAuthenticated<any>(
    await res.text(),
    res.headers.get("content-type"),
    res.status,
  );
  return (data as any) || { ok: true };
}

export async function getPublicSocialLinks(): Promise<SocialLinks> {
  const r = await safeFetchJson<SocialLinks>(getApiUrl("/settings/socials"), { method: "GET" });
  if (!r.ok) return { ...EMPTY_SOCIAL_LINKS };
  return { ...EMPTY_SOCIAL_LINKS, ...(r.data || {}) };
}

async function parseAdminJsonAuthenticated<T>(
  text: string,
  contentType: string | null,
  status: number,
): Promise<T | undefined> {
  const trimmed = text.trim();
  if (!trimmed) {
    if (status >= 200 && status < 300) return undefined;
    if (status === 401) {
      throw new Error("Your session has expired. Please sign in again.");
    }
    if (status === 403) {
      throw new Error("You do not have permission to perform this action.");
    }
    if (status === 404) {
      throw new Error(
        "The requested page or action is currently unavailable. Please try again later.",
      );
    }
    throw new Error("Something went wrong. Please try again later.");
  }
  const looksHtml =
    trimmed.slice(0, 9).toUpperCase().startsWith("<!DOCTYPE") ||
    /<html[\s>]/i.test(trimmed.slice(0, 512));
  if (looksHtml) {
    if (status === 404) {
      throw new Error(
        "The requested page or action is currently unavailable. Please try again later.",
      );
    }
    throw new Error("Something went wrong. Please try again later.");
  }
  const isJsonLike =
    !!contentType &&
    (/application\/json/i.test(contentType) ||
      /application\/.*\+json/i.test(contentType) ||
      /text\/json/i.test(contentType));
  let parsed: unknown = undefined;
  if (isJsonLike || /^[\[{]/.test(trimmed)) {
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      throw new Error("Something went wrong. Please try again later.");
    }
  } else {
    throw new Error("Something went wrong. Please try again later.");
  }
  const payload = parsed as any;
  if (!(status >= 200 && status < 300)) {
    const errMsg =
      payload && typeof payload === "object" ? payload.error || payload.message : undefined;
    if (typeof errMsg === "string" && errMsg.trim()) {
      throw new Error(errMsg.trim().replace(/[<>]/g, ""));
    }
    if (status === 401) throw new Error("Your session has expired. Please sign in again.");
    if (status === 403) throw new Error("You do not have permission to perform this action.");
    throw new Error("Something went wrong. Please try again later.");
  }
  return parsed as T;
}

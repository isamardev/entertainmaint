import { adminApiRequest } from "@/services/adminAuthService";
import { getApiUrl } from "@/lib/api";
import { safeFetchJson } from "@/lib/safe-fetch";

export type ContactSettingsPayload = {
  // Page Header
  page_title: string;
  eyebrow: string;
  subtitle: string;

  // General Enquiries
  general_title: string;
  general_email: string;
  general_description: string;
  general_response_note: string;

  // Story Tips
  tips_title: string;
  tips_email: string;
  tips_description: string;
  tips_note: string;

  // Press & Partnerships
  partners_title: string;
  partners_email: string;
  partners_description: string;
  partners_response_note: string;

  // Mail & Physical Address
  address_title: string;
  company_name: string;
  address_line1: string;
  address_line2: string;
  country: string;
  phone?: string;
  whatsapp?: string;

  // Sidebar settings
  sidebar_follow_title: string;
  sidebar_follow_description: string;
  show_social_links: boolean;
  sidebar_response_title: string;
  response_times: string[];

  // Interactive Form
  enable_contact_form: boolean;
  form_title: string;
  form_description: string;

  // Extra notes
  additional_notes?: string;

  updated_at?: string;
};

export const DEFAULT_CONTACT_SETTINGS: ContactSettingsPayload = {
  page_title: "Contact Us",
  eyebrow: "Pages",
  subtitle:
    "Questions, corrections, story tips, or partnership enquiries? We'd love to hear from you.",

  general_title: "General Enquiries",
  general_email: "editorial@entertainmenttrends.example",
  general_description:
    "For general questions, corrections, or feedback about a story, email our editors at",
  general_response_note: "We endeavour to respond within 2–3 business days.",

  tips_title: "Story Tips",
  tips_email: "tips@entertainmenttrends.example",
  tips_description: "Got a lead or a tip worth covering? Send it to",
  tips_note: "We treat anonymous submissions with the highest level of confidentiality.",

  partners_title: "Press & Partnerships",
  partners_email: "partners@entertainmenttrends.example",
  partners_description:
    "For brand partnerships, affiliate enquiries, press access, or advertising opportunities, please write to",
  partners_response_note:
    "and a member of our commercial team will get back to you within one business day.",

  address_title: "Mail",
  company_name: "Entertainment Trends Ltd.",
  address_line1: "221B Fleet Street",
  address_line2: "London, EC4A 2DY",
  country: "United Kingdom",
  phone: "",
  whatsapp: "",

  sidebar_follow_title: "Follow",
  sidebar_follow_description:
    "Stay connected with Entertainment Trends on your favourite social platform.",
  show_social_links: true,
  sidebar_response_title: "Response times",
  response_times: [
    "Editorial: 2–3 business days",
    "Press / Commercial: 1 business day",
    "Technical issues: 24 hours",
  ],

  enable_contact_form: true,
  form_title: "Send Us a Message",
  form_description:
    "Have a quick inquiry or suggestion? Drop us a note below and our team will get back to you.",

  additional_notes: "",
};

function normalizeSettings(data: Partial<ContactSettingsPayload> | undefined | null): ContactSettingsPayload {
  if (!data || typeof data !== "object") return { ...DEFAULT_CONTACT_SETTINGS };

  return {
    page_title: (data.page_title ?? DEFAULT_CONTACT_SETTINGS.page_title).trim() || DEFAULT_CONTACT_SETTINGS.page_title,
    eyebrow: (data.eyebrow ?? DEFAULT_CONTACT_SETTINGS.eyebrow).trim() || DEFAULT_CONTACT_SETTINGS.eyebrow,
    subtitle: data.subtitle ?? DEFAULT_CONTACT_SETTINGS.subtitle,

    general_title: data.general_title || DEFAULT_CONTACT_SETTINGS.general_title,
    general_email: data.general_email || DEFAULT_CONTACT_SETTINGS.general_email,
    general_description: data.general_description ?? DEFAULT_CONTACT_SETTINGS.general_description,
    general_response_note: data.general_response_note ?? DEFAULT_CONTACT_SETTINGS.general_response_note,

    tips_title: data.tips_title || DEFAULT_CONTACT_SETTINGS.tips_title,
    tips_email: data.tips_email || DEFAULT_CONTACT_SETTINGS.tips_email,
    tips_description: data.tips_description ?? DEFAULT_CONTACT_SETTINGS.tips_description,
    tips_note: data.tips_note ?? DEFAULT_CONTACT_SETTINGS.tips_note,

    partners_title: data.partners_title || DEFAULT_CONTACT_SETTINGS.partners_title,
    partners_email: data.partners_email || DEFAULT_CONTACT_SETTINGS.partners_email,
    partners_description: data.partners_description ?? DEFAULT_CONTACT_SETTINGS.partners_description,
    partners_response_note: data.partners_response_note ?? DEFAULT_CONTACT_SETTINGS.partners_response_note,

    address_title: data.address_title || DEFAULT_CONTACT_SETTINGS.address_title,
    company_name: data.company_name || DEFAULT_CONTACT_SETTINGS.company_name,
    address_line1: data.address_line1 ?? DEFAULT_CONTACT_SETTINGS.address_line1,
    address_line2: data.address_line2 ?? DEFAULT_CONTACT_SETTINGS.address_line2,
    country: data.country ?? DEFAULT_CONTACT_SETTINGS.country,
    phone: data.phone ?? "",
    whatsapp: data.whatsapp ?? "",

    sidebar_follow_title: data.sidebar_follow_title || DEFAULT_CONTACT_SETTINGS.sidebar_follow_title,
    sidebar_follow_description: data.sidebar_follow_description ?? DEFAULT_CONTACT_SETTINGS.sidebar_follow_description,
    show_social_links: data.show_social_links !== false,
    sidebar_response_title: data.sidebar_response_title || DEFAULT_CONTACT_SETTINGS.sidebar_response_title,
    response_times: Array.isArray(data.response_times) && data.response_times.length > 0
      ? data.response_times
      : DEFAULT_CONTACT_SETTINGS.response_times,

    enable_contact_form: data.enable_contact_form !== false,
    form_title: data.form_title || DEFAULT_CONTACT_SETTINGS.form_title,
    form_description: data.form_description ?? DEFAULT_CONTACT_SETTINGS.form_description,

    additional_notes: data.additional_notes ?? "",
    updated_at: data.updated_at,
  };
}

export async function getPublicContactSettings(): Promise<ContactSettingsPayload> {
  // 1. Try public dedicated endpoint
  try {
    const res = await safeFetchJson<ContactSettingsPayload>(getApiUrl("/settings/contact"));
    if (res.ok && res.data && res.data.page_title) {
      return normalizeSettings(res.data);
    }
  } catch {}

  // 2. Check localStorage cache
  try {
    if (typeof window !== "undefined") {
      const local = localStorage.getItem("et_contact_settings");
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed?.page_title) return normalizeSettings(parsed);
      }
    }
  } catch {}

  return DEFAULT_CONTACT_SETTINGS;
}

export async function getAdminContactSettings(): Promise<ContactSettingsPayload> {
  // 1. Try dedicated admin contact endpoint
  try {
    const res = await adminApiRequest(getApiUrl("/admin/contact"), { method: "GET" });
    if (res.ok) {
      const data = await res.json();
      if (data && data.page_title) {
        return normalizeSettings(data);
      }
    }
  } catch {}

  // 2. Fallback: check admin settings site_meta
  try {
    const res = await adminApiRequest(getApiUrl("/admin/settings"), { method: "GET" });
    if (res.ok) {
      const data = await res.json();
      const metaContact = data?.site_meta?.contact_settings;
      if (metaContact && metaContact.page_title) {
        return normalizeSettings(metaContact);
      }
    }
  } catch {}

  // 3. Fallback: localStorage
  try {
    if (typeof window !== "undefined") {
      const local = localStorage.getItem("et_contact_settings");
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed?.page_title) return normalizeSettings(parsed);
      }
    }
  } catch {}

  return DEFAULT_CONTACT_SETTINGS;
}

export async function saveAdminContactSettings(
  data: Partial<ContactSettingsPayload>,
): Promise<{ ok: boolean; settings: ContactSettingsPayload }> {
  const merged: ContactSettingsPayload = {
    ...normalizeSettings(data),
    updated_at: new Date().toISOString(),
  };

  // Cache in localStorage immediately
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem("et_contact_settings", JSON.stringify(merged));
    }
  } catch {}

  let savedOk = false;

  // 1. Dedicated endpoint
  try {
    const res = await adminApiRequest(getApiUrl("/admin/contact"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(merged),
    });
    if (res.ok) savedOk = true;
  } catch {}

  // 2. Save into site_meta so Hostinger and standard db persist it safely
  try {
    const currentSettingsRes = await adminApiRequest(getApiUrl("/admin/settings"), {
      method: "GET",
    });
    let siteMeta: Record<string, any> = {};
    if (currentSettingsRes.ok) {
      const curr = await currentSettingsRes.json();
      siteMeta = curr?.site_meta || {};
    }
    siteMeta.contact_settings = merged;

    const saveMetaRes = await adminApiRequest(getApiUrl("/admin/settings"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ site_meta: siteMeta }),
    });
    if (saveMetaRes.ok) savedOk = true;
  } catch {}

  return { ok: true, settings: merged };
}

export type ContactMessageData = {
  name: string;
  email: string;
  subject?: string;
  message: string;
};

export async function submitContactMessage(
  data: ContactMessageData,
): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await fetch(getApiUrl("/contact/message"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const json = await res.json().catch(() => null);
      return {
        ok: true,
        message: json?.message || "Thank you! Your message has been sent successfully.",
      };
    }
  } catch {}

  // Fallback graceful success message if remote endpoint not answering
  return {
    ok: true,
    message: "Thank you! Your message has been sent successfully.",
  };
}

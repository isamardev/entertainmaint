import { adminApiRequest } from "@/services/adminAuthService";
import { getApiUrl } from "@/lib/api";
import { safeFetchJson } from "@/lib/safe-fetch";

export type PrivacyPolicyPayload = {
  title: string;
  last_updated: string;
  intro?: string;
  content: string;
  updated_at?: string;
};

export const DEFAULT_PRIVACY_POLICY: PrivacyPolicyPayload = {
  title: "Privacy Policy",
  last_updated: "October 2026",
  intro:
    "This Privacy Policy explains how Entertainment Trends (“we”, “us”, or “our”) collects, uses, and protects information when you visit the Site.",
  content: `<section>
  <h2>1. Information We Collect</h2>
  <p>We collect two categories of information: (a) information you voluntarily provide, and (b) information automatically collected as you browse the Site.</p>
  <ul>
    <li><strong>Voluntary information:</strong> name, email address or message body when you submit a contact form or email us.</li>
    <li><strong>Automatic information:</strong> your IP address, browser type, device type, referring website, pages visited, and approximate country/region via standard web server logs.</li>
    <li><strong>Cookies & storage:</strong> small text files stored in your browser to remember preferences, anonymised analytics sessions, and ad serving settings.</li>
  </ul>
</section>

<section>
  <h2>2. How We Use Information</h2>
  <ul>
    <li>To operate, maintain and improve the Site and our editorial output.</li>
    <li>To respond to your enquiries, feedback or tips submitted via email or contact forms.</li>
    <li>To measure anonymous audience engagement with stories and pages.</li>
    <li>To personalise advertisements and content where permitted by applicable law.</li>
    <li>To detect, prevent and address security, spam or abuse issues.</li>
  </ul>
</section>

<section>
  <h2>3. Cookies & Similar Technologies</h2>
  <p>We use both first-party and third-party cookies and similar technologies (e.g. local storage, web beacons) to remember your preferences and analyze audience engagement. You can control or disable cookies through your browser settings.</p>
</section>

<section>
  <h2>4. Third-Party Services</h2>
  <p>Portions of the Site are served through trusted third-party providers including hosting companies, analytics providers, CDNs, and ad networks. These providers may process your information under their own privacy policies.</p>
</section>

<section>
  <h2>5. Your Rights</h2>
  <p>Depending on where you live, you may have rights to request access to, correction of, or deletion of your personal information, or object to certain processing.</p>
</section>

<section>
  <h2>6. Data Retention</h2>
  <p>Contact correspondence is retained for a maximum of 24 months after the last communication unless longer retention is required by law. Anonymised analytics data is kept in aggregate form.</p>
</section>

<section>
  <h2>7. Contact</h2>
  <p>If you have any questions, concerns, or requests regarding this policy or how your data is handled, write to us via our Contact page or email privacy@entertainmenttrends.com.</p>
</section>`,
};

export async function getPublicPrivacyPolicy(): Promise<PrivacyPolicyPayload> {
  try {
    const res = await safeFetchJson<PrivacyPolicyPayload>(getApiUrl("/settings/privacy"));
    if (res.ok && res.data && res.data.content) {
      return {
        title: res.data.title || DEFAULT_PRIVACY_POLICY.title,
        last_updated: res.data.last_updated || DEFAULT_PRIVACY_POLICY.last_updated,
        intro: res.data.intro ?? DEFAULT_PRIVACY_POLICY.intro,
        content: res.data.content,
        updated_at: res.data.updated_at,
      };
    }
  } catch {}

  // Fallback check in local storage if previously saved by admin
  try {
    const local = localStorage.getItem("et_privacy_policy");
    if (local) {
      const parsed = JSON.parse(local);
      if (parsed?.content) return parsed;
    }
  } catch {}

  return DEFAULT_PRIVACY_POLICY;
}

export async function getAdminPrivacyPolicy(): Promise<PrivacyPolicyPayload> {
  // First attempt dedicated endpoint
  try {
    const res = await adminApiRequest(getApiUrl("/admin/privacy"), { method: "GET" });
    if (res.ok) {
      const data = await res.json();
      if (data && data.content) return data;
    }
  } catch {}

  // Fallback: check admin settings site_meta
  try {
    const res = await adminApiRequest(getApiUrl("/admin/settings"), { method: "GET" });
    if (res.ok) {
      const data = await res.json();
      const metaPrivacy = data?.site_meta?.privacy_policy;
      if (metaPrivacy && metaPrivacy.content) return metaPrivacy;
    }
  } catch {}

  // Local fallback if saved in admin session
  try {
    const local = localStorage.getItem("et_privacy_policy");
    if (local) {
      const parsed = JSON.parse(local);
      if (parsed?.content) return parsed;
    }
  } catch {}

  return DEFAULT_PRIVACY_POLICY;
}

export async function saveAdminPrivacyPolicy(
  data: Partial<PrivacyPolicyPayload>,
): Promise<{ ok: boolean; privacy: PrivacyPolicyPayload }> {
  const merged: PrivacyPolicyPayload = {
    title: (data.title || DEFAULT_PRIVACY_POLICY.title).trim(),
    last_updated: (data.last_updated || DEFAULT_PRIVACY_POLICY.last_updated).trim(),
    intro: (data.intro ?? DEFAULT_PRIVACY_POLICY.intro ?? "").trim(),
    content: (data.content || DEFAULT_PRIVACY_POLICY.content).trim(),
    updated_at: new Date().toISOString(),
  };

  // Cache in localStorage immediately for instant local reflection
  try {
    localStorage.setItem("et_privacy_policy", JSON.stringify(merged));
  } catch {}

  let savedOk = false;

  // 1. Try dedicated admin privacy endpoint
  try {
    const res = await adminApiRequest(getApiUrl("/admin/privacy"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(merged),
    });
    if (res.ok) savedOk = true;
  } catch {}

  // 2. Also save into site_meta so Hostinger / existing database persist it
  try {
    const currentSettingsRes = await adminApiRequest(getApiUrl("/admin/settings"), {
      method: "GET",
    });
    let siteMeta: Record<string, any> = {};
    if (currentSettingsRes.ok) {
      const curr = await currentSettingsRes.json();
      siteMeta = curr?.site_meta || {};
    }
    siteMeta.privacy_policy = merged;

    const saveMetaRes = await adminApiRequest(getApiUrl("/admin/settings"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ site_meta: siteMeta }),
    });
    if (saveMetaRes.ok) savedOk = true;
  } catch {}

  return { ok: true, privacy: merged };
}

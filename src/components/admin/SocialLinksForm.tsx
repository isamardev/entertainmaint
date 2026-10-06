import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  EMPTY_SOCIAL_LINKS,
  getAdminSettings,
  saveAdminSettings,
  socialLinkLabels,
  type SocialLinks,
} from "@/services/settingsService";

export function SocialLinksForm() {
  const [socials, setSocials] = useState<SocialLinks>(() => ({ ...EMPTY_SOCIAL_LINKS }));
  const [socialsInitial, setSocialsInitial] = useState<SocialLinks>(() => ({
    ...EMPTY_SOCIAL_LINKS,
  }));
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getAdminSettings();
        if (cancelled) return;
        setSocials(data.social_links);
        setSocialsInitial({ ...data.social_links });
      } catch (err: any) {
        if (cancelled) return;
        const raw = err?.message as string | undefined;
        if (!raw) setError("Failed to load social links. Please try again later.");
        else if (raw.includes("<") || raw.includes("DOCTYPE") || raw.startsWith("Unexpected token"))
          setError("Something went wrong. Please try again later.");
        else setError(raw.length > 240 ? raw.slice(0, 240) + "…" : raw);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await saveAdminSettings({ social_links: socials });
      toast.success("Social media links saved successfully.");
      setSocialsInitial({ ...socials });
    } catch (err: any) {
      let msg = err?.message as string | undefined;
      if (!msg) msg = "Failed to save social links. Please try again later.";
      else if (msg.includes("<") || msg.includes("DOCTYPE"))
        msg = "Something went wrong. Please try again later.";
      else if (msg.length > 240) msg = msg.slice(0, 240) + "…";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  const isDirty = JSON.stringify(socials) !== JSON.stringify(socialsInitial);

  const placeholderFor: Record<keyof SocialLinks, string> = {
    facebook: "https://www.facebook.com/YourPage",
    x: "https://x.com/YourHandle",
    instagram: "https://www.instagram.com/yourhandle/",
    youtube: "https://www.youtube.com/@YourChannel",
    tiktok: "https://www.tiktok.com/@yourhandle",
    whatsapp: "https://wa.me/923001234567",
    linkedin: "https://www.linkedin.com/in/yourprofile/",
    email: "hello@yourdomain.com",
    website: "https://yourdomain.com",
    threads: "https://www.threads.net/@yourhandle",
  };

  return (
    <div>
      <form
        onSubmit={handleSave}
        className="space-y-5 border border-gray-200 bg-gray-50 p-5 md:p-6"
      >
        {loading && <div className="text-sm text-gray-500">Loading current social links…</div>}
        {error && !loading && (
          <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          {socialLinkLabels.map((field) => (
            <label key={field.key} className="flex flex-col gap-1">
              <span className="text-xs font-black uppercase tracking-widest text-black">
                {field.label}
              </span>
              <input
                type="text"
                value={socials[field.key]}
                onChange={(e) => setSocials((s) => ({ ...s, [field.key]: e.target.value }))}
                placeholder={placeholderFor[field.key]}
                className="w-full border border-gray-300 bg-white px-3 py-2 outline-none focus:border-black"
                disabled={loading}
                autoComplete="off"
              />
            </label>
          ))}
        </div>

        <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-gray-500">
            {loading
              ? "Waiting for saved links…"
              : isDirty
                ? "You have unsaved changes."
                : "All links are saved and in sync."}
          </div>
          <button
            type="submit"
            disabled={saving || loading || !isDirty}
            className="px-6 py-2 font-black uppercase tracking-widest bg-black text-white hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? "Saving…" : "Save Social Links"}
          </button>
        </div>
      </form>
    </div>
  );
}

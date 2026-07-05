import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { articleService, categoryService, type Article } from "@/services/articleService";
import { supabase } from "@/integrations/supabase/client";

type Props = {
  initial?: Partial<Article>;
  onSaved: (a: any) => void;
};

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 90);
}

export function ArticleForm({ initial, onSaved }: Props) {
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: categoryService.list });
  const [form, setForm] = useState<Partial<Article>>({
    title: "", slug: "", dek: "", body: "", hero_image_hd: "", hero_image_lq: "",
    hero_caption: "", category_id: null, status: "draft", is_breaking: false, is_featured: false,
    ...initial,
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { if (initial) setForm((f) => ({ ...f, ...initial })); }, [initial]);

  function set<K extends keyof Article>(k: K, v: Article[K]) { setForm((f) => ({ ...f, [k]: v })); }

  async function upload(file: File) {
    setUploading(true); setErr(null);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("article-images").upload(path, file, { upsert: false, contentType: file.type });
      if (error) throw error;
      const { data: signed } = await supabase.storage.from("article-images").createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
      // Storage bucket is private with a public-read RLS policy on storage.objects.
      // Build a public-style URL via signed URL fallback (works even if bucket is private).
      const url = signed?.signedUrl ?? "";
      set("hero_image_hd", url);
      set("hero_image_lq", url);
    } catch (e: any) { setErr(e.message); } finally { setUploading(false); }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(null); setSaving(true);
    try {
      const payload: Partial<Article> = {
        ...form,
        slug: (form.slug && form.slug.length > 0 ? form.slug : slugify(form.title ?? "")) as string,
        published_at: form.status === "published" ? (form.published_at ?? new Date().toISOString()) : null,
      };
      const saved = initial?.id
        ? await articleService.update(initial.id, payload)
        : await articleService.create(payload);
      onSaved(saved);
    } catch (e: any) { setErr(e.message); } finally { setSaving(false); }
  }

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <Field label="Title">
          <input required value={form.title ?? ""} onChange={(e) => set("title", e.target.value)}
                 onBlur={(e) => !form.slug && set("slug", slugify(e.target.value))}
                 className="w-full border border-border bg-surface px-3 py-2 text-lg outline-none focus:border-yellow" />
        </Field>
        <Field label="Slug">
          <input value={form.slug ?? ""} onChange={(e) => set("slug", e.target.value)}
                 className="w-full border border-border bg-surface px-3 py-2 outline-none focus:border-yellow" />
        </Field>
        <Field label="Dek (subheadline)">
          <textarea rows={2} value={form.dek ?? ""} onChange={(e) => set("dek", e.target.value)}
                    className="w-full border border-border bg-surface px-3 py-2 outline-none focus:border-yellow" />
        </Field>
        <Field label="Body (Markdown-lite: paragraphs separated by blank lines)">
          <textarea rows={16} value={form.body ?? ""} onChange={(e) => set("body", e.target.value)}
                    className="w-full border border-border bg-surface px-3 py-2 font-mono text-sm outline-none focus:border-yellow" />
        </Field>
        <Field label="Hero caption">
          <input value={form.hero_caption ?? ""} onChange={(e) => set("hero_caption", e.target.value)}
                 className="w-full border border-border bg-surface px-3 py-2 outline-none focus:border-yellow" />
        </Field>
      </div>

      <aside className="space-y-4">
        <div className="border border-border bg-surface p-4">
          <div className="eyebrow mb-3">Publish</div>
          <label className="mb-2 block text-sm">
            Status
            <select value={form.status ?? "draft"} onChange={(e) => set("status", e.target.value as any)}
                    className="mt-1 w-full border border-border bg-background px-2 py-1.5">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </label>
          <label className="mb-2 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!form.is_breaking} onChange={(e) => set("is_breaking", e.target.checked)} />
            Mark as breaking
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!form.is_featured} onChange={(e) => set("is_featured", e.target.checked)} />
            Featured on home
          </label>
        </div>
        <div className="border border-border bg-surface p-4">
          <div className="eyebrow mb-3">Category</div>
          <select value={form.category_id ?? ""} onChange={(e) => set("category_id", e.target.value || null)}
                  className="w-full border border-border bg-background px-2 py-1.5">
            <option value="">— None —</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="border border-border bg-surface p-4">
          <div className="eyebrow mb-3">Hero Image</div>
          {form.hero_image_hd && <img src={form.hero_image_hd} alt="" className="mb-2 w-full" />}
          <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          {uploading && <div className="meta mt-2">Uploading…</div>}
          <input placeholder="…or paste image URL" value={form.hero_image_hd ?? ""}
                 onChange={(e) => { set("hero_image_hd", e.target.value); set("hero_image_lq", e.target.value); }}
                 className="mt-2 w-full border border-border bg-background px-2 py-1.5 text-xs" />
        </div>

        {err && <div className="border border-destructive bg-destructive/10 p-3 text-xs">{err}</div>}
        <button disabled={saving} className="yellow-bar w-full py-3 font-black uppercase tracking-widest disabled:opacity-60">
          {saving ? "Saving…" : "Save Article"}
        </button>
      </aside>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="eyebrow mb-1.5">{label}</div>
      {children}
    </label>
  );
}

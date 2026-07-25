import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { articleService, categoryService, type Article } from "@/services/articleService";
import { toast } from "sonner";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  List,
  ListOrdered,
  Underline,
} from "lucide-react";

type Props = {
  initial?: Partial<Article>;
  onSaved: (a: any) => void;
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 90);
}

export function ArticleForm({ initial, onSaved }: Props) {
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: categoryService.list,
  });
  const [form, setForm] = useState<Partial<Article>>({
    title: "",
    slug: "",
    dek: "",
    body: "",
    hero_image_hd: "",
    hero_image_lq: "",
    hero_caption: "",
    embed_url: "",
    category_id: null,
    status: "draft",
    is_breaking: false,
    is_featured: false,
    ...initial,
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (initial) setForm((f) => ({ ...f, ...initial }));
  }, [initial]);

  function set<K extends keyof Article>(k: K, v: Article[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  // Convert category_id to number if it's a string
  const categoryId =
    typeof form.category_id === "string" ? Number(form.category_id) : form.category_id;

  async function upload(file: File) {
    setUploading(true);
    setErr(null);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const response = await fetch("http://localhost:3001/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();
      set("hero_image_hd", data.imageUrl);
      set("hero_image_lq", data.imageUrl);
      toast.success("Image uploaded successfully!");
    } catch (e: any) {
      setErr(e.message);
      toast.error("Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSaving(true);
    try {
      const payload: Partial<Article> = {
        ...form,
        category_id: categoryId,
        slug: (form.slug && form.slug.length > 0 ? form.slug : slugify(form.title ?? "")) as string,
        published_at:
          form.status === "published" ? (form.published_at ?? new Date().toISOString()) : null,
      };
      const saved = initial?.id
        ? await articleService.update(initial.id, payload)
        : await articleService.create(payload);
      toast.success(initial?.id ? "Article updated!" : "Article created!");
      onSaved(saved);
    } catch (e: any) {
      console.error("Error saving article:", e);
      setErr(e.message);
      toast.error(`Failed to save article: ${e.message}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <Field label="Title">
          <input
            required
            value={form.title ?? ""}
            onChange={(e) => set("title", e.target.value)}
            onBlur={(e) => !form.slug && set("slug", slugify(e.target.value))}
            className="w-full border border-gray-300 bg-white px-3 py-2 text-lg outline-none focus:border-black"
          />
        </Field>
        <Field label="Slug">
          <input
            value={form.slug ?? ""}
            onChange={(e) => set("slug", e.target.value)}
            className="w-full border border-gray-300 bg-white px-3 py-2 outline-none focus:border-black"
          />
        </Field>
        <Field label="Dek (subheadline)">
          <textarea
            rows={2}
            value={form.dek ?? ""}
            onChange={(e) => set("dek", e.target.value)}
            className="w-full border border-gray-300 bg-white px-3 py-2 outline-none focus:border-black"
          />
        </Field>
        <Field label="Body">
          <RichTextEditor
            value={form.body ?? ""}
            onChange={(value) => set("body", value)}
          />
        </Field>
        <Field label="Hero caption">
          <input
            value={form.hero_caption ?? ""}
            onChange={(e) => set("hero_caption", e.target.value)}
            className="w-full border border-gray-300 bg-white px-3 py-2 outline-none focus:border-black"
          />
        </Field>
        <Field label="Embedded post link">
          <input
            value={form.embed_url ?? ""}
            onChange={(e) => set("embed_url", e.target.value)}
            placeholder="Instagram, Twitter/X, TikTok ya kisi post ka link"
            className="w-full border border-gray-300 bg-white px-3 py-2 outline-none focus:border-black"
          />
          <div className="mt-1 text-xs text-muted-foreground">
            Photo upload aur post embed link dono ek sath save ho sakte hain.
          </div>
        </Field>
      </div>

      <aside className="space-y-4">
        <div className="border border-gray-200 bg-gray-50 p-4">
          <div className="text-xs font-black uppercase tracking-widest text-black mb-3">Publish</div>
          <label className="mb-2 block text-sm">
            Status
            <select
              value={form.status ?? "draft"}
              onChange={(e) => set("status", e.target.value as any)}
              className="mt-1 w-full border border-gray-300 bg-white px-2 py-1.5"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </label>
          <label className="mb-2 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!form.is_breaking}
              onChange={(e) => set("is_breaking", e.target.checked)}
            />
            Mark as breaking
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!form.is_featured}
              onChange={(e) => set("is_featured", e.target.checked)}
            />
            Featured on home
          </label>
          <Field label="Category">
            <select
              value={categoryId ?? ""}
              onChange={(e) => set("category_id", e.target.value ? Number(e.target.value) : null)}
              className="w-full border border-gray-300 bg-white px-2 py-1.5"
            >
              <option value="">— None —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="border border-gray-200 bg-gray-50 p-4">
          <div className="text-xs font-black uppercase tracking-widest text-black mb-3">Hero Image</div>
          {form.hero_image_hd && <img src={form.hero_image_hd} alt="" className="mb-2 w-full" />}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
            className="w-full"
          />
          {uploading && <div className="text-sm text-black mt-2">Uploading…</div>}
          <input
            placeholder="…or paste image URL"
            value={form.hero_image_hd ?? ""}
            onChange={(e) => {
              set("hero_image_hd", e.target.value);
              set("hero_image_lq", e.target.value);
            }}
            className="mt-2 w-full border border-gray-300 bg-white px-2 py-1.5 text-xs"
          />
        </div>

        {err && (
          <div className="border border-red-500 bg-red-50 p-3 text-xs">{err}</div>
        )}
        <button
          disabled={saving}
          className="bg-black text-white hover:bg-gray-800 w-full py-3 font-black uppercase tracking-widest disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save Article"}
        </button>
      </aside>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs font-black uppercase tracking-widest text-black mb-1.5">{label}</div>
      {children}
    </label>
  );
}

function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editorRef.current) return;
    if (editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "<p></p>";
    }
  }, [value]);

  function syncValue() {
    const html = editorRef.current?.innerHTML?.trim() || "";
    onChange(html === "<p></p>" ? "" : html);
  }

  function run(command: string, commandValue?: string) {
    const selection = window.getSelection();
    const hasSelection =
      !!selection &&
      selection.rangeCount > 0 &&
      !selection.getRangeAt(0).collapsed &&
      editorRef.current?.contains(selection.anchorNode);

    const selectionRequiredCommands = new Set(["bold", "italic", "underline"]);
    if (selectionRequiredCommands.has(command) && !hasSelection) {
      editorRef.current?.focus();
      return;
    }

    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    syncValue();
  }

  return (
    <div className="overflow-hidden border border-gray-300 bg-white">
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-gray-50 p-2">
        <ToolbarGroup>
          <ToolbarButton label="Bold" icon={Bold} onClick={() => run("bold")} />
          <ToolbarButton label="Italic" icon={Italic} onClick={() => run("italic")} />
          <ToolbarButton label="Underline" icon={Underline} onClick={() => run("underline")} />
        </ToolbarGroup>

        <ToolbarGroup>
          <ToolbarButton label="Left" icon={AlignLeft} onClick={() => run("justifyLeft")} />
          <ToolbarButton label="Center" icon={AlignCenter} onClick={() => run("justifyCenter")} />
          <ToolbarButton label="Right" icon={AlignRight} onClick={() => run("justifyRight")} />
          <ToolbarButton label="Justify" icon={AlignJustify} onClick={() => run("justifyFull")} />
        </ToolbarGroup>

        <ToolbarGroup>
          <ToolbarButton label="Bullets" icon={List} onClick={() => run("insertUnorderedList")} />
          <ToolbarButton label="Numbered" icon={ListOrdered} onClick={() => run("insertOrderedList")} />
        </ToolbarGroup>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={syncValue}
        onBlur={syncValue}
        className="min-h-[420px] w-full px-4 py-4 text-[15px] leading-7 outline-none"
      />
      <div className="border-t border-gray-200 bg-gray-50 px-3 py-2 text-xs text-muted-foreground">
        Blogger style basic editor: formatting, alignment, aur lists.
      </div>
    </div>
  );
}

function ToolbarGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-1 rounded-md border border-gray-200 bg-white p-1">{children}</div>;
}

function ToolbarButton({
  label,
  icon: Icon,
  onClick,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded border border-transparent bg-white text-black hover:border-gray-300 hover:bg-gray-50"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

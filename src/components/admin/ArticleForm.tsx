import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  articleService,
  categoryService,
  normalizeMediaUrl,
  type Article,
} from "@/services/articleService";
import { getApiUrl } from "@/lib/api";
import { toast } from "sonner";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Share2 as PostEmbedIcon,
  Underline,
  Unlink,
  Video as VideoIcon,
} from "lucide-react";

let _removeStylesInjected = false;
function ensureRemoveStylesInjected() {
  if (_removeStylesInjected) return;
  _removeStylesInjected = true;
  const id = "art-inline-remove-styles";
  if (document.getElementById(id)) return;
  const style = document.createElement("style");
  style.id = id;
  style.textContent =
    "" +
    ".art-inline-remove{" +
    "  display:inline-flex; align-items:center; gap:6px;" +
    "  padding:5px 12px;" +
    "  font-size:12px; line-height:1;" +
    "  font-weight:700; text-transform:uppercase; letter-spacing:.04em;" +
    "  background:rgb(220 38 38);" +
    "  color:#fff;" +
    "  border-radius:9999px;" +
    "  border:1px solid rgb(0 0 0 / 0.1);" +
    "  box-shadow:0 6px 14px rgb(0 0 0 / 0.18);" +
    "  cursor:pointer;" +
    "  white-space:nowrap;" +
    "  user-select:none;" +
    "  transition:transform .08s ease, background .15s ease, opacity .15s ease;" +
    "}" +
    ".art-inline-remove:hover{ background:#7f1d1d; transform:translateY(-1px); color:#fff }" +
    ".art-inline-row{" +
    "  display:flex; align-items:center; justify-content:space-between; gap:8px;" +
    "  padding-top:6px;" +
    "}" +
    ".art-inline-wrap{" +
    "  position:relative; background:transparent !important;" +
    "}" +
    ".art-inline-wrap:hover{ outline:2px dashed #6b7280; outline-offset:3px; border-radius:10px; }" +
    ".art-inline-wrap iframe{ display:block !important; border:0 !important; background:transparent !important; width:100% !important; height:100% !important; }" +
    ".art-inline-caption{" +
    "  margin:0; font-size:12px; color:#4b5563; flex:1 1 auto; min-width:0;" +
    "}" +
    ".art-rich-editor a, .art-rich-editor a:visited, .art-editor-link, [contenteditable] a{" +
    "  color:#1d4ed8 !important;" +
    "  text-decoration:underline !important;" +
    "  text-decoration-thickness:1.5px !important;" +
    "  text-underline-offset:3px !important;" +
    "  font-weight:600 !important;" +
    "  cursor:pointer !important;" +
    "}" +
    ".art-rich-editor a:hover, .art-editor-link:hover, [contenteditable] a:hover{" +
    "  color:#1e40af !important;" +
    "  text-decoration:underline !important;" +
    "}" +
    "";
  document.head.appendChild(style);
}

type Props = {
  initial?: Partial<Article>;
  onSaved: (a: any) => void;
  uploadingState?: {
    uploading: boolean;
    progress: number | null;
    setUploading: (v: boolean) => void;
    setProgress: (p: number | null) => void;
  };
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 90);
}

function stripTransientHtml(sourceHtml: string): string {
  if (!sourceHtml) return "";
  const scratch = document.createElement("div");
  scratch.innerHTML = sourceHtml;
  scratch.querySelectorAll("button.art-inline-remove, [data-art-remove='1']").forEach((b) => b.remove());
  scratch.querySelectorAll(".art-inline-row").forEach((r) => r.remove());
  scratch.querySelectorAll<HTMLElement>('[data-art-block="1"]').forEach((blk) => {
    blk.classList.remove("art-inline-wrap");
    blk.removeAttribute("data-art-block");
  });
  scratch.querySelectorAll("figcaption").forEach((fc) => fc.remove());
  return scratch.innerHTML.trim();
}

export function ArticleForm({ initial, onSaved, uploadingState }: Props) {
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
  const [localUploading, setLocalUploading] = useState(false);
  const [localUploadProgress, setLocalUploadProgress] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState(false);
  const [titleError, setTitleError] = useState(false);
  const [dekError, setDekError] = useState(false);
  const [heroImageError, setHeroImageError] = useState(false);

  const titleRef = useRef<HTMLInputElement>(null);
  const dekRef = useRef<HTMLTextAreaElement>(null);
  const heroBoxRef = useRef<HTMLDivElement>(null);

  const isUploading = uploadingState ? uploadingState.uploading : localUploading;
  const progressPct = uploadingState ? uploadingState.progress : localUploadProgress;
  const setIsUploading = uploadingState?.setUploading ?? setLocalUploading;
  const setProgressPct = uploadingState?.setProgress ?? setLocalUploadProgress;

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
    const setU = setIsUploading;
    const setP = setProgressPct;
    const setE = setErr;
    setU(true);
    setP(0);
    setE(null);
    try {
      const prepared = await maybeCompressImage(file);
      const formData = new FormData();
      formData.append("image", prepared);
      const data = await uploadWithProgress(getApiUrl("/upload"), formData, (p) => setP(p));
      const normalizedImg = normalizeMediaUrl(data.imageUrl);
      set("hero_image_hd", normalizedImg);
      set("hero_image_lq", normalizedImg);
      setHeroImageError(false);
      setP(100);
      toast.success("Image uploaded successfully!");
    } catch (e: any) {
      setE(e.message);
      toast.error(e.message || "Upload failed.");
    } finally {
      setU(false);
      setP(null);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    const titleTrimmed = (form.title || "").trim();
    if (!titleTrimmed) {
      setTitleError(true);
      toast.error("Please enter a title before saving the article.");
      titleRef.current?.focus();
      return;
    }
    setTitleError(false);

    const dekTrimmed = (form.dek || "").trim();
    if (!dekTrimmed) {
      setDekError(true);
      toast.error("Please enter a description (dek) before saving the article.");
      dekRef.current?.focus();
      return;
    }
    setDekError(false);

    if (!categoryId) {
      setCategoryError(true);
      toast.error("Please select a category before saving the article.");
      return;
    }
    setCategoryError(false);

    const heroImage = (form.hero_image_hd || form.hero_image_lq || "").trim();
    if (!heroImage) {
      setHeroImageError(true);
      toast.error("Please upload or provide a hero image before saving the article.");
      heroBoxRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setHeroImageError(false);

    setSaving(true);
    try {
      const payload: Partial<Article> = {
        ...form,
        title: titleTrimmed,
        dek: dekTrimmed,
        hero_image_hd: heroImage,
        hero_image_lq: heroImage,
        category_id: categoryId,
        slug: (form.slug && form.slug.length > 0 ? form.slug : slugify(titleTrimmed)) as string,
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
        <Field
          label={
            <span>
              Title <span className="text-red-600">*</span>
            </span>
          }
        >
          <input
            ref={titleRef}
            required
            value={form.title ?? ""}
            onChange={(e) => {
              set("title", e.target.value);
              if (e.target.value.trim() && titleError) setTitleError(false);
            }}
            onBlur={(e) => !form.slug && set("slug", slugify(e.target.value))}
            className={`w-full border bg-white px-3 py-2 text-lg outline-none transition-colors ${
              titleError
                ? "border-red-500 focus:border-red-600"
                : "border-gray-300 focus:border-black"
            }`}
            placeholder="Enter article title…"
          />
          {titleError && (
            <p className="mt-1 text-xs text-red-600 font-semibold">
              Article title is required — cannot save without a title.
            </p>
          )}
        </Field>
        <Field label="Slug">
          <input
            value={form.slug ?? ""}
            onChange={(e) => set("slug", e.target.value)}
            className="w-full border border-gray-300 bg-white px-3 py-2 outline-none focus:border-black"
          />
        </Field>
        <Field
          label={
            <span>
              Description / Dek <span className="text-red-600">*</span>
            </span>
          }
        >
          <textarea
            ref={dekRef}
            rows={2}
            value={form.dek ?? ""}
            onChange={(e) => {
              set("dek", e.target.value);
              if (e.target.value.trim() && dekError) setDekError(false);
            }}
            className={`w-full border bg-white px-3 py-2 outline-none transition-colors ${
              dekError
                ? "border-red-500 focus:border-red-600"
                : "border-gray-300 focus:border-black"
            }`}
            placeholder="Enter a brief description / dek for the article…"
          />
          {dekError && (
            <p className="mt-1 text-xs text-red-600 font-semibold">
              Description is required — cannot save without a description.
            </p>
          )}
        </Field>
        <Field label="Body">
          <RichTextEditor
            value={form.body ?? ""}
            onChange={(value) => set("body", value)}
            uploadingState={uploadingState}
          />
        </Field>
        <Field label="Hero caption">
          <input
            value={form.hero_caption ?? ""}
            onChange={(e) => set("hero_caption", e.target.value)}
            className="w-full border border-gray-300 bg-white px-3 py-2 outline-none focus:border-black"
          />
        </Field>
        <Field label="Embedded post or video link (Instagram, Facebook, X, YouTube, TikTok...)">
          <input
            value={form.embed_url ?? ""}
            onChange={(e) => {
              let val = e.target.value;
              if (
                val.includes("<blockquote") ||
                val.includes("<iframe") ||
                val.includes("data-instgrm-permalink")
              ) {
                const match =
                  val.match(/data-instgrm-permalink="([^"]+)"/i) ||
                  val.match(/data-embed-permalink="([^"]+)"/i) ||
                  val.match(/src="([^"]+)"/i) ||
                  val.match(/href="([^"]+)"/i);
                if (match) {
                  val = match[1].replace(/^`|`$/g, "").replace(/&amp;/g, "&").trim();
                }
              }
              set("embed_url", val);
            }}
            placeholder="Instagram, Facebook, X / Twitter, YouTube, TikTok, Threads post or video link"
            className="w-full border border-gray-300 bg-white px-3 py-2 outline-none focus:border-black"
          />
          <div className="mt-1 text-xs text-muted-foreground">
            Hero photo upload aur post/video embed link dono ek sath save ho sakte hain.
          </div>
        </Field>
      </div>

      <aside className="space-y-4">
        <div className="border border-gray-200 bg-gray-50 p-4">
          <div className="text-xs font-black uppercase tracking-widest text-black mb-3">
            Publish
          </div>
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
          <Field
            label={
              <span>
                Category <span className="text-red-600">*</span>
              </span>
            }
          >
            <select
              value={categoryId ?? ""}
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : null;
                set("category_id", val);
                if (val && categoryError) setCategoryError(false);
              }}
              className={`w-full border bg-white px-2 py-1.5 ${
                categoryError
                  ? "border-red-500 focus:border-red-600"
                  : "border-gray-300 focus:border-black"
              }`}
              aria-invalid={categoryError || undefined}
              aria-describedby={categoryError ? "category-error" : undefined}
            >
              <option value="">— Select Category —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {categoryError && (
              <p id="category-error" className="mt-1 text-xs text-red-600 font-semibold">
                Please select a category — you cannot save an article without one.
              </p>
            )}
          </Field>
        </div>
        <div
          ref={heroBoxRef}
          className={`border p-4 transition-colors ${
            heroImageError
              ? "border-red-500 bg-red-50/40"
              : "border-gray-200 bg-gray-50"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-black uppercase tracking-widest text-black">
              Hero Image <span className="text-red-600">*</span>
            </div>
            {heroImageError && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-600">
                Required
              </span>
            )}
          </div>
          {form.hero_image_hd && (
            <div className="relative mb-2 group">
              <img src={normalizeMediaUrl(form.hero_image_hd)} alt="" className="w-full block" />
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  set("hero_image_hd", "");
                  set("hero_image_lq", "");
                  setHeroImageError(true);
                  toast.success("Hero image removed.");
                }}
                className="absolute top-2 right-2 z-20 bg-black/80 hover:bg-black text-white text-xs font-bold uppercase rounded px-2 py-1 flex items-center gap-1 shadow"
                title="Remove hero image"
              >
                🗑 Remove
              </button>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
            className="w-full text-xs"
          />
          {isUploading && (
            <div className="text-sm text-black mt-2">
              Uploading…
              {typeof progressPct === "number" ? ` ${progressPct}%` : ""}
            </div>
          )}
          {typeof progressPct === "number" && progressPct > 0 && (
            <div className="mt-2 w-full overflow-hidden rounded-full bg-gray-200 h-2">
              <div
                className="h-full bg-black transition-all"
                style={{ width: `${Math.max(0, Math.min(100, progressPct))}%` }}
              />
            </div>
          )}
          <input
            placeholder="…or paste image URL"
            value={form.hero_image_hd ?? ""}
            onChange={(e) => {
              const val = e.target.value;
              set("hero_image_hd", val);
              set("hero_image_lq", val);
              if (val.trim() && heroImageError) setHeroImageError(false);
            }}
            className={`mt-2 w-full border bg-white px-2 py-1.5 text-xs outline-none ${
              heroImageError
                ? "border-red-500 focus:border-red-600"
                : "border-gray-300 focus:border-black"
            }`}
          />
          {heroImageError && (
            <p className="mt-2 text-xs text-red-600 font-semibold">
              Hero image is required — please upload an image or paste an image URL.
            </p>
          )}
        </div>

        {err && <div className="border border-red-500 bg-red-50 p-3 text-xs">{err}</div>}
        <button
          disabled={saving || isUploading || (typeof progressPct === "number" && progressPct < 100)}
          className="bg-black text-white hover:bg-gray-800 w-full py-3 font-black uppercase tracking-widest disabled:opacity-60"
          title={
            isUploading || (typeof progressPct === "number" && progressPct < 100)
              ? "Wait until the upload finishes (100%) before saving."
              : undefined
          }
        >
          {saving
            ? "Saving…"
            : isUploading || (typeof progressPct === "number" && progressPct < 100)
              ? `Uploading… ${typeof progressPct === "number" ? progressPct + "%" : ""}`
              : "Save Article"}
        </button>
      </aside>
    </form>
  );
}

async function maybeCompressImage(file: File) {
  if (!file.type.startsWith("image/")) return file;
  const HD_CUTOFF_BYTES = 6 * 1024 * 1024;
  if (file.size <= HD_CUTOFF_BYTES) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const maxDim = 2560;
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(
        (b) => resolve(b),
        file.type === "image/png" ? "image/png" : "image/jpeg",
        0.88,
      ),
    );
    if (!blob) return file;
    if (blob.size >= file.size) return file;

    const baseName = file.name.replace(/\.[^.]+$/, "");
    const ext = file.type === "image/png" ? "png" : "jpg";
    return new File([blob], `${baseName}.${ext}`, {
      type: file.type === "image/png" ? "image/png" : "image/jpeg",
    });
  } catch {
    return file;
  }
}

async function uploadWithProgress(
  url: string,
  formData: FormData,
  onProgress: (p: number) => void,
): Promise<any> {
  return await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.responseType = "json";
    // Prevent cached "instant 100%" false jumps; emit 0 at start so UI updates
    onProgress(0);

    xhr.upload.onprogress = (e) => {
      if (!e.lengthComputable) return;
      const p = Math.round((e.loaded / e.total) * 100);
      onProgress(Math.max(0, Math.min(100, p)));
    };

    xhr.onload = () => {
      const status = xhr.status;
      const json = xhr.response;
      if (status >= 200 && status < 300) {
        resolve(json);
        return;
      }

      const errorFromJson = json && typeof json === "object" ? json.error : null;
      if (errorFromJson) {
        reject(new Error(String(errorFromJson)));
        return;
      }

      const text = xhr.responseText || "";
      if (text) {
        try {
          const parsed = JSON.parse(text);
          if (parsed?.error) return reject(new Error(String(parsed.error)));
        } catch {}
        return reject(new Error(text));
      }

      reject(new Error("Upload failed"));
    };

    xhr.onerror = () => reject(new Error("Network error"));
    xhr.send(formData);
  });
}

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
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
  uploadingState,
}: {
  value: string;
  onChange: (value: string) => void;
  uploadingState?: {
    uploading: boolean;
    progress: number | null;
    setUploading: (v: boolean) => void;
    setProgress: (p: number | null) => void;
  };
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const pendingUploadsRef = useRef(0);
  const perFileProgressRef = useRef<Map<number, number>>(new Map());
  const uploadTokenRef = useRef(0);
  const attachedBtnsRef = useRef<Set<HTMLButtonElement>>(new Set());

  const savedRangeRef = useRef<Range | null>(null);
  const [linkModal, setLinkModal] = useState<{
    isOpen: boolean;
    text: string;
    url: string;
    openInNewTab: boolean;
  }>({
    isOpen: false,
    text: "",
    url: "",
    openInNewTab: true,
  });
  const [embedModal, setEmbedModal] = useState<{ isOpen: boolean; url: string }>({
    isOpen: false,
    url: "",
  });

  useEffect(() => {
    if (!editorRef.current) return;
    // If the user is currently editing / focused in this editor, DO NOT overwrite innerHTML!
    const isFocused =
      document.activeElement === editorRef.current ||
      editorRef.current.contains(document.activeElement);
    if (isFocused) return;

    const currentStripped = stripTransientHtml(editorRef.current.innerHTML);
    const valueStripped = stripTransientHtml(value || "");
    if (currentStripped !== valueStripped) {
      editorRef.current.innerHTML = value || "<p></p>";
      setTimeout(() => {
        if (editorRef.current) inventoryAll();
      }, 0);
    }
  }, [value]);

  useEffect(() => {
    if (!editorRef.current) return;
    const editor = editorRef.current;
    ensureRemoveStylesInjected();

    function isRemovableBlock(el: HTMLElement | null | undefined): boolean {
      if (!el) return false;
      if (el.getAttribute && el.getAttribute("data-art-block") === "1") return true;
      return false;
    }

    function getRemoveBtnOfBlock(block: HTMLElement): HTMLButtonElement | null {
      return block.querySelector<HTMLButtonElement>("button.art-inline-remove");
    }

    function makeRemoveBtn(block: HTMLElement): HTMLButtonElement {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "art-inline-remove";
      btn.setAttribute("title", "Remove this block");
      btn.setAttribute("contenteditable", "false");
      btn.setAttribute("data-art-remove", "1");
      btn.innerHTML = '<span aria-hidden="true" style="pointer-events:none">🗑 Remove</span>';
      btn.addEventListener("mousedown", (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        removeBlock(block);
      });
      btn.addEventListener("mouseover", (e) => e.stopPropagation());
      btn.addEventListener("mouseout", (e) => e.stopPropagation());
      attachedBtnsRef.current.add(btn);
      return btn;
    }

    function setupFigureBlock(fig: HTMLElement) {
      fig.setAttribute("data-art-block", "1");
      fig.setAttribute("contenteditable", "false");
      fig.classList.add("art-inline-wrap");

      // Strictly ensure there is AT MOST ONE button.art-inline-remove inside this figure
      const existingBtns = Array.from(fig.querySelectorAll<HTMLButtonElement>("button.art-inline-remove"));
      if (existingBtns.length > 0) {
        // Keep only the first one, delete all duplicate buttons
        for (let i = 1; i < existingBtns.length; i++) {
          attachedBtnsRef.current.delete(existingBtns[i]);
          existingBtns[i].remove();
        }
        return;
      }

      // If no button exists yet, create exactly one row + button
      const row = document.createElement("div");
      row.className = "art-inline-row";
      row.setAttribute("contenteditable", "false");
      row.setAttribute("data-art-remove", "1");
      row.style.background = "transparent";
      row.appendChild(makeRemoveBtn(fig));
      fig.appendChild(row);
    }

    function wrapBareMedia(block: HTMLElement) {
      // Double check: if it is ALREADY inside any figure, DO NOT wrap!
      if (block.closest("figure")) return;

      const fig = document.createElement("figure");
      fig.setAttribute("data-art-block", "1");
      fig.setAttribute("contenteditable", "false");
      fig.classList.add("art-inline-wrap");
      fig.style.margin = "0";
      fig.style.padding = "0";
      fig.style.background = "transparent";
      const style = block.getAttribute("style") || "";
      if (style) fig.style.cssText = style;
      const prev = block.previousSibling;
      const parent = block.parentElement || editor;
      if (prev) prev.after(fig);
      else parent.insertBefore(fig, parent.firstChild);
      fig.appendChild(block);
      setupFigureBlock(fig);
    }

    function inventoryAll() {
      if (!editor) return;

      // 1. Process all top-level figures (ignore nested figures)
      const figures = Array.from(editor.querySelectorAll<HTMLElement>("figure"));
      figures.forEach((fig) => {
        if (fig.parentElement?.closest("figure")) {
          // If a figure was accidentally nested inside another figure, strip duplicate wrapper
          fig.removeAttribute("data-art-block");
          fig.querySelectorAll(".art-inline-row, .art-inline-remove").forEach((r) => r.remove());
          return;
        }
        setupFigureBlock(fig);
      });

      // 2. Only wrap TRULY BARE media elements that are NOT inside ANY figure (no anchor wrapping):
      const bareMedia = Array.from(
        editor.querySelectorAll<HTMLElement>(
          "video, iframe, blockquote.twitter-tweet, blockquote.instagram-media, blockquote.fb-post, blockquote.tiktok-embed",
        ),
      ).filter((el) => !el.closest("figure"));

      bareMedia.forEach((el) => {
        wrapBareMedia(el);
      });
    }

    function removeBlock(block: HTMLElement) {
      // Remove the full art-block wrapper (figure) - media + row go together
      const toRemove = block.closest<HTMLElement>('[data-art-block="1"]') || block;
      const prevEl = toRemove.previousElementSibling;
      const nextEl = toRemove.nextElementSibling;
      const prevText = toRemove.previousSibling;
      const nextText = toRemove.nextSibling;
      const btns = toRemove.querySelectorAll<HTMLButtonElement>("button.art-inline-remove");
      btns.forEach((b) => attachedBtnsRef.current.delete(b));
      toRemove.remove();
      // Tight cleanup of space (leave NO extra empty gap) — remove preceding empty P AND succeeding empty P (both) if they surround the removed block
      const isEmptyParagraph = (n: Element | null): n is HTMLElement => {
        if (!n || n.tagName !== "P") return false;
        const txt = (n.textContent || "").trim() === "";
        const hasOnlyBreaks =
          n.children.length === 0 ||
          (n.children.length === 1 && (n.children[0] as HTMLElement).tagName === "BR");
        return txt && hasOnlyBreaks;
      };
      if (isEmptyParagraph(prevEl)) prevEl.remove();
      if (isEmptyParagraph(nextEl)) nextEl.remove();
      if (prevText && prevText.nodeType === 3 && (prevText.textContent || "").trim() === "")
        prevText.remove();
      if (nextText && nextText.nodeType === 3 && (nextText.textContent || "").trim() === "")
        nextText.remove();
      // Ensure editor has a minimal trailing <p> for typing
      const last = editor.lastElementChild;
      if (!last || last.tagName !== "P") {
        const p = document.createElement("p");
        p.innerHTML = "<br>";
        editor.appendChild(p);
      }
      syncValue();
    }

    // Inventory on mount + after DOM changes (insert/upload complete adds nodes etc.)
    let pendingSync = 0;
    function scheduleSync() {
      if (pendingSync) return;
      pendingSync = window.setTimeout(() => {
        pendingSync = 0;
        try {
          syncValue();
        } catch {}
      }, 120);
    }

    let isInventorying = false;
    const io = new MutationObserver((mutations) => {
      if (isInventorying) return;

      // Ignore mutations that only touch our internal remove buttons / rows
      const onlyUiMutations = mutations.every((m) => {
        const changedNodes = [...Array.from(m.addedNodes), ...Array.from(m.removedNodes)];
        return (
          changedNodes.length > 0 &&
          changedNodes.every((node) => {
            if (node.nodeType === 1) {
              const el = node as HTMLElement;
              return (
                el.classList?.contains("art-inline-row") ||
                el.classList?.contains("art-inline-remove") ||
                el.getAttribute?.("data-art-remove") === "1"
              );
            }
            return false;
          })
        );
      });
      if (onlyUiMutations) return;

      // Disconnect observer during inventory to PREVENT ANY RECURSIVE LOOP
      isInventorying = true;
      io.disconnect();
      try {
        inventoryAll();
      } finally {
        io.observe(editor, { childList: true, subtree: true });
        isInventorying = false;
      }
      scheduleSync();
    });

    io.observe(editor, { childList: true, subtree: true });
    inventoryAll();

    // While typing normal text, only sync value - do not re-scan or rebuild UI!
    editor.addEventListener("input", () => {
      scheduleSync();
    });

    // Paste-time HTML sanitizer: intercepts pasted HTML and cleans it
    // BEFORE it enters the contentEditable DOM. Eliminates:
    //   - <script> / <style> / <noscript> / <template> / SVG / object / form / inputs
    //   - inline event handlers (onerror=, onclick=, ...)
    //   - javascript: URLs
    //   - entity-escaped dangerous tags (copy-paste from code viewers)
    //   - collapses raw-pasted social widget blockquotes (instagram/twitter/fb/tiktok)
    //     with full skeleton into clean minimal embeds
    function sanitizePastedHtml(markup: string): string {
      if (!markup) return "";
      let safe = markup;
      safe = safe.replace(/<!--[\s\S]*?-->/g, "");
      // Entity-escaped dangerous tags that would paste as visible raw text
      safe = safe.replace(/&lt;script[\s\S]*?&gt;[\s\S]*?&lt;\/script&gt;/gi, "");
      safe = safe.replace(/&lt;style[\s\S]*?&gt;[\s\S]*?&lt;\/style&gt;/gi, "");
      safe = safe.replace(/&lt;noscript[\s\S]*?&gt;[\s\S]*?&lt;\/noscript&gt;/gi, "");
      safe = safe.replace(/&lt;template[\s\S]*?&gt;[\s\S]*?&lt;\/template&gt;/gi, "");
      safe = safe.replace(/&lt;svg[\s\S]*?&gt;[\s\S]*?&lt;\/svg&gt;/gi, "");
      // Full blocks (tag + content)
      safe = safe.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
      safe = safe.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "");
      safe = safe.replace(/<noscript[\s\S]*?>[\s\S]*?<\/noscript>/gi, "");
      safe = safe.replace(/<template[\s\S]*?>[\s\S]*?<\/template>/gi, "");
      safe = safe.replace(/<svg[\s\S]*?>[\s\S]*?<\/svg>/gi, "");
      safe = safe.replace(/<object[\s\S]*?>[\s\S]*?<\/object>/gi, "");
      safe = safe.replace(/<embed[\s\S]*?\/?>/gi, "");
      safe = safe.replace(/<applet[\s\S]*?>[\s\S]*?<\/applet>/gi, "");
      safe = safe.replace(/<form[\s\S]*?>[\s\S]*?<\/form>/gi, "");
      safe = safe.replace(/<input[\s\S]*?\/?>/gi, "");
      safe = safe.replace(/<button[\s\S]*?>[\s\S]*?<\/button>/gi, "");
      safe = safe.replace(/<textarea[\s\S]*?>[\s\S]*?<\/textarea>/gi, "");
      safe = safe.replace(/<select[\s\S]*?>[\s\S]*?<\/select>/gi, "");
      // Event handlers (quoted and unquoted)
      safe = safe.replace(/\son\w+(\s)*=(\s)*"[^"]*"/gi, "");
      safe = safe.replace(/\son\w+(\s)*=(\s)*'[^']*'/gi, "");
      safe = safe.replace(/\son\w+(\s)*=(\s)*[^\s>]+/gi, "");
      safe = safe.replace(/javascript:/gi, "");
      safe = safe.replace(/vbscript:/gi, "");
      // Collapse messy raw-pasted social blockquote skeletons into clean ones
      // (match instagram-media / twitter-tweet / fb-post / tiktok-embed classes)
      safe = safe.replace(
        /<figure[^>]*>\s*(<blockquote[^>]*class="[^"]*(?:twitter-tweet|instagram-media|fb-post|tiktok-embed)[^"]*"[^>]*>)[\s\S]*?(<\/blockquote>)\s*<\/figure>/gi,
        (_m, open, close) => cleanEmbedBlockquote(open, close),
      );
      safe = safe.replace(
        /(<blockquote[^>]*class="[^"]*(?:twitter-tweet|instagram-media|fb-post|tiktok-embed)[^"]*"[^>]*>)[\s\S]*?(<\/blockquote>)/gi,
        (_m, open, close) => cleanEmbedBlockquote(open, close),
      );
      return safe;
    }
    function cleanEmbedBlockquote(openTag: string, closeTag: string): string {
      // Try to extract permalink from the opening tag attributes
      const permalink =
        (openTag.match(/data-instgrm-permalink="([^"]*)"/i) || [])[1] ||
        (openTag.match(/data-embed-permalink="([^"]*)"/i) || [])[1] ||
        (openTag.match(/cite="([^"]*)"/i) || [])[1] ||
        (openTag.match(/data-href="([^"]*)"/i) || [])[1] ||
        "";
      const stripped = permalink.replace(/^`|`$/g, "").trim();
      let safeLink = stripped;
      try {
        const u = new URL(stripped);
        if (u.protocol !== "http:" && u.protocol !== "https:") safeLink = "";
      } catch {
        safeLink = "";
      }
      // Clean the open tag of backticks in known attributes
      let cleanOpen = openTag;
      if (safeLink) {
        cleanOpen = cleanOpen
          .replace(/data-instgrm-permalink="`?[^"`]*`?"/i, `data-instgrm-permalink="${safeLink}"`)
          .replace(/cite="`?[^"`]*`?"/i, `cite="${safeLink}"`)
          .replace(/data-href="`?[^"`]*`?"/i, `data-href="${safeLink}"`);
      }
      const clsMatch = cleanOpen.match(/class="([^"]*)"/i);
      const cls = clsMatch?.[1] || "";
      let label = "View this post";
      if (/instagram-media/.test(cls)) label = "View this post on Instagram";
      else if (/twitter-tweet/.test(cls)) label = "View this post on X / Twitter";
      else if (/fb-post/.test(cls)) label = "View this post on Facebook";
      else if (/tiktok-embed/.test(cls)) label = "View this post on TikTok";
      const link = safeLink
        ? `<a href="${safeLink}" target="_blank" rel="noreferrer noopener nofollow">${label}</a>`
        : label;
      // Remove trailing /> or > of open tag, ensure it re-closes properly
      const normalizedOpen = cleanOpen.replace(/\/?\s*>$/, "") + ">";
      return `${normalizedOpen}${link}${closeTag}`;
    }
    function onPaste(e: ClipboardEvent) {
      try {
        // Prefer rich text/html from clipboard; if absent, fall back to
        // default plaintext paste behavior (browser handles it, we just inventoryAll)
        const html = e.clipboardData?.getData("text/html");
        if (!html) {
          setTimeout(inventoryAll, 80);
          return;
        }
        e.preventDefault();
        const sanitized = sanitizePastedHtml(html);
        // Insert at cursor
        editorRef.current?.focus();
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0 || !editorRef.current?.contains(sel.anchorNode)) {
          editorRef.current?.insertAdjacentHTML("beforeend", sanitized + "<p><br></p>");
        } else {
          const range = sel.getRangeAt(0);
          range.deleteContents();
          const tmp = document.createElement("div");
          tmp.innerHTML = sanitized;
          const frag = document.createDocumentFragment();
          let last: Node | null = null;
          while (tmp.firstChild) {
            last = tmp.firstChild;
            frag.appendChild(tmp.firstChild);
          }
          range.insertNode(frag);
          if (last) {
            range.setStartAfter(last);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
          }
          // Ensure a paragraph for typing follows at end
          const ed = editorRef.current;
          if (ed && ed.lastElementChild && ed.lastElementChild.tagName !== "P") {
            const p = document.createElement("p");
            p.innerHTML = "<br>";
            ed.appendChild(p);
          }
        }
        syncValue();
        setTimeout(inventoryAll, 80);
      } catch {
        setTimeout(inventoryAll, 80);
      }
    }
    editor.addEventListener("paste", onPaste);

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Backspace" && e.key !== "Delete") return;
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || !editor.contains(sel.anchorNode)) return;
      const range = sel.getRangeAt(0);
      if (!range.collapsed) return;
      let candidate: HTMLElement | null =
        range.startContainer.nodeType === 1
          ? (range.startContainer as HTMLElement)
          : range.startContainer.parentElement;
      while (candidate && candidate !== editor) {
        if (isRemovableBlock(candidate)) {
          e.preventDefault();
          removeBlock(candidate);
          return;
        }
        candidate = candidate.parentElement;
      }
    }
    editor.addEventListener("keydown", onKeyDown, true);

    function onInput() {
      scheduleSync();
    }
    editor.addEventListener("input", onInput);

    return () => {
      io.disconnect();
      editor.removeEventListener("input", onInput);
      editor.removeEventListener("paste", onPaste);
      editor.removeEventListener("keydown", onKeyDown, true);
      attachedBtnsRef.current.forEach((b) => b.remove());
      attachedBtnsRef.current.clear();
    };
  }, []);

  function syncValue() {
    const raw = editorRef.current?.innerHTML ?? "";
    const cleaned = stripTransientHtml(raw);
    const trimmed = cleaned.trim();
    onChange(trimmed === "<p></p>" ? "" : trimmed);
  }

  function run(command: string, commandValue?: string) {
    const selection = window.getSelection();
    const hasSelection =
      !!selection &&
      selection.rangeCount > 0 &&
      !selection.getRangeAt(0).collapsed &&
      editorRef.current?.contains(selection.anchorNode);

    const selectionRequiredCommands = new Set(["bold", "italic", "underline", "createLink"]);
    if (selectionRequiredCommands.has(command) && !hasSelection) {
      editorRef.current?.focus();
      return;
    }

    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    syncValue();
  }

  function insertHtmlAtCursor(html: string) {
    editorRef.current?.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !editorRef.current?.contains(sel.anchorNode)) {
      const el = editorRef.current;
      if (!el) return;
      el.insertAdjacentHTML("beforeend", html);
      syncValue();
      return;
    }
    const range = sel.getRangeAt(0);
    range.deleteContents();
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    const frag = document.createDocumentFragment();
    let lastNode: Node | null = null;
    while (tmp.firstChild) {
      lastNode = tmp.firstChild;
      frag.appendChild(tmp.firstChild);
    }
    range.insertNode(frag);
    if (lastNode) {
      range.setStartAfter(lastNode);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    }
    syncValue();
  }

  function beginUpload() {
    pendingUploadsRef.current += 1;
    uploadingState?.setUploading?.(true);
  }

  function endUpload(tokenId: number, _success: boolean) {
    perFileProgressRef.current.delete(tokenId);
    pendingUploadsRef.current = Math.max(0, pendingUploadsRef.current - 1);
    if (pendingUploadsRef.current === 0) {
      uploadingState?.setProgress?.(null);
      setTimeout(() => uploadingState?.setUploading?.(false), 350);
    } else {
      recomputeAggregateProgress();
    }
  }

  function recomputeAggregateProgress() {
    const map = perFileProgressRef.current;
    if (map.size === 0) {
      uploadingState?.setProgress?.(null);
      return;
    }
    let sum = 0;
    map.forEach((v) => (sum += v));
    const avg = Math.round(sum / map.size);
    uploadingState?.setProgress?.(avg);
  }

  function fileIsVideo(file: File) {
    return file.type.startsWith("video/");
  }

  function figureImageHtml(src: string, alt?: string) {
    const safeAlt = String(alt || "").replace(/"/g, "&quot;");
    const safeSrc = String(src).replace(/"/g, "&quot;");
    return (
      '<figure class="my-6 flex flex-col items-center bg-white">' +
      `<img src="${safeSrc}" alt="${safeAlt}" class="w-full max-w-full rounded border border-gray-200 bg-white" loading="lazy" />` +
      "</figure><p><br></p>"
    );
  }

  function figureVideoHtml(src: string, label?: string) {
    const safeSrc = String(src).replace(/"/g, "&quot;");
    return (
      '<figure class="my-6 flex flex-col items-center justify-center w-full mx-auto text-center bg-white">' +
      '<div class="w-full max-w-[580px] mx-auto overflow-hidden rounded border border-gray-200 bg-white shadow-sm">' +
      `<video src="${safeSrc}" class="w-full h-auto max-h-[500px] bg-white" controls playsinline preload="metadata" poster=""></video>` +
      "</div>" +
      "</figure><p><br></p>"
    );
  }

  function insertLink() {
    editorRef.current?.focus();
    const sel = window.getSelection();
    let selectedText = "";
    let existingUrl = "";

    if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
      const range = sel.getRangeAt(0);
      savedRangeRef.current = range.cloneRange();
      selectedText = range.toString();

      let node: Node | null = sel.anchorNode;
      while (node && node !== editorRef.current) {
        if (node.nodeType === 1 && (node as HTMLElement).tagName === "A") {
          existingUrl = (node as HTMLAnchorElement).href || "";
          break;
        }
        node = node.parentNode;
      }
    } else {
      savedRangeRef.current = null;
    }

    setLinkModal({
      isOpen: true,
      text: selectedText,
      url: existingUrl || "",
      openInNewTab: true,
    });
  }

  function handleApplyLink() {
    const rawUrl = linkModal.url.trim();
    if (!rawUrl) {
      toast.error("Please enter a link URL.");
      return;
    }
    let finalUrl = rawUrl;
    if (
      !/^https?:\/\//i.test(finalUrl) &&
      !/^mailto:/i.test(finalUrl) &&
      !/^tel:/i.test(finalUrl) &&
      !finalUrl.startsWith("/") &&
      !finalUrl.startsWith("#")
    ) {
      finalUrl = `https://${finalUrl}`;
    }

    // Restore saved selection
    if (savedRangeRef.current) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(savedRangeRef.current);
    }
    editorRef.current?.focus();

    const currentSelectedText = savedRangeRef.current?.toString() || "";
    const displayText = linkModal.text.trim();

    if (currentSelectedText && (!displayText || displayText === currentSelectedText)) {
      run("createLink", finalUrl);
      const anchors = editorRef.current?.querySelectorAll?.("a") ?? [];
      anchors.forEach((aEl) => {
        const a = aEl as HTMLAnchorElement;
        if (!a.href) return;
        const href = a.getAttribute("href") || "";
        if (href && href.trim() !== "#") {
          if (linkModal.openInNewTab) {
            a.setAttribute("target", "_blank");
            a.setAttribute("rel", "noreferrer noopener nofollow");
          } else {
            a.removeAttribute("target");
            a.removeAttribute("rel");
          }
          a.setAttribute("data-link-applied", "1");
          a.classList.add("art-editor-link");
          a.style.color = "#1d4ed8";
          a.style.textDecoration = "underline";
          a.style.fontWeight = "600";
        }
      });
    } else {
      const label = displayText || finalUrl;
      const targetAttr = linkModal.openInNewTab
        ? ' target="_blank" rel="noreferrer noopener nofollow"'
        : "";
      const safeHref = finalUrl.replace(/"/g, "&quot;");
      const safeLabel = label.replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const aHtml = `<a href="${safeHref}"${targetAttr} class="art-editor-link" data-link-applied="1" style="color: #1d4ed8; text-decoration: underline; font-weight: 600;">${safeLabel}</a>`;
      insertHtmlAtCursor(aHtml);
    }

    syncValue();
    setLinkModal({ isOpen: false, text: "", url: "", openInNewTab: true });
    savedRangeRef.current = null;
    toast.success("Link added successfully!");
  }

  function removeLink() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !editorRef.current?.contains(sel.anchorNode)) {
      editorRef.current?.focus();
      return;
    }
    run("unlink");
  }

  async function insertImageInline() {
    editorRef.current?.focus();
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = "image/*,video/*";
    input.onchange = () => {
      const files = Array.from(input.files ?? []).filter(
        (f) => f.type.startsWith("image/") || f.type.startsWith("video/"),
      );
      if (files.length === 0) return;
      uploadMany(files).catch((e) => toast.error(e?.message || "Upload failed"));
    };
    input.click();
  }

  async function uploadMany(files: File[]) {
    const order = files.map((f, i) => ({
      file: f,
      index: i,
      token: ++uploadTokenRef.current,
      done: null as null | { url: string; label: string },
      err: null as unknown,
    }));
    order.forEach((o) => {
      perFileProgressRef.current.set(o.token, 0);
      beginUpload();
    });
    recomputeAggregateProgress();
    const progressFor = (token: number) => (p: number) => {
      perFileProgressRef.current.set(token, p);
      recomputeAggregateProgress();
    };
    await Promise.all(
      order.map(async (o) => {
        try {
          const prepared = fileIsVideo(o.file) ? o.file : await maybeCompressImage(o.file);
          const formData = new FormData();
          formData.append("image", prepared);
          const data = await uploadWithProgress(
            getApiUrl("/upload"),
            formData,
            progressFor(o.token),
          );
          perFileProgressRef.current.set(o.token, 100);
          recomputeAggregateProgress();
          o.done = { url: normalizeMediaUrl(data.imageUrl), label: "" };
          toast.success(
            `${fileIsVideo(o.file) ? "Video" : "Image"} uploaded (${o.index + 1}/${order.length})`,
          );
        } catch (e: any) {
          o.err = e;
        } finally {
          endUpload(o.token, !o.err);
        }
      }),
    );

    // Insert at cursor in original selection order; for each error, toast error
    order
      .sort((a, b) => a.index - b.index)
      .forEach((o) => {
        if (o.err) {
          toast.error(o.err?.message ? o.err.message : `${o.file.name} upload failed`);
          return;
        }
        if (!o.done) return;
        if (fileIsVideo(o.file)) {
          insertHtmlAtCursor(figureVideoHtml(o.done.url, o.done.label));
        } else {
          insertHtmlAtCursor(figureImageHtml(o.done.url, o.done.label));
        }
      });
  }

  async function uploadInline(file: File) {
    return uploadMany([file]);
  }

  function openEmbedModal() {
    editorRef.current?.focus();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    } else {
      savedRangeRef.current = null;
    }
    setEmbedModal({
      isOpen: true,
      url: "",
    });
  }

  function parseUniversalEmbed(input: string): { html: string; platform: string } | null {
    const trimmed = (input || "").trim();
    if (!trimmed) return null;

    // 1. Raw <iframe> pasted directly (from any site / platform)
    if (/<iframe\b[^>]*src="([^"]+)"[^>]*>[\s\S]*?<\/iframe>/i.test(trimmed)) {
      const srcMatch = trimmed.match(/src="([^"]+)"/i);
      const src = srcMatch ? srcMatch[1] : "";
      const isVertical = /\/shorts\//i.test(src) || /tiktok\.com/i.test(src) || /\/reel\//i.test(src);
      const isAudio = /spotify\.com/i.test(src) || /soundcloud\.com/i.test(src);
      const containerClass = isAudio
        ? "w-full max-w-[540px] my-2"
        : isVertical
          ? "aspect-[9/16] w-full max-w-[340px]"
          : "aspect-video w-full max-w-[540px]";
      const cleanIframe = trimmed
        .replace(/width="[^"]*"/gi, 'width="100%"')
        .replace(/height="[^"]*"/gi, isAudio ? 'height="152"' : 'height="100%"')
        .replace(/style="[^"]*"/gi, 'style="border:0; width:100%; height:100%;"');
      return {
        platform: "Custom Embed",
        html:
          `<figure class="inline-embed my-6 flex flex-col items-center justify-center w-full mx-auto text-center bg-transparent" contenteditable="false" data-art-block="1">` +
          `<div class="${containerClass} mx-auto overflow-hidden rounded-xl border border-gray-200 bg-transparent shadow-sm">` +
          cleanIframe +
          `</div></figure><p><br></p>`,
      };
    }

    // 2. Extract URL from <blockquote> or tags if user pasted embed HTML snippet
    let cleanUrl = trimmed;
    if (
      cleanUrl.includes("<blockquote") ||
      cleanUrl.includes("data-instgrm-permalink") ||
      cleanUrl.includes("data-embed-permalink")
    ) {
      const match =
        cleanUrl.match(/data-instgrm-permalink="([^"]+)"/i) ||
        cleanUrl.match(/data-embed-permalink="([^"]+)"/i) ||
        cleanUrl.match(/cite="([^"]+)"/i) ||
        cleanUrl.match(/href="([^"]+)"/i);
      if (match) {
        cleanUrl = match[1].replace(/^`|`$/g, "").replace(/&amp;/g, "&").trim();
      }
    }

    let parsed: URL;
    try {
      parsed = new URL(cleanUrl);
    } catch {
      return null;
    }

    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    const permalink = parsed.toString().replace(/"/g, "&quot;");

    // Instagram: posts, reels, stories, tv, share
    if (host === "instagram.com" || host === "m.instagram.com" || host === "instagr.am") {
      const pathOnly = parsed.pathname.replace(/\/+$/, "") + "/";
      const isReel = pathOnly.startsWith("/reel/") || pathOnly.startsWith("/reels/");
      const cleanLink = `https://www.instagram.com${pathOnly}`;
      const maxW = isReel ? "380px" : "540px";
      const minH = isReel ? "620px" : "560px";
      return {
        platform: isReel ? "Instagram Reel" : "Instagram Post",
        html:
          `<figure class="inline-embed my-8 flex flex-col items-center justify-center w-full max-w-[${maxW}] mx-auto text-center bg-transparent" contenteditable="false" data-art-block="1" data-is-reel="${isReel ? "true" : "false"}">` +
          `<blockquote class="instagram-media mx-auto" data-instgrm-captioned data-instgrm-permalink="${cleanLink}" data-instgrm-version="14" style="background:#FFFFFF; background-color:#FFFFFF; border:0; border-radius:12px; box-shadow:none; margin: 1px auto; max-width:${maxW}; min-width:326px; min-height:${minH}; padding:0; width:calc(100% - 2px); color-scheme:light;">` +
          `<div style="padding:16px; background:#FFFFFF;"><a href="${cleanLink}" target="_blank" rel="noopener noreferrer" style="color:#000000; text-decoration:none; font-weight:600;">View this ${isReel ? "reel" : "post"} on Instagram</a></div>` +
          `</blockquote></figure><p><br></p>`,
      };
    }

    // Facebook: posts, videos, reels, watch, fb.watch, fb.com
    if (
      host === "facebook.com" ||
      host.endsWith(".facebook.com") ||
      host === "fb.watch" ||
      host === "fb.com"
    ) {
      const isVideo =
        permalink.includes("/videos/") ||
        permalink.includes("/watch") ||
        permalink.includes("fb.watch") ||
        permalink.includes("/reel/") ||
        permalink.includes("/reels/");
      const isReel = permalink.includes("/reel/") || permalink.includes("/reels/");
      const fbHref = encodeURIComponent(cleanUrl);
      const iframeSrc = isVideo
        ? `https://www.facebook.com/plugins/video.php?href=${fbHref}&show_text=false&width=auto`
        : `https://www.facebook.com/plugins/post.php?href=${fbHref}&show_text=true&width=auto`;
      const containerClass = isReel
        ? "aspect-[9/16] max-w-[340px]"
        : isVideo
          ? "aspect-video max-w-[500px]"
          : "max-w-[480px]";
      return {
        platform: isReel ? "Facebook Reel" : isVideo ? "Facebook Video" : "Facebook Post",
        html:
          `<figure class="inline-embed my-6 flex flex-col items-center justify-center w-full mx-auto text-center bg-transparent" contenteditable="false" data-art-block="1">` +
          `<div class="w-full ${containerClass} mx-auto flex flex-col items-center overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">` +
          `<iframe src="${iframeSrc}" width="100%" height="${isReel || isVideo ? "100%" : "480"}" style="border: none; overflow: hidden; width: 100%; height: ${isReel || isVideo ? "100%" : "480px"}; min-height: ${isReel || isVideo ? "100%" : "250px"}; background: #ffffff;" scrolling="no" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" allowfullscreen title="Facebook content" class="w-full mx-auto block bg-white"></iframe>` +
          `</div></figure><p><br></p>`,
      };
    }

    // X / Twitter
    if (
      host === "twitter.com" ||
      host === "x.com" ||
      host === "mobile.twitter.com" ||
      host === "m.x.com"
    ) {
      const cleanPath = parsed.pathname.replace(/\/+$/, "") || "/";
      const safePermalink = `https://x.com${cleanPath}`.replace(/"/g, "&quot;");
      return {
        platform: "X / Twitter Post",
        html:
          `<figure class="inline-embed my-8 flex flex-col items-center justify-center w-full mx-auto max-w-full text-center bg-transparent" contenteditable="false" data-art-block="1">` +
          `<blockquote class="twitter-tweet mx-auto" data-align="center" data-lang="en" data-dnt="true" data-embed-permalink="${safePermalink}">` +
          `<p lang="en" dir="ltr"><a href="${safePermalink}">View post on X / Twitter</a></p>` +
          `</blockquote></figure><p><br></p>`,
      };
    }

    // TikTok
    if (host === "tiktok.com" || host.endsWith(".tiktok.com")) {
      const path = parsed.pathname.replace(/\/+$/, "");
      const safePermalink = `https://www.tiktok.com${path}`.replace(/"/g, "&quot;");
      const directId =
        parsed.pathname.match(/\/video\/(\d+)/)?.[1] ||
        parsed.pathname.match(/\/v\/(\d+)/)?.[1] ||
        null;
      return {
        platform: "TikTok Video",
        html: directId
          ? `<figure class="inline-embed my-6 flex flex-col items-center justify-center w-full mx-auto text-center bg-transparent" contenteditable="false" data-art-block="1">` +
            `<div class="w-full max-w-[340px] mx-auto overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">` +
            `<iframe src="https://www.tiktok.com/embed/v2/${directId}" title="TikTok video" class="w-full block border-0 bg-white" style="height: 580px; min-height: 580px; width: 100%; border: 0;" scrolling="no" frameborder="0" allowtransparency="true"></iframe>` +
            `</div></figure><p><br></p>`
          : `<figure class="inline-embed my-6 flex flex-col items-center justify-center w-full mx-auto text-center bg-transparent" contenteditable="false" data-art-block="1">` +
            `<blockquote class="tiktok-embed mx-auto" cite="${safePermalink}" data-video-id="" data-embed-type="tiktok" data-embed-permalink="${safePermalink}" style="max-width: 325px; min-width: 260px; margin: 0 auto; background: #ffffff;">` +
            `<section><a target="_blank" rel="noopener noreferrer nofollow" href="${safePermalink}">View post on TikTok</a></section>` +
            `</blockquote></figure><p><br></p>`,
      };
    }

    // YouTube / Shorts / Music / youtu.be
    if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "youtu.be" ||
      host === "youtube-nocookie.com" ||
      host === "music.youtube.com"
    ) {
      const videoId = (() => {
        if (host === "youtu.be") return parsed.pathname.split("/").filter(Boolean)[0] || null;
        if (parsed.pathname === "/watch") return parsed.searchParams.get("v");
        if (
          parsed.pathname.startsWith("/shorts/") ||
          parsed.pathname.startsWith("/embed/") ||
          parsed.pathname.startsWith("/live/")
        ) {
          return parsed.pathname.split("/").filter(Boolean)[1] || null;
        }
        return null;
      })();
      if (videoId) {
        const src = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`.replace(/"/g, "&quot;");
        const isVertical = parsed.pathname.startsWith("/shorts/") || parsed.pathname.includes("/shorts/");
        const aspectClass = isVertical ? "aspect-[9/16] max-w-[340px]" : "aspect-video max-w-[540px]";
        return {
          platform: isVertical ? "YouTube Shorts" : "YouTube Video",
          html:
            `<figure class="inline-embed my-6 flex flex-col items-center justify-center w-full mx-auto text-center bg-transparent" contenteditable="false" data-art-block="1">` +
            `<div class="${aspectClass} w-full mx-auto overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">` +
            `<iframe src="${src}" title="YouTube video" class="h-full w-full block border-0 bg-white" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen loading="lazy"></iframe>` +
            `</div></figure><p><br></p>`,
        };
      }
    }

    // Threads
    if (host === "threads.net" || host.endsWith(".threads.net")) {
      const cleanPath = parsed.pathname.replace(/\/+$/, "");
      const safePermalink = `https://www.threads.net${cleanPath}`.replace(/"/g, "&quot;");
      return {
        platform: "Threads Post",
        html:
          `<figure class="inline-embed my-6 flex flex-col items-center justify-center w-full mx-auto max-w-[500px] text-center bg-transparent" contenteditable="false" data-art-block="1">` +
          `<div class="w-full max-w-[500px] mx-auto overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm p-4 text-left">` +
          `<div class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Threads Post</div>` +
          `<a href="${safePermalink}" target="_blank" rel="noopener noreferrer" class="text-sm font-semibold text-black hover:underline block break-all">View this post on Threads</a>` +
          `</div></figure><p><br></p>`,
      };
    }

    // Vimeo
    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const id = parsed.pathname.split("/").filter(Boolean).pop();
      if (id && /^\d+$/.test(id)) {
        return {
          platform: "Vimeo Video",
          html:
            `<figure class="inline-embed my-6 flex flex-col items-center justify-center w-full mx-auto text-center bg-transparent" contenteditable="false" data-art-block="1">` +
            `<div class="aspect-video w-full max-w-[540px] mx-auto overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">` +
            `<iframe src="https://player.vimeo.com/video/${id}" title="Vimeo video" class="h-full w-full block border-0 bg-white" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen loading="lazy"></iframe>` +
            `</div></figure><p><br></p>`,
        };
      }
    }

    // Spotify
    if (host === "open.spotify.com" || host === "spotify.com") {
      const parts = parsed.pathname.split("/").filter(Boolean);
      const type = parts[0];
      const id = parts[1];
      if (type && id) {
        const isCompact = type === "track" || type === "episode";
        const height = isCompact ? "152" : "352";
        return {
          platform: "Spotify Audio",
          html:
            `<figure class="inline-embed my-6 flex flex-col items-center justify-center w-full mx-auto max-w-[540px] text-center bg-transparent" contenteditable="false" data-art-block="1">` +
            `<div class="w-full max-w-[540px] mx-auto overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">` +
            `<iframe src="https://open.spotify.com/embed/${type}/${id}" width="100%" height="${height}" frameBorder="0" allowfullscreen allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" class="w-full block"></iframe>` +
            `</div></figure><p><br></p>`,
        };
      }
    }

    // SoundCloud
    if (host === "soundcloud.com" || host.endsWith(".soundcloud.com")) {
      return {
        platform: "SoundCloud Audio",
        html:
          `<figure class="inline-embed my-6 flex flex-col items-center justify-center w-full mx-auto max-w-[540px] text-center bg-transparent" contenteditable="false" data-art-block="1">` +
          `<div class="w-full max-w-[540px] mx-auto overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">` +
          `<iframe width="100%" height="166" scrolling="no" frameborder="no" allow="autoplay" src="https://w.soundcloud.com/player/?url=${encodeURIComponent(permalink)}&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false"></iframe>` +
          `</div></figure><p><br></p>`,
      };
    }

    // Pinterest
    if (host === "pinterest.com" || host.endsWith(".pinterest.com") || host === "pin.it") {
      return {
        platform: "Pinterest Pin",
        html:
          `<figure class="inline-embed my-6 flex flex-col items-center justify-center w-full mx-auto max-w-[440px] text-center bg-transparent" contenteditable="false" data-art-block="1">` +
          `<div class="w-full max-w-[440px] mx-auto overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm p-4 text-left">` +
          `<div class="text-xs font-bold text-red-600 uppercase tracking-wider mb-2">Pinterest Pin</div>` +
          `<a href="${permalink}" target="_blank" rel="noopener noreferrer" class="text-sm font-semibold text-black hover:underline block break-all">View this Pin on Pinterest</a>` +
          `</div></figure><p><br></p>`,
      };
    }

    // Generic fallback: embed as clean responsive card
    return {
      platform: "Embedded Link",
      html:
        `<figure class="inline-embed my-6 flex flex-col items-center justify-center w-full mx-auto max-w-[480px] text-center bg-transparent" contenteditable="false" data-art-block="1">` +
        `<div class="w-full max-w-[480px] mx-auto overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm p-4 text-left">` +
        `<div class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Embedded Media (${host})</div>` +
        `<a href="${permalink}" target="_blank" rel="noopener noreferrer" class="text-sm font-semibold text-black hover:underline block break-all">${permalink}</a>` +
        `</div></figure><p><br></p>`,
    };
  }

  function handleApplyEmbed() {
    const raw = embedModal.url.trim();
    if (!raw) {
      toast.error("Please enter a link or embed code.");
      return;
    }

    const res = parseUniversalEmbed(raw);
    if (!res) {
      toast.error("Please enter a valid social post, video URL, or embed code.");
      return;
    }

    if (savedRangeRef.current) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(savedRangeRef.current);
    }
    editorRef.current?.focus();

    insertHtmlAtCursor(res.html);
    setEmbedModal({ isOpen: false, url: "" });
    savedRangeRef.current = null;
    toast.success(`${res.platform} embedded!`);
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
          <ToolbarButton
            label="Numbered"
            icon={ListOrdered}
            onClick={() => run("insertOrderedList")}
          />
        </ToolbarGroup>

        <ToolbarGroup>
          <ToolbarButton label="Add link" icon={LinkIcon} onClick={insertLink} />
          <ToolbarButton label="Remove link" icon={Unlink} onClick={removeLink} />
        </ToolbarGroup>

        <ToolbarGroup>
          <ToolbarButton
            label="Insert HD image (in article)"
            icon={ImageIcon}
            onClick={insertImageInline}
          />
          <ToolbarButton
            label="Embed post or video (Instagram, Facebook, X, YouTube, TikTok...)"
            icon={PostEmbedIcon}
            onClick={openEmbedModal}
          />
          <ToolbarButton
            label="Insert video / media URL"
            icon={VideoIcon}
            onClick={openEmbedModal}
          />
        </ToolbarGroup>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={syncValue}
        onBlur={syncValue}
        className="art-rich-editor min-h-[420px] w-full px-4 py-4 text-[15px] leading-7 outline-none [&_a]:text-blue-600 [&_a]:underline [&_a]:font-semibold hover:[&_a]:text-blue-800"
      />
      <div className="border-t border-gray-200 bg-gray-50 px-3 py-2 text-xs text-muted-foreground">
        Tip: Select text and use Add link to insert hyperlinks. Use the Image button to upload files
        or paste a URL. Use Embed post or video to insert content from Instagram, Facebook,
        X / Twitter, YouTube, TikTok, Threads, or Vimeo directly between paragraphs.
      </div>

      {linkModal.isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-[2px]"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setLinkModal((p) => ({ ...p, isOpen: false }));
            }
          }}
        >
          <div
            className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-sm font-black uppercase tracking-wider text-black flex items-center gap-2">
                <LinkIcon className="h-4 w-4" /> Insert Hyperlink
              </h3>
              <button
                type="button"
                onClick={() => setLinkModal((p) => ({ ...p, isOpen: false }))}
                className="text-gray-400 hover:text-black p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Text to display
                </label>
                <input
                  type="text"
                  value={linkModal.text}
                  onChange={(e) => setLinkModal((p) => ({ ...p, text: e.target.value }))}
                  placeholder="Text that users click on…"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Link URL <span className="text-red-600">*</span>
                </label>
                <input
                  autoFocus
                  type="url"
                  value={linkModal.url}
                  onChange={(e) => setLinkModal((p) => ({ ...p, url: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleApplyLink();
                    } else if (e.key === "Escape") {
                      e.preventDefault();
                      setLinkModal((p) => ({ ...p, isOpen: false }));
                    }
                  }}
                  placeholder="https://example.com"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-gray-700 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={linkModal.openInNewTab}
                  onChange={(e) => setLinkModal((p) => ({ ...p, openInNewTab: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                Open in new tab (recommended)
              </label>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setLinkModal((p) => ({ ...p, isOpen: false }))}
                className="rounded px-4 py-2 text-xs font-bold uppercase tracking-wider border border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyLink}
                className="rounded bg-black px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-gray-800"
              >
                Insert Link
              </button>
            </div>
          </div>
        </div>
      )}

      {embedModal.isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-[2px]"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setEmbedModal({ isOpen: false, url: "" });
            }
          }}
        >
          <div
            className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-sm font-black uppercase tracking-wider text-black flex items-center gap-2">
                <PostEmbedIcon className="h-4 w-4" /> Embed Post or Video
              </h3>
              <button
                type="button"
                onClick={() => setEmbedModal({ isOpen: false, url: "" })}
                className="text-gray-400 hover:text-black p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-2.5">
                <span className="bg-pink-100 text-pink-700 px-2 py-0.5 rounded">Instagram</span>
                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Facebook</span>
                <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded">X / Twitter</span>
                <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded">YouTube</span>
                <span className="bg-neutral-900 text-white px-2 py-0.5 rounded">TikTok</span>
                <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded">Threads</span>
                <span className="bg-sky-100 text-sky-700 px-2 py-0.5 rounded">Vimeo</span>
                <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">Spotify</span>
                <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded">Embed Code</span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Post, Video URL or Embed Code <span className="text-red-600">*</span>
                </label>
                <input
                  autoFocus
                  type="text"
                  value={embedModal.url}
                  onChange={(e) => setEmbedModal({ isOpen: true, url: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleApplyEmbed();
                    } else if (e.key === "Escape") {
                      e.preventDefault();
                      setEmbedModal({ isOpen: false, url: "" });
                    }
                  }}
                  placeholder="Paste Instagram, Facebook, X, YouTube, TikTok, Threads link or embed code..."
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black font-sans"
                />
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                  Supports posts & reels from Instagram, Facebook, X (Twitter), YouTube (videos & Shorts), TikTok, Threads, Vimeo, Spotify, or any custom &lt;iframe&gt; embed code.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEmbedModal({ isOpen: false, url: "" })}
                className="rounded px-4 py-2 text-xs font-bold uppercase tracking-wider border border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyEmbed}
                className="rounded bg-black px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-gray-800"
              >
                Insert Embed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ToolbarGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-1 rounded-md border border-gray-200 bg-white p-1">
      {children}
    </div>
  );
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

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { articleService, categoryService, type Article } from "@/services/articleService";
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
    "  position:relative;" +
    "}" +
    ".art-inline-wrap:hover{ outline:2px dashed #6b7280; outline-offset:3px; border-radius:10px; }" +
    ".art-inline-caption{" +
    "  margin:0; font-size:12px; color:#4b5563; flex:1 1 auto; min-width:0;" +
    "}" +
    "";
  document.head.appendChild(style);
}

type Props = {
  initial?: Partial<Article>;
  onSaved: (a: any) => void;
  uploadingState?: { uploading: boolean; progress: number | null; setUploading: (v: boolean) => void; setProgress: (p: number | null) => void };
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
  scratch.querySelectorAll("button.art-inline-remove").forEach((b) => b.remove());
  scratch.querySelectorAll<HTMLElement>("[data-art-block=\"1\"], figure").forEach((blk) => {
    blk.classList.remove("art-inline-wrap");
    blk.removeAttribute("data-art-block");
    const row = blk.querySelector<HTMLElement>(":scope > .art-inline-row");
    if (row) row.remove();
    const existingFigCap = blk.querySelector<HTMLElement>(":scope > figcaption");
    if (existingFigCap) existingFigCap.remove();
    blk.querySelectorAll<HTMLElement>("br[data-art-spacer=\"1\"]").forEach((br) => br.remove());
  });
  scratch.querySelectorAll(".art-inline-row").forEach((r) => {
    r.remove();
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
      set("hero_image_hd", data.imageUrl);
      set("hero_image_lq", data.imageUrl);
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
    if (!categoryId) {
      setCategoryError(true);
      toast.error("Please select a category before saving the article.");
      return;
    }
    setCategoryError(false);
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
        <Field label="Embedded post link">
          <input
            value={form.embed_url ?? ""}
            onChange={(e) => set("embed_url", e.target.value)}
            placeholder="Instagram, X / Twitter, TikTok, or any public post URL"
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
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : null;
                set("category_id", val);
                if (val && categoryError) setCategoryError(false);
              }}
              className={`w-full border bg-white px-2 py-1.5 ${
                categoryError ? "border-red-500 focus:border-red-600" : "border-gray-300 focus:border-black"
              }`}
              aria-invalid={categoryError || undefined}
              aria-describedby={categoryError ? "category-error" : undefined}
            >
              <option value="">— None —</option>
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
        <div className="border border-gray-200 bg-gray-50 p-4">
          <div className="text-xs font-black uppercase tracking-widest text-black mb-3">Hero Image</div>
          {form.hero_image_hd && (
            <div className="relative mb-2 group">
              <img src={form.hero_image_hd} alt="" className="w-full block" />
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  set("hero_image_hd", "");
                  set("hero_image_lq", "");
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
            className="w-full"
          />
          {isUploading && (
            <div className="text-sm text-black mt-2">
              Uploading…
              {typeof progressPct === "number" ? ` ${progressPct}%` : ""}
            </div>
          )}
          {typeof progressPct === "number" && progressPct > 0 && (
            <div className="mt-2 w-full overflow-hidden rounded-full bg-gray-200 h-2">
              <div className="h-full bg-black transition-all" style={{ width: `${Math.max(0, Math.min(100, progressPct))}%` }} />
            </div>
          )}
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
          disabled={saving || isUploading || (typeof progressPct === "number" && progressPct < 100)}
          className="bg-black text-white hover:bg-gray-800 w-full py-3 font-black uppercase tracking-widest disabled:opacity-60"
          title={
            isUploading || (typeof progressPct === "number" && progressPct < 100)
              ? "Wait until the upload finishes (100%) before saving."
              : undefined
          }
        >
          {saving ? "Saving…" : (isUploading || (typeof progressPct === "number" && progressPct < 100)) ? `Uploading… ${typeof progressPct === "number" ? progressPct + "%" : ""}` : "Save Article"}
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
      canvas.toBlob((b) => resolve(b), file.type === "image/png" ? "image/png" : "image/jpeg", 0.88),
    );
    if (!blob) return file;
    if (blob.size >= file.size) return file;

    const baseName = file.name.replace(/\.[^.]+$/, "");
    const ext = file.type === "image/png" ? "png" : "jpg";
    return new File([blob], `${baseName}.${ext}`, { type: file.type === "image/png" ? "image/png" : "image/jpeg" });
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
  uploadingState,
}: {
  value: string;
  onChange: (value: string) => void;
  uploadingState?: { uploading: boolean; progress: number | null; setUploading: (v: boolean) => void; setProgress: (p: number | null) => void };
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const pendingUploadsRef = useRef(0);
  const perFileProgressRef = useRef<Map<number, number>>(new Map());
  const uploadTokenRef = useRef(0);
  const attachedBtnsRef = useRef<Set<HTMLButtonElement>>(new Set());

  useEffect(() => {
    if (!editorRef.current) return;
    const currentStripped = stripTransientHtml(editorRef.current.innerHTML);
    const valueStripped = stripTransientHtml(value || "");
    if (currentStripped !== valueStripped) {
      editorRef.current.innerHTML = value || "<p></p>";
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

    // Ensure every removable block has a simple bottom row (caption optional + always Remove button)
    function ensureBlockUi(block: HTMLElement) {
      if (!editor.contains(block)) return;
      if (block.getAttribute("data-art-block") === "1") {
        // Ensure row and button
        const row = block.querySelector<HTMLElement>(":scope > .art-inline-row");
        if (!row) buildBottomRow(block);
        else if (!row.querySelector("button.art-inline-remove")) row.appendChild(makeRemoveBtn(block));
        return;
      }

      const tag = block.tagName;

      // Bare VIDEO / IFRAME / linked media (<a><img/>..</a>) / standalone social embed blockquotes → wrap in <figure data-art-block> + row
      if (
        tag === "VIDEO" ||
        tag === "IFRAME" ||
        (tag === "A" && block.querySelector("img, video, iframe") != null) ||
        (tag === "BLOCKQUOTE" &&
          /(^|\s)(twitter-tweet|instagram-media|fb-post|tiktok-embed)(\s|$)/.test(
            block.getAttribute("class") || "",
          ))
      ) {
        const fig = document.createElement("figure");
        fig.setAttribute("data-art-block", "1");
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
        buildBottomRow(fig);
        return;
      }

      if (tag === "FIGURE") {
        block.setAttribute("data-art-block", "1");
        block.classList.add("art-inline-wrap");
        buildBottomRow(block);
        return;
      }
    }

    function buildBottomRow(block: HTMLElement) {
      const oldRows = block.querySelectorAll<HTMLElement>(":scope > .art-inline-row");
      oldRows.forEach((r) => {
        const oldBtns = r.querySelectorAll<HTMLButtonElement>("button.art-inline-remove");
        oldBtns.forEach((b) => attachedBtnsRef.current.delete(b));
        r.remove();
      });
      const oldCaption = block.querySelector<HTMLElement>(":scope > figcaption");
      if (oldCaption) oldCaption.remove();
      const row = document.createElement("div");
      row.className = "art-inline-row";
      row.setAttribute("contenteditable", "false");
      row.style.background = "transparent";
      const spacer = document.createElement("div");
      spacer.className = "art-inline-caption";
      spacer.textContent = "\u00A0";
      spacer.setAttribute("contenteditable", "false");
      spacer.style.visibility = "hidden";
      spacer.style.flex = "1 1 auto";
      row.appendChild(spacer);
      row.appendChild(makeRemoveBtn(block));
      block.appendChild(row);
    }

    function inventoryAll() {
      const items = Array.from(
        editor.querySelectorAll<HTMLElement>(
          "figure, video, iframe, a:has(img, video, iframe)",
        ),
      );
      items.forEach(ensureBlockUi);
    }

    function removeBlock(block: HTMLElement) {
      // Remove the full art-block wrapper (figure) - media + row go together
      const toRemove = block.closest<HTMLElement>("[data-art-block=\"1\"]") || block;
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
      if (prevText && prevText.nodeType === 3 && (prevText.textContent || "").trim() === "") prevText.remove();
      if (nextText && nextText.nodeType === 3 && (nextText.textContent || "").trim() === "") nextText.remove();
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
    const ignoreMutation = { ignore: false };
    let pendingSync = 0;
    function scheduleSync() {
      if (pendingSync) return;
      pendingSync = window.setTimeout(() => {
        pendingSync = 0;
        try { syncValue(); } catch {}
      }, 120);
    }
    const io = new MutationObserver(() => {
      if (ignoreMutation.ignore) return;
      reInventory();
      scheduleSync();
    });
    function reInventory() {
      ignoreMutation.ignore = true;
      try {
        requestAnimationFrame(() => {
          inventoryAll();
          ignoreMutation.ignore = false;
        });
      } finally {
        // ignore flag cleared in rAF
      }
    }
    io.observe(editor, { childList: true, subtree: true });
    inventoryAll();
    editor.addEventListener("input", () => {
      reInventory();
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
        // default plaintext paste behavior (browser handles it, we just reInventory)
        const html = e.clipboardData?.getData("text/html");
        if (!html) {
          setTimeout(reInventory, 80);
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
        setTimeout(reInventory, 120);
      } catch {
        setTimeout(reInventory, 80);
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

    return () => {
      io.disconnect();
      editor.removeEventListener("input", reInventory);
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
      '<figure class="my-6 flex flex-col items-center">' +
      `<img src="${safeSrc}" alt="${safeAlt}" class="w-full max-w-full rounded border border-gray-200 bg-gray-50" loading="lazy" />` +
      "</figure><p><br></p>"
    );
  }

  function figureVideoHtml(src: string, label?: string) {
    const safeSrc = String(src).replace(/"/g, "&quot;");
    return (
      '<figure class="my-8 w-full max-w-none">' +
      '<div class="w-full overflow-hidden rounded border border-gray-200 bg-black">' +
      `<video src="${safeSrc}" class="h-full w-full" controls playsinline preload="metadata" poster=""></video>` +
      "</div>" +
      "</figure><p><br></p>"
    );
  }

  function insertLink() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.getRangeAt(0).collapsed || !editorRef.current?.contains(sel.anchorNode)) {
      toast.info("Select some text first, then click Add link to insert a hyperlink.");
      editorRef.current?.focus();
      return;
    }
    const currentAnchor = (() => {
      try {
        let node: Node | null = sel.anchorNode;
        while (node && node !== editorRef.current) {
          if (node.nodeType === 1 && (node as HTMLElement).tagName === "A") {
            return (node as HTMLAnchorElement).href || "";
          }
          node = node.parentNode;
        }
      } catch {}
      return "";
    })();
    const url = window.prompt("Link URL daalein (https://...):", currentAnchor || "https://");
    if (url == null) return;
    const trimmed = url.trim();
    if (!trimmed) return;
    run("createLink", trimmed);
    const anchors = editorRef.current?.querySelectorAll?.("a") ?? [];
    anchors.forEach((aEl) => {
      const a = aEl as HTMLAnchorElement;
      if (a.getAttribute("data-link-applied") === "1") return;
      if (!a.href) return;
      const href = a.getAttribute("href") || "";
      if (href && href.trim() !== "#" && !a.getAttribute("target")) {
        a.setAttribute("target", "_blank");
        a.setAttribute("rel", "noreferrer noopener nofollow");
        a.setAttribute("data-link-applied", "1");
      }
    });
    syncValue();
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
          o.done = { url: data.imageUrl, label: "" };
          toast.success(`${fileIsVideo(o.file) ? "Video" : "Image"} uploaded (${o.index + 1}/${order.length})`);
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

  function insertVideoEmbed() {
    editorRef.current?.focus();
    const url = window.prompt(
      "Paste a public video URL (YouTube or Vimeo iframe embed URLs are also accepted):",
      "https://www.youtube.com/watch?v=",
    );
    if (!url) return;
    const embed = (() => {
      try {
        const u = new URL(url.trim());
        const host = u.hostname.replace(/^www\./, "");
        if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com" || host === "youtu.be") {
          const videoId = (() => {
            if (host === "youtu.be") return u.pathname.split("/").filter(Boolean)[0] || null;
            if (u.pathname === "/watch") return u.searchParams.get("v");
            if (u.pathname.startsWith("/shorts/") || u.pathname.startsWith("/embed/")) {
              return u.pathname.split("/").filter(Boolean)[1] || null;
            }
            return null;
          })();
          if (!videoId) return null;
          return {
            tag: "iframe",
            src: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`,
            title: "YouTube video",
          };
        }
        if (host === "vimeo.com") {
          const id = u.pathname.split("/").filter(Boolean).pop();
          if (!id || !/^\d+$/.test(id)) return null;
          return {
            tag: "iframe",
            src: `https://player.vimeo.com/video/${id}`,
            title: "Vimeo video",
          };
        }
        // Explicit public embed iframe URLs (whitelisted)
        if (host === "youtube-nocookie.com" || host === "player.vimeo.com") {
          return {
            tag: "iframe",
            src: u.toString(),
            title: "Embedded video",
          };
        }
        return null;
      } catch {
        return null;
      }
    })();
    if (!embed) {
      toast.error("This video URL is not supported. Please paste a valid YouTube or Vimeo URL.");
      return;
    }
    const safeSrc = embed.src.replace(/"/g, "&quot;");
    const safeTitle = (embed.title || "Video").replace(/"/g, "&quot;");
    const html =
      '<figure class="my-8 w-full max-w-none">' +
      '<div class="aspect-video w-full overflow-hidden rounded border border-gray-200 bg-black">' +
      `<iframe src="${safeSrc}" title="${safeTitle}" class="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen loading="lazy"></iframe>` +
      "</div></figure><p><br></p>";
    insertHtmlAtCursor(html);
  }

  function insertPostEmbed() {
    editorRef.current?.focus();
    const url = window.prompt(
      "Paste a public social post URL (X / Twitter, Instagram, TikTok, Facebook, YouTube):",
      "",
    );
    if (!url) return;
    const normalized = url.trim();
    let parsed: URL | null = null;
    try {
      parsed = new URL(normalized);
    } catch {
      toast.error("Please enter a valid URL.");
      return;
    }
    const host = parsed.hostname.replace(/^www\./, "");
    const permalink = parsed.toString().replace(/"/g, "&quot;");

    // X / Twitter
    if (host === "twitter.com" || host === "x.com" || host === "mobile.twitter.com" || host === "m.x.com") {
      const cleanPath = parsed.pathname.replace(/\/+$/, "") || "/";
      const safePermalink = `https://x.com${cleanPath}`.replace(/"/g, "&quot;");
      const html =
        '<figure class="my-8 w-full max-w-none">' +
        `<blockquote class="twitter-tweet" data-lang="en" data-dnt="true" data-embed-permalink="${safePermalink}">` +
        `<p lang="en" dir="ltr"><a href="${safePermalink}">View post on X / Twitter</a></p>` +
        "</blockquote></figure><p><br></p>";
      insertHtmlAtCursor(html);
      toast.success("X / Twitter post embedded.");
      return;
    }

    // Instagram (p / reel / tv / stories)
    if (host === "instagram.com" || host === "m.instagram.com" || host === "instagr.am") {
      const pathOnly = parsed.pathname.replace(/\/+$/, "") + "/";
      const valid =
        pathOnly.startsWith("/p/") ||
        pathOnly.startsWith("/reel/") ||
        pathOnly.startsWith("/tv/") ||
        pathOnly.startsWith("/stories/");
      if (!valid) {
        toast.error("This Instagram link is not valid. Please paste a post, reel, or story URL.");
        return;
      }
      const safePermalink = `https://www.instagram.com${pathOnly}`.replace(/"/g, "&quot;");
      const html =
        '<figure class="my-8 w-full max-w-none">' +
        `<blockquote class="instagram-media" data-instgrm-captioned data-instgrm-permalink="${safePermalink}" data-instgrm-version="14" data-embed-type="instagram" data-embed-permalink="${safePermalink}">` +
        `<a href="${safePermalink}">View post on Instagram</a>` +
        "</blockquote></figure><p><br></p>";
      insertHtmlAtCursor(html);
      toast.success("Instagram post embedded.");
      return;
    }

    // TikTok
    if (host === "tiktok.com" || host.endsWith(".tiktok.com")) {
      const path = parsed.pathname.replace(/\/+$/, "");
      const safePermalink = `https://www.tiktok.com${path}`.replace(/"/g, "&quot;");
      const html =
        '<figure class="my-8 w-full max-w-none">' +
        `<blockquote class="tiktok-embed" cite="${safePermalink}" data-video-id="" data-embed-type="tiktok" data-embed-permalink="${safePermalink}">` +
        `<section><a target="_blank" rel="noopener noreferrer nofollow" href="${safePermalink}">View post on TikTok</a></section>` +
        "</blockquote></figure><p><br></p>";
      insertHtmlAtCursor(html);
      toast.success("TikTok post embedded.");
      return;
    }

    // Facebook / FB post or video
    if (host === "facebook.com" || host.endsWith(".facebook.com") || host === "fb.watch" || host === "fb.com") {
      const safePermalink = permalink;
      const html =
        '<figure class="my-8 w-full max-w-none">' +
        `<blockquote class="fb-post" data-href="${safePermalink}" data-width="500" data-show-text="true" data-embed-type="facebook" data-embed-permalink="${safePermalink}">` +
        `<a href="${safePermalink}">View post on Facebook</a>` +
        "</blockquote></figure><p><br></p>";
      insertHtmlAtCursor(html);
      toast.success("Facebook post embedded.");
      return;
    }

    // YouTube video / shorts (fallback)
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
        if (parsed.pathname.startsWith("/shorts/") || parsed.pathname.startsWith("/embed/")) {
          return parsed.pathname.split("/").filter(Boolean)[1] || null;
        }
        return null;
      })();
      if (!videoId) {
        toast.error("This YouTube URL is not valid. Please use the Insert video URL button instead.");
        return;
      }
      const src = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`.replace(/"/g, "&quot;");
      const html =
        '<figure class="my-8 w-full max-w-none">' +
        '<div class="aspect-video w-full overflow-hidden rounded border border-gray-200 bg-black">' +
        `<iframe src="${src}" title="YouTube video" class="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen loading="lazy"></iframe>` +
        "</div></figure><p><br></p>";
      insertHtmlAtCursor(html);
      toast.success("YouTube video embedded.");
      return;
    }

    toast.error("This post URL is not supported yet. Supported platforms: X / Twitter, Instagram, TikTok, Facebook, YouTube.");
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

        <ToolbarGroup>
          <ToolbarButton label="Add link" icon={LinkIcon} onClick={insertLink} />
          <ToolbarButton label="Remove link" icon={Unlink} onClick={removeLink} />
        </ToolbarGroup>

        <ToolbarGroup>
          <ToolbarButton label="Insert HD image (in article)" icon={ImageIcon} onClick={insertImageInline} />
          <ToolbarButton label="Insert video URL (YouTube/Vimeo)" icon={VideoIcon} onClick={insertVideoEmbed} />
          <ToolbarButton label="Embed social post (X/Instagram/TikTok/Facebook)" icon={PostEmbedIcon} onClick={insertPostEmbed} />
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
        Tip: Select text and use Add link to insert hyperlinks. Use the Image button to upload files or paste a URL — HD images up to 2560px are preserved. Video embed supports YouTube and Vimeo. Use Embed social post to insert posts from X, Instagram, TikTok, and Facebook directly between paragraphs.
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

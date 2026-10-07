import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { Eye, Edit3, RotateCcw, Save, ExternalLink, Loader2 } from "lucide-react";
import {
  DEFAULT_PRIVACY_POLICY,
  getAdminPrivacyPolicy,
  saveAdminPrivacyPolicy,
  type PrivacyPolicyPayload,
} from "@/services/privacyService";

export function PrivacyPolicyForm() {
  const [form, setForm] = useState<PrivacyPolicyPayload>(() => ({
    ...DEFAULT_PRIVACY_POLICY,
  }));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const data = await getAdminPrivacyPolicy();
        if (active) {
          setForm(data);
        }
      } catch (err) {
        toast.error("Failed to load privacy policy settings.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await saveAdminPrivacyPolicy(form);
      toast.success("Privacy Policy updated successfully!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to save Privacy Policy.");
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    if (
      window.confirm(
        "Are you sure you want to reset the Privacy Policy to the default template? Any unsaved changes will be lost.",
      )
    ) {
      setForm({ ...DEFAULT_PRIVACY_POLICY, last_updated: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }) });
      toast.info("Reset to default Privacy Policy template.");
    }
  }

  function insertTag(openTag: string, closeTag: string, placeholder = "Text") {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const sel = el.value.substring(start, end) || placeholder;
    const replacement = `${openTag}${sel}${closeTag}`;
    const newVal = el.value.substring(0, start) + replacement + el.value.substring(end);
    setForm((prev) => ({ ...prev, content: newVal }));
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + openTag.length, start + openTag.length + sel.length);
    }, 50);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-neutral-500">
        <Loader2 className="w-8 h-8 animate-spin mb-3 text-black" />
        <span className="text-sm font-semibold">Loading Privacy Policy...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-neutral-50 border border-neutral-200 p-4 rounded-xl">
        <div>
          <h3 className="font-bold text-base text-neutral-900">Privacy Policy Editor</h3>
          <p className="text-xs text-neutral-500">
            Edit and publish legal disclosures, data collection terms, and cookie policies.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/privacy-policy"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <ExternalLink size={14} />
            <span>View Public Page</span>
          </Link>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-neutral-600 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>Reset Template</span>
          </button>
        </div>
      </div>

      {/* Meta Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
            Page Title
          </label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Privacy Policy"
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
            Last Updated Date / Notice
          </label>
          <input
            type="text"
            required
            value={form.last_updated}
            onChange={(e) => setForm({ ...form, last_updated: e.target.value })}
            placeholder="October 2026"
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
          Introduction Summary (Optional)
        </label>
        <textarea
          rows={2}
          value={form.intro || ""}
          onChange={(e) => setForm({ ...form, intro: e.target.value })}
          placeholder="Brief summary paragraph displayed under the title..."
          className="w-full px-3.5 py-2.5 text-sm bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>

      {/* Content Editor with Toolbar & Tab Switcher */}
      <div className="border border-neutral-300 rounded-xl overflow-hidden bg-white shadow-xs">
        {/* Header Tabs & Toolbar */}
        <div className="flex flex-wrap items-center justify-between border-b border-neutral-200 bg-neutral-100/70 p-2 sm:px-4">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab("edit")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                activeTab === "edit"
                  ? "bg-black text-white"
                  : "bg-white text-neutral-700 hover:bg-neutral-200 border border-neutral-300"
              }`}
            >
              <Edit3 size={14} />
              <span>HTML / Text Editor</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                activeTab === "preview"
                  ? "bg-black text-white"
                  : "bg-white text-neutral-700 hover:bg-neutral-200 border border-neutral-300"
              }`}
            >
              <Eye size={14} />
              <span>Live Preview</span>
            </button>
          </div>

          {activeTab === "edit" && (
            <div className="flex flex-wrap items-center gap-1 mt-2 sm:mt-0">
              <button
                type="button"
                onClick={() => insertTag("<section>\n  <h2>", "</h2>\n  <p>Content...</p>\n</section>\n", "Section Title")}
                className="px-2 py-1 text-xs font-bold bg-white hover:bg-neutral-200 border border-neutral-300 rounded text-neutral-800 cursor-pointer"
                title="Add Section"
              >
                + Section
              </button>
              <button
                type="button"
                onClick={() => insertTag("<h2>", "</h2>", "Section Heading")}
                className="px-2 py-1 text-xs font-bold bg-white hover:bg-neutral-200 border border-neutral-300 rounded text-neutral-800 cursor-pointer"
              >
                H2
              </button>
              <button
                type="button"
                onClick={() => insertTag("<h3>", "</h3>", "Subheading")}
                className="px-2 py-1 text-xs font-bold bg-white hover:bg-neutral-200 border border-neutral-300 rounded text-neutral-800 cursor-pointer"
              >
                H3
              </button>
              <button
                type="button"
                onClick={() => insertTag("<p>", "</p>", "Paragraph text")}
                className="px-2 py-1 text-xs font-bold bg-white hover:bg-neutral-200 border border-neutral-300 rounded text-neutral-800 cursor-pointer"
              >
                Paragraph
              </button>
              <button
                type="button"
                onClick={() => insertTag("<ul>\n  <li>", "</li>\n  <li>Item 2</li>\n</ul>", "List item")}
                className="px-2 py-1 text-xs font-bold bg-white hover:bg-neutral-200 border border-neutral-300 rounded text-neutral-800 cursor-pointer"
              >
                List
              </button>
              <button
                type="button"
                onClick={() => insertTag("<strong>", "</strong>", "bold text")}
                className="px-2 py-1 text-xs font-bold bg-white hover:bg-neutral-200 border border-neutral-300 rounded text-neutral-800 cursor-pointer font-serif"
              >
                B
              </button>
              <button
                type="button"
                onClick={() => insertTag('<a href="https://..." class="underline">', "</a>", "link text")}
                className="px-2 py-1 text-xs font-bold bg-white hover:bg-neutral-200 border border-neutral-300 rounded text-neutral-800 cursor-pointer"
              >
                Link
              </button>
            </div>
          )}
        </div>

        {/* Tab Body */}
        {activeTab === "edit" ? (
          <div className="p-2 sm:p-4 bg-neutral-900">
            <textarea
              ref={textareaRef}
              rows={22}
              required
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="w-full font-mono text-xs sm:text-sm text-green-400 bg-neutral-950 p-4 rounded-lg border border-neutral-800 focus:outline-none focus:ring-1 focus:ring-green-500 leading-relaxed"
              placeholder="<section> ... </section>"
            />
          </div>
        ) : (
          <div className="p-6 md:p-10 bg-white max-h-[600px] overflow-y-auto">
            <div className="mx-auto max-w-3xl">
              <header className="mb-8 border-b-2 border-neutral-200 pb-4">
                <span className="text-[11px] font-black uppercase tracking-widest text-black">
                  Legal
                </span>
                <h1 className="font-serif text-3xl font-bold text-neutral-900 mt-1">
                  {form.title}
                </h1>
                <p className="text-xs text-neutral-500 mt-2">
                  Last updated: {form.last_updated}
                </p>
                {form.intro && (
                  <p className="mt-3 text-sm text-neutral-700 leading-relaxed font-sans">
                    {form.intro}
                  </p>
                )}
              </header>

              <div
                className="prose max-w-none text-sm md:text-base leading-relaxed text-neutral-900 space-y-6 prose-headings:font-bold prose-headings:font-serif prose-headings:text-neutral-900 prose-h2:text-xl prose-h2:mt-6 prose-h2:mb-2 prose-p:my-3 prose-ul:list-disc prose-ul:pl-5 prose-li:my-1"
                dangerouslySetInnerHTML={{ __html: form.content }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Save Action */}
      <div className="flex items-center justify-end gap-4 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-3 bg-black hover:bg-neutral-800 text-white text-sm font-black uppercase tracking-wider rounded-lg transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving Changes...</span>
            </>
          ) : (
            <>
              <Save size={16} />
              <span>Save Privacy Policy</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

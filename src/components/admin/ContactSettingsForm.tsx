import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Eye,
  Edit3,
  RotateCcw,
  Save,
  ExternalLink,
  Loader2,
  Plus,
  Trash2,
  MessageSquare,
  Globe,
  Share2,
} from "lucide-react";
import {
  DEFAULT_CONTACT_SETTINGS,
  getAdminContactSettings,
  saveAdminContactSettings,
  type ContactSettingsPayload,
} from "@/services/contactService";
import { SocialFollowLinks } from "@/components/site/SocialFollowLinks";

export function ContactSettingsForm() {
  const [form, setForm] = useState<ContactSettingsPayload>(() => ({
    ...DEFAULT_CONTACT_SETTINGS,
  }));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "inquiries" | "location" | "header_sidebar" | "form_notes" | "preview"
  >("inquiries");
  const [newResponseTime, setNewResponseTime] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const data = await getAdminContactSettings();
        if (active) {
          setForm(data);
        }
      } catch {
        toast.error("Failed to load contact page settings.");
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
      await saveAdminContactSettings(form);
      toast.success("Contact page settings updated successfully!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to save contact settings.");
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    if (
      window.confirm(
        "Are you sure you want to reset contact details to default? Any unsaved changes will be lost.",
      )
    ) {
      setForm({ ...DEFAULT_CONTACT_SETTINGS });
      toast.info("Reset to default contact details.");
    }
  }

  function addResponseTime() {
    const trimmed = newResponseTime.trim();
    if (!trimmed) return;
    setForm((prev) => ({
      ...prev,
      response_times: [...(prev.response_times || []), trimmed],
    }));
    setNewResponseTime("");
  }

  function removeResponseTime(index: number) {
    setForm((prev) => ({
      ...prev,
      response_times: prev.response_times.filter((_, i) => i !== index),
    }));
  }

  function updateResponseTime(index: number, val: string) {
    setForm((prev) => {
      const copy = [...prev.response_times];
      copy[index] = val;
      return { ...prev, response_times: copy };
    });
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-neutral-500">
        <Loader2 className="w-8 h-8 animate-spin mb-3 text-black" />
        <span className="text-sm font-semibold">Loading Contact Settings...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-neutral-50 border border-neutral-200 p-4 rounded-xl">
        <div>
          <h3 className="font-bold text-base text-neutral-900">Contact Us Page Editor</h3>
          <p className="text-xs text-neutral-500">
            Control the contact details, emails, addresses, response times, and messages shown to your visitors.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/contact"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-neutral-300 text-neutral-700 bg-white hover:bg-neutral-100 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View Public Page
          </Link>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-neutral-300 text-neutral-600 hover:text-neutral-900 bg-white hover:bg-neutral-100 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg bg-black text-white hover:bg-neutral-800 disabled:opacity-50 transition-colors shadow-sm"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-neutral-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("inquiries")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
            activeTab === "inquiries"
              ? "bg-black text-white"
              : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          Inquiries & Emails
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("location")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
            activeTab === "location"
              ? "bg-black text-white"
              : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          Office & Location
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("header_sidebar")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
            activeTab === "header_sidebar"
              ? "bg-black text-white"
              : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          Header & Sidebar
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("form_notes")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
            activeTab === "form_notes"
              ? "bg-black text-white"
              : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Contact Form & Notes
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("preview")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
            activeTab === "preview"
              ? "bg-black text-white"
              : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          Live Preview
        </button>
      </div>

      {/* TAB 1: Inquiries & Emails */}
      {activeTab === "inquiries" && (
        <div className="space-y-6">
          {/* General Enquiries */}
          <div className="border border-neutral-200 rounded-xl p-5 bg-white shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
              <Mail className="w-5 h-5 text-neutral-700" />
              <div>
                <h4 className="font-bold text-sm text-neutral-900">General Enquiries Section</h4>
                <p className="text-xs text-neutral-500">For reader feedback, editorial inquiries, and corrections.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Section Title
                </label>
                <input
                  type="text"
                  value={form.general_title}
                  onChange={(e) => setForm({ ...form, general_title: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  General Email Address
                </label>
                <input
                  type="email"
                  value={form.general_email}
                  onChange={(e) => setForm({ ...form, general_email: e.target.value })}
                  placeholder="editorial@example.com"
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                Description Text
              </label>
              <textarea
                rows={2}
                value={form.general_description}
                onChange={(e) => setForm({ ...form, general_description: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                Response Turnaround Note
              </label>
              <input
                type="text"
                value={form.general_response_note}
                onChange={(e) => setForm({ ...form, general_response_note: e.target.value })}
                placeholder="We endeavour to respond within 2–3 business days."
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
          </div>

          {/* Story Tips */}
          <div className="border border-neutral-200 rounded-xl p-5 bg-white shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
              <Mail className="w-5 h-5 text-neutral-700" />
              <div>
                <h4 className="font-bold text-sm text-neutral-900">Story Tips & Leads Section</h4>
                <p className="text-xs text-neutral-500">For confidential whistleblower tips, entertainment scoops, and leaks.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Section Title
                </label>
                <input
                  type="text"
                  value={form.tips_title}
                  onChange={(e) => setForm({ ...form, tips_title: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Tips Email Address
                </label>
                <input
                  type="email"
                  value={form.tips_email}
                  onChange={(e) => setForm({ ...form, tips_email: e.target.value })}
                  placeholder="tips@example.com"
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                Description Text
              </label>
              <textarea
                rows={2}
                value={form.tips_description}
                onChange={(e) => setForm({ ...form, tips_description: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                Confidentiality Note
              </label>
              <input
                type="text"
                value={form.tips_note}
                onChange={(e) => setForm({ ...form, tips_note: e.target.value })}
                placeholder="We treat anonymous submissions with the highest level of confidentiality."
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
          </div>

          {/* Press & Partnerships */}
          <div className="border border-neutral-200 rounded-xl p-5 bg-white shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
              <Mail className="w-5 h-5 text-neutral-700" />
              <div>
                <h4 className="font-bold text-sm text-neutral-900">Press & Partnerships Section</h4>
                <p className="text-xs text-neutral-500">For advertising, brand sponsors, press passes, and commercial queries.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Section Title
                </label>
                <input
                  type="text"
                  value={form.partners_title}
                  onChange={(e) => setForm({ ...form, partners_title: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Partnerships Email Address
                </label>
                <input
                  type="email"
                  value={form.partners_email}
                  onChange={(e) => setForm({ ...form, partners_email: e.target.value })}
                  placeholder="partners@example.com"
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                Description Text
              </label>
              <textarea
                rows={2}
                value={form.partners_description}
                onChange={(e) => setForm({ ...form, partners_description: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                Turnaround Note
              </label>
              <input
                type="text"
                value={form.partners_response_note}
                onChange={(e) => setForm({ ...form, partners_response_note: e.target.value })}
                placeholder="and a member of our commercial team will get back to you within one business day."
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Office & Location */}
      {activeTab === "location" && (
        <div className="space-y-6">
          <div className="border border-neutral-200 rounded-xl p-5 bg-white shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
              <MapPin className="w-5 h-5 text-neutral-700" />
              <div>
                <h4 className="font-bold text-sm text-neutral-900">Physical Address & Contact Info</h4>
                <p className="text-xs text-neutral-500">Mailing address, telephone, and direct WhatsApp contact.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Section Title
                </label>
                <input
                  type="text"
                  value={form.address_title}
                  onChange={(e) => setForm({ ...form, address_title: e.target.value })}
                  placeholder="Mail"
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Company / Organization Name
                </label>
                <input
                  type="text"
                  value={form.company_name}
                  onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                  placeholder="Entertainment Trends Ltd."
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Address Line 1 (Street)
                </label>
                <input
                  type="text"
                  value={form.address_line1}
                  onChange={(e) => setForm({ ...form, address_line1: e.target.value })}
                  placeholder="221B Fleet Street"
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Address Line 2 (City & Postal code)
                </label>
                <input
                  type="text"
                  value={form.address_line2}
                  onChange={(e) => setForm({ ...form, address_line2: e.target.value })}
                  placeholder="London, EC4A 2DY"
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                Country
              </label>
              <input
                type="text"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                placeholder="United Kingdom"
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-neutral-100">
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  Phone Number (Optional)
                </label>
                <input
                  type="text"
                  value={form.phone || ""}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+44 20 7946 0912"
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  WhatsApp Number / Link (Optional)
                </label>
                <input
                  type="text"
                  value={form.whatsapp || ""}
                  onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                  placeholder="+44 7700 900123"
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Header & Sidebar */}
      {activeTab === "header_sidebar" && (
        <div className="space-y-6">
          {/* Header & Meta */}
          <div className="border border-neutral-200 rounded-xl p-5 bg-white shadow-sm space-y-4">
            <h4 className="font-bold text-sm text-neutral-900 border-b border-neutral-100 pb-2">
              Page Header & Subtitle
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Page Title (H1)
                </label>
                <input
                  type="text"
                  value={form.page_title}
                  onChange={(e) => setForm({ ...form, page_title: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Eyebrow Tag
                </label>
                <input
                  type="text"
                  value={form.eyebrow}
                  onChange={(e) => setForm({ ...form, eyebrow: e.target.value })}
                  placeholder="Pages"
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                Header Description / Subtitle
              </label>
              <textarea
                rows={2}
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
          </div>

          {/* Sidebar Boxes */}
          <div className="border border-neutral-200 rounded-xl p-5 bg-white shadow-sm space-y-4">
            <h4 className="font-bold text-sm text-neutral-900 border-b border-neutral-100 pb-2">
              Sidebar: Social Follow & Response Times
            </h4>

            {/* Social Follow Box */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-neutral-700 uppercase">
                  Social Follow Box
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-neutral-700">
                  <input
                    type="checkbox"
                    checked={form.show_social_links}
                    onChange={(e) => setForm({ ...form, show_social_links: e.target.checked })}
                    className="w-4 h-4 rounded border-neutral-300 text-black focus:ring-black"
                  />
                  Show Social Follow Box
                </label>
              </div>

              {form.show_social_links && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                  <div>
                    <label className="block text-xs font-bold text-neutral-600 uppercase mb-1">
                      Follow Box Eyebrow
                    </label>
                    <input
                      type="text"
                      value={form.sidebar_follow_title}
                      onChange={(e) => setForm({ ...form, sidebar_follow_title: e.target.value })}
                      className="w-full px-3 py-1.5 text-sm border border-neutral-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-600 uppercase mb-1">
                      Follow Box Description
                    </label>
                    <input
                      type="text"
                      value={form.sidebar_follow_description}
                      onChange={(e) =>
                        setForm({ ...form, sidebar_follow_description: e.target.value })
                      }
                      className="w-full px-3 py-1.5 text-sm border border-neutral-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Response Times Box */}
            <div className="space-y-3 pt-3 border-t border-neutral-100">
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Response Times Heading
                </label>
                <input
                  type="text"
                  value={form.sidebar_response_title}
                  onChange={(e) => setForm({ ...form, sidebar_response_title: e.target.value })}
                  placeholder="Response times"
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-2">
                  Response Time Items
                </label>
                <div className="space-y-2">
                  {form.response_times.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => updateResponseTime(index, e.target.value)}
                        className="flex-1 px-3 py-1.5 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                      />
                      <button
                        type="button"
                        onClick={() => removeResponseTime(index)}
                        className="p-1.5 text-neutral-400 hover:text-red-600 rounded hover:bg-neutral-100 transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <input
                    type="text"
                    value={newResponseTime}
                    onChange={(e) => setNewResponseTime(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addResponseTime();
                      }
                    }}
                    placeholder="e.g. Legal: 48 hours"
                    className="flex-1 px-3 py-1.5 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                  />
                  <button
                    type="button"
                    onClick={addResponseTime}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-md bg-neutral-200 text-neutral-800 hover:bg-neutral-300 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Item
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Contact Form & Notes */}
      {activeTab === "form_notes" && (
        <div className="space-y-6">
          {/* Interactive Form Toggle */}
          <div className="border border-neutral-200 rounded-xl p-5 bg-white shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <h4 className="font-bold text-sm text-neutral-900">Interactive Inquiry Form</h4>
                <p className="text-xs text-neutral-500">Allow visitors to send a message directly from the Contact page.</p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-neutral-700">
                <input
                  type="checkbox"
                  checked={form.enable_contact_form}
                  onChange={(e) => setForm({ ...form, enable_contact_form: e.target.checked })}
                  className="w-4 h-4 rounded border-neutral-300 text-black focus:ring-black"
                />
                Enable Message Form
              </label>
            </div>

            {form.enable_contact_form && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                      Form Title
                    </label>
                    <input
                      type="text"
                      value={form.form_title}
                      onChange={(e) => setForm({ ...form, form_title: e.target.value })}
                      placeholder="Send Us a Message"
                      className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                      Form Description
                    </label>
                    <input
                      type="text"
                      value={form.form_description}
                      onChange={(e) => setForm({ ...form, form_description: e.target.value })}
                      placeholder="Have an inquiry? Fill out the details below..."
                      className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Additional Notes / Notice */}
          <div className="border border-neutral-200 rounded-xl p-5 bg-white shadow-sm space-y-4">
            <div className="border-b border-neutral-100 pb-3">
              <h4 className="font-bold text-sm text-neutral-900">Additional Notice / Banner (Optional)</h4>
              <p className="text-xs text-neutral-500">
                Any special disclaimers, urgent press guidelines, or legal remarks to show at the bottom of the page.
              </p>
            </div>
            <div>
              <textarea
                rows={3}
                value={form.additional_notes || ""}
                onChange={(e) => setForm({ ...form, additional_notes: e.target.value })}
                placeholder="e.g. Note: For urgent DMCA or legal inquiries, please include 'URGENT LEGAL' in the subject line."
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Live Preview */}
      {activeTab === "preview" && (
        <div className="border-2 border-dashed border-neutral-300 rounded-xl p-6 bg-neutral-50">
          <div className="mb-4 flex items-center justify-between border-b border-neutral-200 pb-3">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-neutral-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-600">
                Public Page Preview
              </span>
            </div>
            <span className="text-xs text-neutral-500">Live preview of current unsaved & saved fields</span>
          </div>

          <article className="mx-auto max-w-4xl bg-white p-6 md:p-10 shadow-sm border border-neutral-200 rounded-lg">
            <header className="mb-10 border-b-4 border-yellow pb-6">
              <div className="eyebrow">{form.eyebrow || "Pages"}</div>
              <h1 className="display text-3xl md:text-5xl font-black uppercase text-neutral-900">
                {form.page_title || "Contact Us"}
              </h1>
              {form.subtitle && (
                <p className="mt-3 text-muted-foreground md:text-lg">{form.subtitle}</p>
              )}
            </header>

            <div className="grid gap-8 md:grid-cols-[2fr_1fr]">
              <div className="prose max-w-none space-y-8">
                {/* General */}
                <section>
                  <h2 className="display mb-3 text-2xl font-black uppercase">
                    {form.general_title}
                  </h2>
                  <p className="text-muted-foreground">
                    {form.general_description}{" "}
                    <a
                      className="text-black font-semibold underline underline-offset-2 hover:text-yellow"
                      href={`mailto:${form.general_email}`}
                    >
                      {form.general_email}
                    </a>
                    . {form.general_response_note}
                  </p>
                </section>

                {/* Tips */}
                <section>
                  <h2 className="display mb-3 text-2xl font-black uppercase">{form.tips_title}</h2>
                  <p className="text-muted-foreground">
                    {form.tips_description}{" "}
                    <a
                      className="text-black font-semibold underline underline-offset-2 hover:text-yellow"
                      href={`mailto:${form.tips_email}`}
                    >
                      {form.tips_email}
                    </a>
                    . {form.tips_note}
                  </p>
                </section>

                {/* Partnerships */}
                <section>
                  <h2 className="display mb-3 text-2xl font-black uppercase">
                    {form.partners_title}
                  </h2>
                  <p className="text-muted-foreground">
                    {form.partners_description}{" "}
                    <a
                      className="text-black font-semibold underline underline-offset-2 hover:text-yellow"
                      href={`mailto:${form.partners_email}`}
                    >
                      {form.partners_email}
                    </a>{" "}
                    {form.partners_response_note}
                  </p>
                </section>

                {/* Mail & Address */}
                <section>
                  <h2 className="display mb-3 text-2xl font-black uppercase">{form.address_title}</h2>
                  <address className="not-italic text-muted-foreground space-y-1">
                    <p className="font-semibold text-neutral-800">{form.company_name}</p>
                    {form.address_line1 && <p>{form.address_line1}</p>}
                    {form.address_line2 && <p>{form.address_line2}</p>}
                    {form.country && <p>{form.country}</p>}
                    {form.phone && (
                      <p className="pt-2 text-neutral-900 font-medium flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-neutral-500" />
                        {form.phone}
                      </p>
                    )}
                    {form.whatsapp && (
                      <p className="text-neutral-900 font-medium flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-green-600" />
                        WhatsApp: {form.whatsapp}
                      </p>
                    )}
                  </address>
                </section>

                {/* Additional notes if present */}
                {form.additional_notes && (
                  <div className="bg-yellow/10 border-l-4 border-yellow p-4 text-sm text-neutral-800">
                    {form.additional_notes}
                  </div>
                )}
              </div>

              {/* Aside */}
              <aside className="space-y-6">
                {form.show_social_links && (
                  <div className="border border-border bg-surface p-5 rounded-none">
                    <div className="eyebrow mb-2">{form.sidebar_follow_title}</div>
                    <div className="mb-3 text-sm text-muted-foreground">
                      {form.sidebar_follow_description}
                    </div>
                    <SocialFollowLinks />
                  </div>
                )}

                <div className="border border-border bg-surface p-5 rounded-none">
                  <div className="eyebrow mb-2">{form.sidebar_response_title}</div>
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    {form.response_times.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-neutral-400">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </aside>
            </div>
          </article>
        </div>
      )}

      {/* Bottom Save Bar */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
        <button
          type="button"
          onClick={handleReset}
          className="px-4 py-2 text-xs font-semibold rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-100 transition-colors"
        >
          Reset to Defaults
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2 text-xs font-bold rounded-lg bg-black text-white hover:bg-neutral-800 disabled:opacity-50 transition-colors shadow-sm"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save All Changes
            </>
          )}
        </button>
      </div>
    </form>
  );
}

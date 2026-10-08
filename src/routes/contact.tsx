import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  DEFAULT_CONTACT_SETTINGS,
  getPublicContactSettings,
  submitContactMessage,
} from "@/services/contactService";
import { SocialFollowLinks } from "@/components/site/SocialFollowLinks";
import { Phone, MessageSquare, Send, CheckCircle2, Loader2, Mail, MapPin } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — Entertainment Trends" },
      { name: "description", content: "Get in touch with the Entertainment Trends team." },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { data: contact = DEFAULT_CONTACT_SETTINGS } = useQuery({
    queryKey: ["contact-settings"],
    queryFn: getPublicContactSettings,
    staleTime: 60_000,
  });

  // Contact Message Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      toast.error("Please fill in your name, email, and message.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitContactMessage(formData);
      if (res.ok) {
        setSubmitted(true);
        toast.success(res.message);
        setFormData({ name: "", email: "", subject: "", message: "" });
      }
    } catch {
      toast.error("Something went wrong. Please try emailing us directly.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <article className="mx-auto max-w-4xl px-4 py-10">
      {/* Header */}
      <header className="mb-10 border-b-4 border-yellow pb-6">
        <div className="eyebrow">{contact.eyebrow || "Pages"}</div>
        <h1 className="display text-4xl font-black uppercase md:text-6xl">
          {contact.page_title || "Contact Us"}
        </h1>
        {contact.subtitle && (
          <p className="mt-3 text-muted-foreground md:text-lg">{contact.subtitle}</p>
        )}
      </header>

      <div className="grid gap-8 md:grid-cols-[2fr_1fr]">
        <div className="prose max-w-none space-y-8">
          {/* General Enquiries */}
          {contact.general_email && (
            <section>
              <h2 className="display mb-3 text-2xl font-black uppercase">
                {contact.general_title || "General Enquiries"}
              </h2>
              <p className="text-muted-foreground">
                {contact.general_description || "For general questions, corrections, or feedback about a story, email our editors at"}{" "}
                <a
                  className="font-semibold text-black underline underline-offset-2 hover:text-yellow transition-colors"
                  href={`mailto:${contact.general_email}`}
                >
                  {contact.general_email}
                </a>
                {contact.general_response_note ? `. ${contact.general_response_note}` : "."}
              </p>
            </section>
          )}

          {/* Story Tips */}
          {contact.tips_email && (
            <section>
              <h2 className="display mb-3 text-2xl font-black uppercase">
                {contact.tips_title || "Story Tips"}
              </h2>
              <p className="text-muted-foreground">
                {contact.tips_description || "Got a lead or a tip worth covering? Send it to"}{" "}
                <a
                  className="font-semibold text-black underline underline-offset-2 hover:text-yellow transition-colors"
                  href={`mailto:${contact.tips_email}`}
                >
                  {contact.tips_email}
                </a>
                {contact.tips_note ? `. ${contact.tips_note}` : "."}
              </p>
            </section>
          )}

          {/* Press & Partnerships */}
          {contact.partners_email && (
            <section>
              <h2 className="display mb-3 text-2xl font-black uppercase">
                {contact.partners_title || "Press & Partnerships"}
              </h2>
              <p className="text-muted-foreground">
                {contact.partners_description || "For brand partnerships, affiliate enquiries, press access, or advertising opportunities, please write to"}{" "}
                <a
                  className="font-semibold text-black underline underline-offset-2 hover:text-yellow transition-colors"
                  href={`mailto:${contact.partners_email}`}
                >
                  {contact.partners_email}
                </a>{" "}
                {contact.partners_response_note || ""}
              </p>
            </section>
          )}

          {/* Mail / Physical Address */}
          {(contact.company_name || contact.address_line1 || contact.phone || contact.whatsapp) && (
            <section>
              <h2 className="display mb-3 text-2xl font-black uppercase">
                {contact.address_title || "Mail"}
              </h2>
              <address className="not-italic text-muted-foreground space-y-1">
                {contact.company_name && (
                  <p className="font-semibold text-black">{contact.company_name}</p>
                )}
                {contact.address_line1 && <p>{contact.address_line1}</p>}
                {contact.address_line2 && <p>{contact.address_line2}</p>}
                {contact.country && <p>{contact.country}</p>}

                {contact.phone && (
                  <p className="pt-2 flex items-center gap-2 text-black font-medium">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <a
                      href={`tel:${contact.phone.replace(/\s+/g, "")}`}
                      className="hover:text-yellow transition-colors"
                    >
                      {contact.phone}
                    </a>
                  </p>
                )}

                {contact.whatsapp && (
                  <p className="flex items-center gap-2 text-black font-medium">
                    <MessageSquare className="w-4 h-4 text-green-600" />
                    <span>WhatsApp: {contact.whatsapp}</span>
                  </p>
                )}
              </address>
            </section>
          )}

          {/* Optional notice / disclaimer */}
          {contact.additional_notes && (
            <div className="bg-yellow/10 border-l-4 border-yellow p-4 text-sm text-neutral-800">
              {contact.additional_notes}
            </div>
          )}

          {/* Interactive Contact Form (if enabled) */}
          {contact.enable_contact_form && (
            <section className="pt-6 border-t border-border">
              <h2 className="display mb-2 text-2xl font-black uppercase">
                {contact.form_title || "Send Us a Message"}
              </h2>
              {contact.form_description && (
                <p className="text-sm text-muted-foreground mb-6">
                  {contact.form_description}
                </p>
              )}

              {submitted ? (
                <div className="border border-green-200 bg-green-50 p-6 rounded-lg text-center space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto" />
                  <h3 className="font-bold text-lg text-green-900">Message Received!</h3>
                  <p className="text-sm text-green-700">
                    Thank you for reaching out. A member of our editorial team will review your message and get back to you shortly.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="inline-block mt-2 px-4 py-1.5 text-xs font-bold uppercase tracking-wide bg-black text-white hover:bg-neutral-800 rounded transition-colors"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wide text-neutral-700 mb-1">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Jane Doe"
                        className="w-full px-3 py-2 text-sm border border-neutral-300 rounded focus:outline-none focus:border-black"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wide text-neutral-700 mb-1">
                        Your Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="jane@example.com"
                        className="w-full px-3 py-2 text-sm border border-neutral-300 rounded focus:outline-none focus:border-black"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide text-neutral-700 mb-1">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="e.g. Story tip / Feedback / Press inquiry"
                      className="w-full px-3 py-2 text-sm border border-neutral-300 rounded focus:outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide text-neutral-700 mb-1">
                      Message *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Write your message here..."
                      className="w-full px-3 py-2 text-sm border border-neutral-300 rounded focus:outline-none focus:border-black"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-yellow hover:text-black transition-colors disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              )}
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          {contact.show_social_links && (
            <div className="border border-border bg-surface p-5">
              <div className="eyebrow mb-2">
                {contact.sidebar_follow_title || "Follow"}
              </div>
              <div className="mb-3 text-sm text-muted-foreground">
                {contact.sidebar_follow_description ||
                  "Stay connected with Entertainment Trends on your favourite social platform."}
              </div>
              <SocialFollowLinks />
            </div>
          )}

          {contact.response_times && contact.response_times.length > 0 && (
            <div className="border border-border bg-surface p-5">
              <div className="eyebrow mb-2">
                {contact.sidebar_response_title || "Response times"}
              </div>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {contact.response_times.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </article>
  );
}

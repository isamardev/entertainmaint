import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ContactSettingsForm } from "@/components/admin/ContactSettingsForm";
import { ContactMessagesInbox } from "@/components/admin/ContactMessagesInbox";
import { getContactMessages } from "@/services/contactService";
import { Mail, Settings2, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/admin/contact")({
  head: () => ({
    meta: [{ title: "Contact Inquiries & Settings — Admin" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminContact,
});

function AdminContact() {
  const [activeTab, setActiveTab] = useState<"messages" | "settings">("messages");

  const { data: messagesResponse } = useQuery({
    queryKey: ["admin-contact-messages"],
    queryFn: getContactMessages,
    refetchInterval: 20_000,
  });

  const unreadCount = messagesResponse?.unread ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <h2 className="display text-2xl font-black uppercase tracking-tight text-black">
            Contact & Inquiries Hub
          </h2>
          <p className="mt-1 text-sm text-neutral-600">
            View messages sent through the public contact form and customize contact details.
          </p>
        </div>

        <a
          href="/contact"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 self-start sm:self-auto px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider border border-neutral-300 rounded hover:bg-black hover:text-white transition-colors"
        >
          <span>View Public Page</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex border-b-2 border-neutral-200 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("messages")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold uppercase tracking-wider transition-all border-b-2 -mb-[2px] ${
            activeTab === "messages"
              ? "border-black text-black bg-neutral-100"
              : "border-transparent text-neutral-500 hover:text-black hover:bg-neutral-50"
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Received Inquiries</span>
          {unreadCount > 0 && (
            <span
              className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-black ${
                activeTab === "messages"
                  ? "bg-black text-white"
                  : "bg-neutral-900 text-white"
              }`}
            >
              {unreadCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("settings")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold uppercase tracking-wider transition-all border-b-2 -mb-[2px] ${
            activeTab === "settings"
              ? "border-black text-black bg-neutral-100"
              : "border-transparent text-neutral-500 hover:text-black hover:bg-neutral-50"
          }`}
        >
          <Settings2 className="w-4 h-4" />
          <span>Contact Page Settings</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === "messages" ? (
        <ContactMessagesInbox />
      ) : (
        <div className="pt-2">
          <ContactSettingsForm />
        </div>
      )}
    </div>
  );
}


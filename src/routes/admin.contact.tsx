import { createFileRoute } from "@tanstack/react-router";
import { ContactSettingsForm } from "@/components/admin/ContactSettingsForm";

export const Route = createFileRoute("/admin/contact")({
  head: () => ({
    meta: [{ title: "Contact Page Settings — Admin" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminContact,
});

function AdminContact() {
  return (
    <div>
      <h2 className="display mb-2 text-xl font-black uppercase">Contact Page Management</h2>
      <p className="mb-6 text-sm text-gray-600">
        Customize emails, story tips, press contacts, postal address, response turnaround times, and
        inquiry settings for the public <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">/contact</code> page.
      </p>
      <ContactSettingsForm />
    </div>
  );
}

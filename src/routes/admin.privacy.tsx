import { createFileRoute } from "@tanstack/react-router";
import { PrivacyPolicyForm } from "@/components/admin/PrivacyPolicyForm";

export const Route = createFileRoute("/admin/privacy")({
  head: () => ({
    meta: [{ title: "Privacy Policy — Admin" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminPrivacy,
});

function AdminPrivacy() {
  return (
    <div>
      <h2 className="display mb-2 text-xl font-black uppercase">Privacy Policy Management</h2>
      <p className="mb-6 text-sm text-gray-600">
        Update the official Privacy Policy terms, data handling policies, and legal notices that appear
        on the public site at <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">/privacy-policy</code>.
      </p>
      <PrivacyPolicyForm />
    </div>
  );
}

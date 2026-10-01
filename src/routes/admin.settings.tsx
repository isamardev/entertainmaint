import { createFileRoute } from "@tanstack/react-router";
import { AdminSettingsForm } from "@/components/admin/AdminSettingsForm";

export const Route = createFileRoute("/admin/settings")({ component: AdminSettings });

function AdminSettings() {
  return (
    <div>
      <h2 className="display mb-2 text-xl font-black uppercase">Settings</h2>
      <p className="mb-6 text-sm text-gray-600">
        Manage your admin account credentials. Use this page to change your username (email) or
        password. Your current password is required for security-sensitive changes.
      </p>
      <AdminSettingsForm />
    </div>
  );
}

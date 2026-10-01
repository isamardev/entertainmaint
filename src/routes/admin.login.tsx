import { createFileRoute } from "@tanstack/react-router";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [{ title: "Admin sign in — Entertainment Trends" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  return <AdminLoginForm redirectTo="/admin" showBackLink />;
}

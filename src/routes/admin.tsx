import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

// Client-only admin gate. RLS is still the source of truth on the server.
export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Admin — Entertainment Trends" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (loading) return;
    if (user && !isAdmin) navigate({ to: "/", replace: true });
  }, [user, loading, isAdmin, navigate]);

  if (loading) {
    return <div className="p-16 text-center text-black">Checking access…</div>;
  }

  if (!user) {
    return <AdminLoginForm redirectTo="/admin" showBackLink={false} />;
  }

  if (!isAdmin) {
    return <div className="p-16 text-center text-black">Checking access…</div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-0 py-4 md:px-4 md:py-8">
      <div className="mb-6 border-b-4 border-black pb-4 md:mb-8">
        <div className="text-xs font-black uppercase tracking-widest text-black">
          Entertainment Trends
        </div>
        <h1 className="display text-2xl font-black uppercase md:text-3xl">Admin Dashboard</h1>
      </div>
      <Outlet />
    </div>
  );
}

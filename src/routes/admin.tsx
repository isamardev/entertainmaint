import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

// Client-only admin gate. RLS is still the source of truth on the server.
export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Entertainment Trends" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/auth", replace: true });
    else if (!isAdmin) navigate({ to: "/", replace: true });
  }, [user, loading, isAdmin, navigate]);

  if (loading || !user || !isAdmin) {
    return <div className="p-16 text-center meta">Checking access…</div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 border-b-4 border-yellow pb-4">
        <div className="eyebrow">Entertainment Trends</div>
        <h1 className="display text-3xl font-black uppercase">Admin Dashboard</h1>
      </div>
      <Outlet />
    </div>
  );
}

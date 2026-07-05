import { createFileRoute, Outlet, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

// Client-only admin gate. RLS is still the source of truth on the server.
export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Entertainme" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  const { user, loading, isAdmin, isSuperAdmin } = useAuth();
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
      <div className="mb-8 flex flex-wrap items-center gap-4 border-b-4 border-yellow pb-4">
        <div>
          <div className="eyebrow">Entertainme</div>
          <h1 className="display text-3xl font-black uppercase">Admin Dashboard</h1>
        </div>
        <nav className="ml-auto flex flex-wrap gap-2">
          <AdminLink to="/admin">Articles</AdminLink>
          <AdminLink to="/admin/new">New Article</AdminLink>
          {isSuperAdmin && <AdminLink to="/admin/categories">Categories</AdminLink>}
          {isSuperAdmin && <AdminLink to="/admin/users">Users</AdminLink>}
        </nav>
      </div>
      <Outlet />
    </div>
  );
}

function AdminLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} activeOptions={{ exact: true }}
          className="border border-border px-3 py-1.5 text-xs font-bold uppercase tracking-widest hover:border-yellow hover:text-yellow"
          activeProps={{ className: "yellow-bar border-yellow" }}>
      {children}
    </Link>
  );
}

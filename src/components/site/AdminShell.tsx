import { useState } from "react";
import { Menu } from "lucide-react";
import { AdminSidebar } from "@/components/site/AdminSidebar";
import { useAuth } from "@/context/AuthContext";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading, isAdmin } = useAuth();

  if (loading || !user || !isAdmin) {
    return <div className="min-h-screen bg-white">{children}</div>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <header className="fixed top-0 right-0 left-0 z-50 flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 md:hidden">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="rounded p-1 text-black hover:text-black"
          aria-label="Open admin menu"
        >
          <Menu size={24} />
        </button>
        <img src="/logo.png" alt="Entertainment Trends" className="h-8 w-8 object-contain" />
        <span className="display text-sm font-black uppercase tracking-wide text-black">Admin Panel</span>
      </header>

      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          aria-label="Close admin menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="admin-panel min-w-0 flex-1 overflow-hidden bg-white">
        <div className="flex h-full min-h-0 flex-col p-4 pt-16 md:p-6 md:pt-6">
          <div className="min-h-0 flex-1 overflow-auto">{children}</div>
        </div>
      </main>
    </div>
  );
}

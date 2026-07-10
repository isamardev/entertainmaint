import { useState } from "react";
import { Menu, X } from "lucide-react";
import { AdminSidebar } from "@/components/site/AdminSidebar";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <header className="fixed top-0 right-0 left-0 z-50 flex items-center gap-3 border-b border-gray-700 bg-black px-4 py-3 md:hidden">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="rounded p-1 text-white hover:text-yellow"
          aria-label="Open admin menu"
        >
          <Menu size={24} />
        </button>
        <span className="display text-sm font-black uppercase tracking-wide text-yellow">
          Admin Panel
        </span>
      </header>

      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          aria-label="Close admin menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="admin-panel min-w-0 flex-1 bg-black p-4 pt-16 md:p-6 md:pt-6">
        {children}
      </main>
    </div>
  );
}

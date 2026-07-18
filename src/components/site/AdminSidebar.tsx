import { Link, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import { X } from "lucide-react";

const inactiveClass = "hover:bg-gray-800 hover:text-yellow text-white";
const activeClass = "bg-yellow text-black";

type Props = {
  open?: boolean;
  onClose?: () => void;
};

export function AdminSidebar({ open = false, onClose }: Props) {
  const location = useLocation();
  const { signOut, isSuperAdmin } = useAuth();

  const path = location.pathname;

  const isAllArticlesActive =
    path === "/admin" || path.startsWith("/admin/edit");
  const isNewArticleActive = path === "/admin/new";
  const isCategoriesActive = path.startsWith("/admin/categories");

  useEffect(() => {
    onClose?.();
  }, [path]);

  const linkClass = (active: boolean) =>
    `block px-4 py-2 rounded text-sm transition-colors font-bold uppercase tracking-wide ${
      active ? activeClass : inactiveClass
    }`;

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex w-64 min-h-screen flex-col bg-black text-white transition-transform duration-300 ease-in-out md:relative md:z-auto md:translate-x-0 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex items-center justify-between border-b border-gray-700 p-4 md:p-6">
        <Link to="/admin" className="display text-lg font-black uppercase text-yellow md:text-2xl">
          Entertainment Trends Admin
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-white hover:text-yellow md:hidden"
          aria-label="Close admin menu"
        >
          <X size={22} />
        </button>
      </div>
      <nav className="flex-1 space-y-2 overflow-y-auto p-4">
        {/* All Articles */}
        <Link to="/admin" className={linkClass(isAllArticlesActive)}>
          All Articles
        </Link>
        {/* New Article */}
        <Link to="/admin/new" className={linkClass(isNewArticleActive)}>
          + New Article
        </Link>
        {/* Categories */}
        {isSuperAdmin && (
          <Link
            to="/admin/categories"
            className={linkClass(isCategoriesActive)}
          >
            Manage Categories
          </Link>
        )}
      </nav>
      <div className="border-t border-gray-700 p-4">
        <Link
          to="/"
          className={`mb-2 block rounded px-4 py-2 font-bold uppercase tracking-wide text-sm transition-colors ${inactiveClass}`}
        >
          ← Back to Site
        </Link>
        <button
          onClick={() => signOut()}
          className="w-full rounded px-4 py-2 text-left font-bold uppercase tracking-wide text-sm text-red-400 transition-colors hover:bg-red-900 hover:text-yellow"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}

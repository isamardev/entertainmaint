import { Link, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import { X } from "lucide-react";

const inactiveClass = "hover:bg-gray-100 hover:text-black text-black";
const activeClass = "bg-black text-white";

type Props = {
  open?: boolean;
  onClose?: () => void;
};

export function AdminSidebar({ open = false, onClose }: Props) {
  const location = useLocation();
  const { signOut, isSuperAdmin } = useAuth();

  const path = location.pathname;
  const rawSearch = (location as any).search;
  const status =
    typeof rawSearch === "string"
      ? (new URLSearchParams(rawSearch).get("status") ?? "all")
      : ((rawSearch?.status as string | undefined) ?? "all");

  const isAllArticlesActive =
    (path === "/admin" && status === "all") || path.startsWith("/admin/edit");
  const isPublishedActive = path === "/admin" && status === "published";
  const isDraftActive = path === "/admin" && status === "draft";
  const isArchivedActive = path === "/admin" && status === "archived";
  const isNewArticleActive = path === "/admin/new";
  const isCategoriesActive = path.startsWith("/admin/categories");
  const isSettingsActive = path.startsWith("/admin/settings");
  const isSocialsActive = path.startsWith("/admin/socials");

  useEffect(() => {
    onClose?.();
  }, [path]);

  const linkClass = (active: boolean) =>
    `block px-4 py-2 rounded text-sm transition-colors font-bold uppercase tracking-wide ${
      active ? activeClass : inactiveClass
    }`;

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex w-64 min-h-screen flex-col bg-white text-black border-r border-gray-200 transition-transform duration-300 ease-in-out md:relative md:z-auto md:translate-x-0 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex items-center justify-between border-b border-gray-200 p-4 md:p-6">
        <Link to="/admin" className="flex items-center gap-3">
          <img src="/logo.png" alt="Entertainment Trends" className="h-9 w-9 object-contain" />
          <span className="display text-base font-black uppercase text-black md:text-lg">
            Entertainment Trends
          </span>
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-black hover:text-black md:hidden"
          aria-label="Close admin menu"
        >
          <X size={22} />
        </button>
      </div>
      <nav className="flex-1 space-y-2 overflow-y-auto p-4">
        <Link to="/admin/new" className={linkClass(isNewArticleActive)}>
          Create Article
        </Link>
        <Link to="/admin" search={{ status: "all" }} className={linkClass(isAllArticlesActive)}>
          All Article
        </Link>
        <Link to="/admin" search={{ status: "published" }} className={linkClass(isPublishedActive)}>
          Publish Article
        </Link>
        <Link to="/admin" search={{ status: "draft" }} className={linkClass(isDraftActive)}>
          Draft Article
        </Link>
        <Link to="/admin" search={{ status: "archived" }} className={linkClass(isArchivedActive)}>
          Archived Article
        </Link>
        {isSuperAdmin && (
          <Link to="/admin/categories" className={linkClass(isCategoriesActive)}>
            Manage Categories
          </Link>
        )}
      </nav>
      <div className="border-t border-gray-200 p-4">
        <Link to="/admin/settings" className={`mb-2 block ${linkClass(isSettingsActive)}`}>
          Account Settings
        </Link>
        <Link to="/admin/socials" className={`mb-2 block ${linkClass(isSocialsActive)}`}>
          Social Media Links
        </Link>
        <Link
          to="/"
          className={`mb-2 block rounded px-4 py-2 font-bold uppercase tracking-wide text-sm transition-colors ${inactiveClass}`}
        >
          ← Back to Site
        </Link>
        <button
          onClick={() => signOut()}
          className="w-full rounded px-4 py-2 text-left font-bold uppercase tracking-wide text-sm text-red-600 transition-colors hover:bg-red-50 hover:text-red-800"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}

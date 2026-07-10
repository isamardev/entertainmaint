import { Link, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";

const inactiveClass = "hover:bg-gray-800 hover:text-yellow text-white";
const activeClass = "bg-yellow text-black";

export function AdminSidebar() {
  const location = useLocation();
  const { signOut, isSuperAdmin } = useAuth();
  const [isArticlesOpen, setIsArticlesOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isUsersOpen, setIsUsersOpen] = useState(false);

  const path = location.pathname;

  const isAllArticlesActive =
    path === "/admin" || path.startsWith("/admin/edit");
  const isNewArticleActive = path === "/admin/new";
  const isCategoriesActive = path.startsWith("/admin/categories");
  const isUsersActive = path.startsWith("/admin/users");

  const isInArticlesSection = isAllArticlesActive || isNewArticleActive;

  useEffect(() => {
    if (isInArticlesSection) setIsArticlesOpen(true);
    if (isCategoriesActive) setIsCategoriesOpen(true);
    if (isUsersActive) setIsUsersOpen(true);
  }, [isInArticlesSection, isCategoriesActive, isUsersActive]);

  const linkClass = (active: boolean) =>
    `block px-3 py-1.5 rounded text-xs transition-colors font-bold uppercase tracking-wide ${
      active ? activeClass : inactiveClass
    }`;

  const sectionBtnClass = `w-full text-left px-4 py-2 rounded transition-colors flex items-center justify-between font-bold uppercase text-sm tracking-wide ${inactiveClass}`;

  return (
    <aside className="w-64 bg-black text-white flex flex-col min-h-screen">
      <div className="p-6 border-b border-gray-700">
        <Link to="/admin" className="display text-2xl font-black text-yellow uppercase">
          Entertainme Admin
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {/* Articles */}
        <div>
          <button
            onClick={() => setIsArticlesOpen(!isArticlesOpen)}
            className={sectionBtnClass}
          >
            Articles
            <span
              className={`text-xs transition-transform ${isArticlesOpen ? "rotate-180" : ""}`}
            >
              ▼
            </span>
          </button>
          {isArticlesOpen && (
            <div className="ml-4 mt-2 space-y-1 border-l border-gray-700 pl-4">
              <Link to="/admin" className={linkClass(isAllArticlesActive)}>
                All Articles
              </Link>
              <Link to="/admin/new" className={linkClass(isNewArticleActive)}>
                + New Article
              </Link>
            </div>
          )}
        </div>

        {/* Categories */}
        {isSuperAdmin && (
          <div>
            <button
              onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
              className={sectionBtnClass}
            >
              Categories
              <span
                className={`text-xs transition-transform ${isCategoriesOpen ? "rotate-180" : ""}`}
              >
                ▼
              </span>
            </button>
            {isCategoriesOpen && (
              <div className="ml-4 mt-2 space-y-1 border-l border-gray-700 pl-4">
                <Link
                  to="/admin/categories"
                  className={linkClass(isCategoriesActive)}
                >
                  Manage Categories
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Users */}
        {isSuperAdmin && (
          <div>
            <button
              onClick={() => setIsUsersOpen(!isUsersOpen)}
              className={sectionBtnClass}
            >
              Users
              <span
                className={`text-xs transition-transform ${isUsersOpen ? "rotate-180" : ""}`}
              >
                ▼
              </span>
            </button>
            {isUsersOpen && (
              <div className="ml-4 mt-2 space-y-1 border-l border-gray-700 pl-4">
                <Link to="/admin/users" className={linkClass(isUsersActive)}>
                  Manage Users
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>
      <div className="p-4 border-t border-gray-700">
        <Link
          to="/"
          className={`block px-4 py-2 rounded transition-colors font-bold uppercase text-sm tracking-wide mb-2 ${inactiveClass}`}
        >
          ← Back to Site
        </Link>
        <button
          onClick={() => signOut()}
          className="w-full text-left px-4 py-2 rounded transition-colors hover:bg-red-900 hover:text-yellow font-bold uppercase text-sm tracking-wide text-red-400"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}

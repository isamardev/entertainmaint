import { Link, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useMemo } from "react";
import {
  X,
  PlusCircle,
  FileText,
  CheckCircle2,
  FileEdit,
  Archive,
  FolderTree,
  Mail,
  Settings,
  Share2,
  ShieldCheck,
  ExternalLink,
  LogOut,
} from "lucide-react";
import { getContactMessages } from "@/services/contactService";
import { articleService, type Article } from "@/services/articleService";

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

  const isNewArticleActive = path === "/admin/new";
  const isAllArticlesActive =
    (path === "/admin" && status === "all") || path.startsWith("/admin/edit");
  const isPublishedActive = path === "/admin" && status === "published";
  const isDraftActive = path === "/admin" && status === "draft";
  const isArchivedActive = path === "/admin" && status === "archived";
  const isCategoriesActive = path.startsWith("/admin/categories");
  const isSettingsActive = path.startsWith("/admin/settings");
  const isSocialsActive = path.startsWith("/admin/socials");
  const isPrivacyActive = path.startsWith("/admin/privacy");
  const isContactActive = path.startsWith("/admin/contact");

  // Live queries for counters
  const { data: messagesResponse } = useQuery({
    queryKey: ["admin-contact-messages"],
    queryFn: getContactMessages,
    refetchInterval: 20_000,
  });
  const unreadMessagesCount = messagesResponse?.unread ?? 0;

  const { data: articles = [] } = useQuery({
    queryKey: ["admin-articles"],
    queryFn: articleService.listAll,
    staleTime: 30_000,
  });

  const articleCounts = useMemo(() => {
    let published = 0;
    let draft = 0;
    let archived = 0;
    for (const a of articles as Article[]) {
      if (a.status === "published") published++;
      else if (a.status === "draft") draft++;
      else if (a.status === "archived") archived++;
    }
    return {
      total: articles.length,
      published,
      draft,
      archived,
    };
  }, [articles]);

  useEffect(() => {
    onClose?.();
  }, [path, onClose]);

  // Helper for item link styling - black background when active
  const linkClass = (isActive: boolean) =>
    `group flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-150 ${
      isActive
        ? "bg-black text-white shadow-sm ring-1 ring-black"
        : "text-neutral-700 hover:text-black hover:bg-neutral-100"
    }`;

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex w-72 h-full flex-col bg-white border-r border-neutral-200/90 shadow-lg md:shadow-none transition-transform duration-300 ease-in-out md:relative md:z-auto md:translate-x-0 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* Header - Clean logo and brand name without black box or badges */}
      <div className="flex items-center justify-between border-b border-gray-200 p-4 md:p-6 bg-white">
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

      {/* Main Nav Content */}
      <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-4">
        {/* Editorial Section */}
        <div className="space-y-1">
          <div className="px-3 pb-1.5 text-[10px] font-black uppercase tracking-widest text-neutral-400">
            Editorial Content
          </div>

          {/* 1st Position: Create Article (same link style, black bg when active) */}
          <Link to="/admin/new" className={linkClass(isNewArticleActive)}>
            <div className="flex items-center gap-2.5">
              <PlusCircle
                className={`w-4 h-4 transition-colors ${
                  isNewArticleActive ? "text-white" : "text-neutral-400 group-hover:text-black"
                }`}
              />
              <span>Create Article</span>
            </div>
          </Link>

          {/* 2nd Position: All Articles */}
          <Link to="/admin" search={{ status: "all" }} className={linkClass(isAllArticlesActive)}>
            <div className="flex items-center gap-2.5">
              <FileText
                className={`w-4 h-4 transition-colors ${
                  isAllArticlesActive ? "text-white" : "text-neutral-400 group-hover:text-black"
                }`}
              />
              <span>All Articles</span>
            </div>
            {articleCounts.total > 0 && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  isAllArticlesActive
                    ? "bg-neutral-800 text-neutral-200"
                    : "bg-neutral-100 text-neutral-600 group-hover:bg-neutral-200"
                }`}
              >
                {articleCounts.total}
              </span>
            )}
          </Link>

          {/* Published */}
          <Link
            to="/admin"
            search={{ status: "published" }}
            className={linkClass(isPublishedActive)}
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2
                className={`w-4 h-4 transition-colors ${
                  isPublishedActive ? "text-white" : "text-neutral-400 group-hover:text-black"
                }`}
              />
              <span>Published</span>
            </div>
            {articleCounts.published > 0 && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  isPublishedActive
                    ? "bg-neutral-800 text-neutral-200"
                    : "bg-neutral-100 text-neutral-600 group-hover:bg-neutral-200"
                }`}
              >
                {articleCounts.published}
              </span>
            )}
          </Link>

          {/* Drafts */}
          <Link to="/admin" search={{ status: "draft" }} className={linkClass(isDraftActive)}>
            <div className="flex items-center gap-2.5">
              <FileEdit
                className={`w-4 h-4 transition-colors ${
                  isDraftActive ? "text-white" : "text-neutral-400 group-hover:text-black"
                }`}
              />
              <span>Drafts</span>
            </div>
            {articleCounts.draft > 0 && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  isDraftActive
                    ? "bg-neutral-800 text-neutral-200"
                    : "bg-neutral-100 text-neutral-600 group-hover:bg-neutral-200"
                }`}
              >
                {articleCounts.draft}
              </span>
            )}
          </Link>

          {/* Archived */}
          <Link to="/admin" search={{ status: "archived" }} className={linkClass(isArchivedActive)}>
            <div className="flex items-center gap-2.5">
              <Archive
                className={`w-4 h-4 transition-colors ${
                  isArchivedActive ? "text-white" : "text-neutral-400 group-hover:text-black"
                }`}
              />
              <span>Archived</span>
            </div>
            {articleCounts.archived > 0 && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  isArchivedActive
                    ? "bg-neutral-800 text-neutral-200"
                    : "bg-neutral-100 text-neutral-600 group-hover:bg-neutral-200"
                }`}
              >
                {articleCounts.archived}
              </span>
            )}
          </Link>
        </div>

        {/* Structure / Taxonomy */}
        {isSuperAdmin && (
          <div className="space-y-1">
            <div className="px-3 pb-1.5 text-[10px] font-black uppercase tracking-widest text-neutral-400">
              Structure & Tags
            </div>
            <Link to="/admin/categories" className={linkClass(isCategoriesActive)}>
              <div className="flex items-center gap-2.5">
                <FolderTree
                  className={`w-4 h-4 transition-colors ${
                    isCategoriesActive ? "text-white" : "text-neutral-400 group-hover:text-black"
                  }`}
                />
                <span>Manage Categories</span>
              </div>
            </Link>
          </div>
        )}

        {/* Audience & Inquiries */}
        <div className="space-y-1">
          <div className="px-3 pb-1.5 text-[10px] font-black uppercase tracking-widest text-neutral-400">
            Audience & Inbox
          </div>

          <Link to="/admin/contact" className={linkClass(isContactActive)}>
            <div className="flex items-center gap-2.5">
              <Mail
                className={`w-4 h-4 transition-colors ${
                  isContactActive ? "text-white" : "text-neutral-400 group-hover:text-black"
                }`}
              />
              <span>Contact Messages</span>
            </div>
            {unreadMessagesCount > 0 ? (
              <span
                className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-black ${
                  isContactActive ? "bg-white text-black" : "bg-black text-white"
                }`}
              >
                {unreadMessagesCount}
              </span>
            ) : (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  isContactActive ? "bg-neutral-800 text-neutral-300" : "text-neutral-400"
                }`}
              >
                0
              </span>
            )}
          </Link>
        </div>

        {/* Preferences & System Settings */}
        <div className="space-y-1">
          <div className="px-3 pb-1.5 text-[10px] font-black uppercase tracking-widest text-neutral-400">
            Settings & Legal
          </div>

          <Link to="/admin/settings" className={linkClass(isSettingsActive)}>
            <div className="flex items-center gap-2.5">
              <Settings
                className={`w-4 h-4 transition-colors ${
                  isSettingsActive ? "text-white" : "text-neutral-400 group-hover:text-black"
                }`}
              />
              <span>Account Settings</span>
            </div>
          </Link>

          <Link to="/admin/socials" className={linkClass(isSocialsActive)}>
            <div className="flex items-center gap-2.5">
              <Share2
                className={`w-4 h-4 transition-colors ${
                  isSocialsActive ? "text-white" : "text-neutral-400 group-hover:text-black"
                }`}
              />
              <span>Social Media Links</span>
            </div>
          </Link>

          <Link to="/admin/privacy" className={linkClass(isPrivacyActive)}>
            <div className="flex items-center gap-2.5">
              <ShieldCheck
                className={`w-4 h-4 transition-colors ${
                  isPrivacyActive ? "text-white" : "text-neutral-400 group-hover:text-black"
                }`}
              />
              <span>Privacy Policy</span>
            </div>
          </Link>
        </div>
      </nav>

      {/* Footer Actions */}
      <div className="border-t border-neutral-200 p-4 space-y-2 bg-neutral-50/50">
        <Link
          to="/"
          className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-neutral-700 hover:text-black hover:bg-neutral-100 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <ExternalLink className="w-4 h-4 text-neutral-400" />
            <span>← Back to Site</span>
          </div>
          <span className="text-[10px] text-neutral-400">↗</span>
        </Link>

        <button
          type="button"
          onClick={() => signOut()}
          className="flex items-center gap-2.5 w-full px-3.5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors text-left"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>

        <div className="pt-2 text-center text-[10px] text-neutral-400 uppercase tracking-widest font-semibold border-t border-neutral-200/60">
          Entertainment Trends • v2.4
        </div>
      </div>
    </aside>
  );
}

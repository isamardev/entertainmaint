import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Menu, Search, User as UserIcon, X } from "lucide-react";
import { categoryService } from "@/services/articleService";
import { useAuth } from "@/context/AuthContext";

export function Navbar() {
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: categoryService.list });
  const { user, isAdmin, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    navigate({ to: "/search", search: { q } });
    setSearching(false);
    setQ("");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <button className="md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>

        <Link to="/" className="flex shrink-0 items-center gap-3">
          <img
            src="/logo.png"
            alt="Entertainment Trends"
            className="h-11 w-11 object-contain"
          />
          <span className="display hidden text-lg font-black uppercase tracking-tight sm:inline">
            Entertainment <span className="text-yellow">Trends</span>
          </span>
        </Link>

        <nav className="ml-4 hidden flex-1 items-center gap-1 md:flex">
          {categories.map((c) => (
            <Link
              key={c.id}
              to="/category/$slug"
              params={{ slug: c.slug }}
              className="display px-3 py-2 text-sm font-bold uppercase tracking-wider text-foreground/80 transition-colors hover:text-yellow"
              activeProps={{ className: "text-yellow" }}
            >
              {c.name}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => setSearching((v) => !v)} aria-label="Search" className="p-2 hover:text-yellow">
            <Search size={20} />
          </button>
          {user ? (
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Link to="/admin" className="hidden rounded border border-yellow px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-yellow hover:bg-yellow hover:text-black sm:inline-block">
                  Admin
                </Link>
              )}
              <button onClick={signOut} className="hidden text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-yellow sm:inline-block">
                Sign out
              </button>
              <div className="grid h-8 w-8 place-items-center rounded-full bg-surface-2"><UserIcon size={16} /></div>
            </div>
          ) : (
            <Link to="/auth" className="rounded border border-border px-3 py-1.5 text-xs font-bold uppercase tracking-widest hover:border-yellow hover:text-yellow">
              Sign in
            </Link>
          )}
        </div>
      </div>

      {searching && (
        <form onSubmit={submitSearch} className="border-t border-border bg-surface px-4 py-3">
          <div className="mx-auto flex max-w-3xl items-center gap-2">
            <Search size={18} className="text-yellow" />
            <input
              autoFocus value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Search Entertainment Trends…"
              className="flex-1 bg-transparent text-lg outline-none placeholder:text-muted-foreground"
            />
            <button type="submit" className="yellow-bar px-4 py-1.5 text-sm font-bold uppercase tracking-wider">Go</button>
          </div>
        </form>
      )}

      {open && (
        <div className="border-t border-border bg-surface px-4 py-3 md:hidden">
          <nav className="grid gap-1">
            {categories.map((c) => (
              <Link
                key={c.id} to="/category/$slug" params={{ slug: c.slug }}
                onClick={() => setOpen(false)}
                className="display border-b border-border py-2 text-sm font-bold uppercase tracking-wider"
              >
                {c.name}
              </Link>
            ))}
            {isAdmin && <Link to="/admin" onClick={() => setOpen(false)} className="display py-2 text-sm font-bold uppercase tracking-wider text-yellow">Admin Dashboard</Link>}
          </nav>
        </div>
      )}
    </header>
  );
}

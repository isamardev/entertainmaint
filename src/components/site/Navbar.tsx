import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Menu, Search, X } from "lucide-react";
import { categoryService } from "@/services/articleService";

export function Navbar() {
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: categoryService.list,
  });
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
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b-0">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <button className="md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>

        <Link to="/" className="flex shrink-0 items-center gap-3">
          <img src="/logo.png" alt="Entertainment Trends" className="h-11 w-11 object-contain" />
          <span className="display hidden text-lg font-black uppercase tracking-tight sm:inline">
            Entertainment <span className="text-black">Trends</span>
          </span>
        </Link>

        <nav className="ml-4 hidden flex-1 items-center gap-1 md:flex">
          {categories.map((c) => (
            <Link
              key={c.id}
              to="/category/$slug"
              params={{ slug: c.slug }}
              className="display px-3 py-2 text-sm font-bold uppercase tracking-wider text-foreground/80 transition-colors hover:text-black"
              activeProps={{ className: "text-black" }}
            >
              {c.name}
            </Link>
          ))}
          <div className="mx-2 h-5 w-px bg-border/70" aria-hidden="true" />
          <Link
            to="/contact"
            className="display px-3 py-2 text-sm font-bold uppercase tracking-wider text-foreground/80 transition-colors hover:text-black"
            activeProps={{ className: "text-black" }}
          >
            Contact Us
          </Link>
          <Link
            to="/privacy-policy"
            className="display px-3 py-2 text-sm font-bold uppercase tracking-wider text-foreground/80 transition-colors hover:text-black"
            activeProps={{ className: "text-black" }}
          >
            Privacy Policy
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setSearching((v) => !v)}
            aria-label="Search"
            className="p-2 hover:text-black"
          >
            <Search size={20} />
          </button>
        </div>
      </div>

      {searching && (
        <form onSubmit={submitSearch} className="border-t border-border bg-surface px-4 py-3">
          <div className="mx-auto flex max-w-3xl items-center gap-2">
            <Search size={18} className="text-black" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search Entertainment Trends…"
              className="flex-1 bg-transparent text-lg outline-none placeholder:text-muted-foreground"
            />
            <button className="yellow-bar px-4 py-1.5 text-sm font-bold uppercase tracking-wider">
              Go
            </button>
          </div>
        </form>
      )}

      {open && (
        <div className="border-t border-border bg-surface px-4 py-3 md:hidden">
          <nav className="grid gap-1">
            {categories.map((c) => (
              <Link
                key={c.id}
                to="/category/$slug"
                params={{ slug: c.slug }}
                onClick={() => setOpen(false)}
                className="display border-b border-border py-2 text-sm font-bold uppercase tracking-wider"
              >
                {c.name}
              </Link>
            ))}
            <Link
              to="/contact"
              onClick={() => setOpen(false)}
              className="display border-b border-border py-2 text-sm font-bold uppercase tracking-wider"
            >
              Contact Us
            </Link>
            <Link
              to="/privacy-policy"
              onClick={() => setOpen(false)}
              className="display border-b border-border py-2 text-sm font-bold uppercase tracking-wider"
            >
              Privacy Policy
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

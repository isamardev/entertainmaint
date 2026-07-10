import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-4">
        <div>
          <img src="/logo.png" alt="Entertainment Trends" className="mb-3 h-12 w-12 object-contain" />
          <div className="display text-2xl font-black uppercase">
            Entertainment <span className="text-yellow">Trends</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">The pulse of pop culture — celebrity, TV, music, style, royals, and sport.</p>
        </div>
        <div>
          <div className="eyebrow mb-3">Sections</div>
          <ul className="space-y-1 text-sm">
            <li><Link to="/category/$slug" params={{ slug: "celebrity" }}>Celebrity</Link></li>
            <li><Link to="/category/$slug" params={{ slug: "movies-tv" }}>Movies &amp; TV</Link></li>
            <li><Link to="/category/$slug" params={{ slug: "music" }}>Music</Link></li>
            <li><Link to="/category/$slug" params={{ slug: "style" }}>Style</Link></li>
          </ul>
        </div>
        <div>
          <div className="eyebrow mb-3">Company</div>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>About</li><li>Contact</li><li>Advertise</li><li>Careers</li>
          </ul>
        </div>
        <div>
          <div className="eyebrow mb-3">Follow</div>
          <div className="flex gap-3">
            <a className="rounded border border-border p-2 hover:border-yellow hover:text-yellow"><Twitter size={16} /></a>
            <a className="rounded border border-border p-2 hover:border-yellow hover:text-yellow"><Facebook size={16} /></a>
            <a className="rounded border border-border p-2 hover:border-yellow hover:text-yellow"><Instagram size={16} /></a>
            <a className="rounded border border-border p-2 hover:border-yellow hover:text-yellow"><Youtube size={16} /></a>
          </div>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Entertainment Trends. All rights reserved.
      </div>
    </footer>
  );
}

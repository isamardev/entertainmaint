import { Facebook, Link2, MessageCircle, Twitter } from "lucide-react";
import { useState } from "react";

export function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const enc = encodeURIComponent;
  const links = [
    { icon: Twitter, label: "X", href: `https://twitter.com/intent/tweet?url=${enc(url)}&text=${enc(title)}` },
    { icon: Facebook, label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}` },
    { icon: MessageCircle, label: "WhatsApp", href: `https://api.whatsapp.com/send?text=${enc(title + " " + url)}` },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="eyebrow mr-2">Share</span>
      {links.map((l) => (
        <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer"
           className="inline-flex items-center gap-1 border border-border px-3 py-1.5 text-xs font-semibold uppercase tracking-wider hover:border-yellow hover:text-yellow">
          <l.icon size={14} /> {l.label}
        </a>
      ))}
      <button
        onClick={() => { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
        className="inline-flex items-center gap-1 border border-border px-3 py-1.5 text-xs font-semibold uppercase tracking-wider hover:border-yellow hover:text-yellow"
      >
        <Link2 size={14} /> {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}

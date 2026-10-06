import { useEffect, useState } from "react";
import { Facebook, Instagram, Linkedin, Mail, Twitter, Youtube } from "lucide-react";
import { getPublicSocialLinks, type SocialLinks } from "@/services/settingsService";

function mailtoOrDirect(email: string): string {
  if (!email) return "";
  if (/^mailto:/i.test(email)) return email;
  return `mailto:${email}`;
}

function waOrDirect(whatsapp: string): string {
  if (!whatsapp) return "";
  if (/^https?:\/\//i.test(whatsapp) || /^whatsapp:/i.test(whatsapp)) return whatsapp;
  const digits = whatsapp.replace(/[^\d]/g, "");
  if (digits) return `https://wa.me/${digits}`;
  return `https://${whatsapp.replace(/^[\/]+/, "")}`;
}

function resolveLink(key: keyof SocialLinks, value: string): string {
  if (!value) return "";
  if (key === "email") return mailtoOrDirect(value);
  if (key === "whatsapp") return waOrDirect(value);
  if (/^(https?:|mailto:|tel:|whatsapp:)/i.test(value)) return value;
  if (value.startsWith("//")) return `https:${value}`;
  return `https://${value.replace(/^[\/]+/, "")}`;
}

function externalAttrs(url: string): React.AnchorHTMLAttributes<HTMLAnchorElement> {
  if (!url) return {};
  const looksExternal = /^https?:\/\//i.test(url);
  if (looksExternal) {
    return { target: "_blank", rel: "noreferrer noopener nofollow" };
  }
  return {};
}

function TikTok({ size = 16 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 12a4 4 0 1 0 4 4V3a7 7 0 0 0 5 2.4 7 7 0 0 1-5 6.6" />
    </svg>
  );
}

function Threads({ size = 16 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M8 21c-4 0-5-3.2-5-9S4 3 8 3h8c4 0 5 3.2 5 9s-1 9-5 9-5-4-5-4 1 3 4 1 2-5-4-5-8 2-8 5" />
      <path d="M13 8c3.5.5 4 3 4 4s-.5 3.5-4 4" />
    </svg>
  );
}

function Globe({ size = 16 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18" />
    </svg>
  );
}

function Whatsapp({ size = 16 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 11.5a9 9 0 0 1-13.2 8L3 21l1.5-4.8A9 9 0 1 1 21 11.5Z" />
      <path d="M8.5 9c.4-1.5 2-1.6 2.6-1.6.6 0 1.7 1 1.7 1.4 0 .4-.2.7-.6 1-.4.3-.5.5-.1 1 .4.5 1.4 2 2.5 3 1.1 1 1.3.7 2 .2.7-.5 1.3-.6 2.4-.2 1 2.8 1.5 3.5.8 5-.8 1.4-3.8 3.7-8.6.3-4.5-1.5-8.3-4.2-8.3Z" />
    </svg>
  );
}

export type SocialFollowLinksProps = {
  iconSize?: number;
  onlyNonEmpty?: boolean;
  className?: string;
  linkClassName?: string;
};

export function SocialFollowLinks({
  iconSize = 16,
  onlyNonEmpty = true,
  className = "flex gap-3",
  linkClassName = "rounded border border-border p-2 hover:border-yellow hover:text-yellow",
}: SocialFollowLinksProps) {
  const [socials, setSocials] = useState<SocialLinks | null>(null);
  useEffect(() => {
    let cancelled = false;
    getPublicSocialLinks()
      .then((s) => {
        if (cancelled) return;
        setSocials(s);
      })
      .catch(() => {
        if (!cancelled) setSocials({} as SocialLinks);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!socials) {
    return <div className={className} aria-hidden="true" />;
  }

  const items: Array<{ key: keyof SocialLinks; label: string; node: React.ReactNode }> = [
    { key: "facebook", label: "Facebook", node: <Facebook size={iconSize} /> },
    { key: "x", label: "X", node: <Twitter size={iconSize} /> },
    { key: "instagram", label: "Instagram", node: <Instagram size={iconSize} /> },
    { key: "youtube", label: "YouTube", node: <Youtube size={iconSize} /> },
    { key: "tiktok", label: "TikTok", node: <TikTok size={iconSize} /> },
    { key: "threads", label: "Threads", node: <Threads size={iconSize} /> },
    { key: "linkedin", label: "LinkedIn", node: <Linkedin size={iconSize} /> },
    { key: "whatsapp", label: "WhatsApp", node: <Whatsapp size={iconSize} /> },
    { key: "email", label: "Email", node: <Mail size={iconSize} /> },
    { key: "website", label: "Website", node: <Globe size={iconSize} /> },
  ];

  const visible = onlyNonEmpty ? items.filter((it) => Boolean(socials[it.key])) : items;

  if (visible.length === 0) return null;

  return (
    <div className={className} aria-label="Social links">
      {visible.map((it) => {
        const raw = socials[it.key];
        const url = resolveLink(it.key, raw);
        if (!url) return null;
        return (
          <a
            key={it.key}
            href={url}
            aria-label={it.label}
            title={it.label}
            className={linkClassName}
            {...externalAttrs(url)}
          >
            {it.node}
          </a>
        );
      })}
    </div>
  );
}

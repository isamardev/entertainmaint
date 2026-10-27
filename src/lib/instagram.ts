/**
 * Utility functions for parsing and normalizing Instagram URLs.
 */

export function extractInstagramShortcode(url?: string | null): string | null {
  if (!url) return null;
  const clean = url.trim().replace(/^[`"']+|[`"']+$/g, "");
  const match = clean.match(
    /(?:instagram\.com|instagr\.am)\/(?:p|reel|reels|tv|share\/p)\/([A-Za-z0-9_-]+)/i,
  );
  return match && match[1] ? match[1] : null;
}

export function normalizeInstagramUrl(url?: string | null): string {
  if (!url) return "";
  const shortcode = extractInstagramShortcode(url);
  if (shortcode) {
    return `https://www.instagram.com/p/${shortcode}/`;
  }
  return url.trim().replace(/^[`"']+|[`"']+$/g, "");
}

export function formatCaptionHtml(caption?: string | null): string {
  if (!caption) return "";
  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const safe = escape(caption);
  return safe
    .replace(
      /(#[a-zA-Z0-9_\u0080-\uFFFF]+)/g,
      '<span class="text-[#00376b] font-medium no-underline cursor-pointer">$1</span>',
    )
    .replace(
      /(@[a-zA-Z0-9_.]+)/g,
      '<span class="text-[#00376b] font-medium no-underline cursor-pointer">$1</span>',
    );
}

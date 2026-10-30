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

export function isInstagramReel(url?: string | null): boolean {
  if (!url) return false;
  return /\/(?:reel|reels)\/([A-Za-z0-9_-]+)/i.test(url);
}

export function getInstagramEmbedUrl(url?: string | null): string {
  const shortcode = extractInstagramShortcode(url);
  if (!shortcode) return "";
  const isReel = isInstagramReel(url);
  if (isReel) {
    return `https://www.instagram.com/reel/${shortcode}/embed/?autoplay=1&muted=1`;
  }
  return `https://www.instagram.com/p/${shortcode}/embed/captioned/?autoplay=1&muted=1`;
}

export function normalizeInstagramUrl(url?: string | null): string {
  if (!url) return "";
  const shortcode = extractInstagramShortcode(url);
  if (shortcode) {
    const isReel = isInstagramReel(url);
    return isReel
      ? `https://www.instagram.com/reel/${shortcode}/`
      : `https://www.instagram.com/p/${shortcode}/`;
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

export interface InstagramMediaResult {
  success: boolean;
  shortcode?: string;
  type?: "video" | "image" | "carousel";
  isCarousel?: boolean;
  mediaUrl?: string | null;
  videoUrl?: string | null;
  imageUrl?: string | null;
  rawVideoUrl?: string | null;
  rawImageUrl?: string | null;
  caption?: string | null;
  likes?: number | null;
  comments?: number | null;
  username?: string | null;
  profilePicUrl?: string | null;
  dimensions?: { width: number; height: number } | null;
  isLandscape?: boolean;
  aspectRatio?: number | null;
  embedUrl?: string;
  error?: string;
}

/**
 * Resilient Instagram media fetcher with dual-endpoint fallback:
 * 1. Tries same-origin /api/media/instagram (reverse proxied)
 * 2. If reverse proxy fails (e.g. net::ERR_CONTENT_DECODING_FAILED or 5xx),
 *    immediately falls back to direct Hostinger CORS endpoint.
 */
export async function fetchInstagramMedia(
  rawUrl?: string | null,
): Promise<InstagramMediaResult | null> {
  if (!rawUrl) return null;
  const shortcode = extractInstagramShortcode(rawUrl);
  const canonical = shortcode
    ? `https://www.instagram.com/p/${shortcode}/`
    : normalizeInstagramUrl(rawUrl);
  if (!canonical) return null;

  const encoded = encodeURIComponent(canonical);
  const endpoints = [
    `/api/media/instagram?url=${encoded}`,
    `https://aliceblue-goose-490382.hostingersite.com/api/media/instagram?url=${encoded}`,
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) continue;
      const data = (await res.json()) as InstagramMediaResult;
      if (
        data &&
        (data.success ||
          data.videoUrl ||
          data.rawVideoUrl ||
          data.imageUrl ||
          data.rawImageUrl)
      ) {
        return {
          ...data,
          success: true,
          shortcode: data.shortcode || shortcode || undefined,
        };
      }
    } catch (err) {
      // Primary proxy may encounter ERR_CONTENT_DECODING_FAILED or network issue; fallback will succeed
      console.warn(`[instagram-fetcher] Endpoint ${ep} failed, trying fallback if available:`, err);
    }
  }

  return null;
}


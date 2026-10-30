import { useEffect, useRef, useState } from "react";
import {
  extractInstagramShortcode,
  isInstagramReel,
  normalizeInstagramUrl,
} from "@/lib/instagram";

export interface InstagramRawMediaProps {
  url: string;
  className?: string;
}

/**
 * Pure official Instagram iframe embed component.
 * - Renders the official Instagram responsive iframe directly.
 * - Zero third-party scrapers, zero external dependencies.
 * - Configured with allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share; fullscreen"
 *   and ?autoplay=1&muted=1 for automated muted playback.
 * - Sized cleanly to measured Instagram height with zero inner scrollbars.
 */
export function InstagramIframeEmbed({ url, className = "" }: InstagramRawMediaProps) {
  const shortcode = extractInstagramShortcode(url);
  const isReel = isInstagramReel(url);
  const canonicalUrl = shortcode
    ? isReel
      ? `https://www.instagram.com/reel/${shortcode}/`
      : `https://www.instagram.com/p/${shortcode}/`
    : normalizeInstagramUrl(url);

  const [height, setHeight] = useState<number>(620);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.origin || !event.origin.includes("instagram.com")) return;
      try {
        const payload = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (
          payload &&
          (payload.type === "MEASURE" || payload.type === "MOUNTED") &&
          payload.details?.height
        ) {
          const h = Number(payload.details.height);
          if (h && h > 200 && h < 2500) {
            setHeight(h);
          }
        }
      } catch {}
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  if (!shortcode) {
    return (
      <figure
        className={`my-8 flex flex-col items-center justify-center w-full max-w-md mx-auto ${className}`}
      >
        <div className="w-full p-6 bg-neutral-50 rounded-xl border border-neutral-200 text-center shadow-xs flex flex-col items-center">
          <p className="text-sm text-neutral-700 font-medium mb-3">View post on Instagram</p>
          <a
            href={canonicalUrl || url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2 rounded-lg bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition"
          >
            Open Instagram
          </a>
        </div>
      </figure>
    );
  }

  const iframeSrc = isReel
    ? `https://www.instagram.com/reel/${shortcode}/embed/?autoplay=1&muted=1`
    : `https://www.instagram.com/p/${shortcode}/embed/captioned/?autoplay=1&muted=1`;

  const maxWidthStyle = isReel ? "380px" : "540px";

  return (
    <figure
      className={`instagram-carousel-figure my-8 flex flex-col items-center justify-center w-full mx-auto bg-transparent ${className}`}
      style={{ maxHeight: "none", overflow: "visible" }}
    >
      <div
        className={`instagram-carousel-wrap instagram-embed-slot w-full mx-auto flex flex-col items-center justify-start bg-white rounded-xl shadow-xs border border-neutral-200 ${
          isReel ? "instagram-reel-wrap max-w-[380px]" : "max-w-[540px]"
        }`}
        data-instagram-shortcode={shortcode}
        data-instagram-url={canonicalUrl}
        data-instagram-is-reel={isReel ? "true" : "false"}
        style={{
          width: "100%",
          maxWidth: maxWidthStyle,
          minHeight: "480px",
          height: `${height}px`,
          overflow: "visible",
        }}
      >
        <iframe
          ref={iframeRef}
          src={iframeSrc}
          title="Instagram Post"
          className="instagram-official-iframe w-full h-full block border-0 bg-white"
          style={{
            width: "100%",
            maxWidth: maxWidthStyle,
            height: "100%",
            minHeight: "480px",
            border: "0",
            display: "block",
            overflow: "visible",
            backgroundColor: "#ffffff",
          }}
          scrolling="no"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share; fullscreen"
          allowFullScreen
          allowTransparency
          loading="lazy"
        />
      </div>
    </figure>
  );
}

// Aliases for compatibility
export const InstagramRawMedia = InstagramIframeEmbed;

export function InstagramCarouselEmbed({
  shortcode,
  className = "",
}: {
  shortcode: string;
  canonicalUrl?: string;
  className?: string;
}) {
  return (
    <InstagramIframeEmbed
      url={`https://www.instagram.com/p/${shortcode}/`}
      className={className}
    />
  );
}

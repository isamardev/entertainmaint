import { useEffect, useRef, useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";

import { extractInstagramShortcode, normalizeInstagramUrl } from "@/lib/instagram";
import { registerScrollAutoPlay } from "@/lib/video-autoplay";

interface InstagramMediaState {
  type: "video" | "image";
  videoUrl?: string | null;
  imageUrl?: string | null;
  rawVideoUrl?: string | null;
  rawImageUrl?: string | null;
  aspectRatio?: number | null;
}

export interface InstagramRawMediaProps {
  url: string;
  className?: string;
}

export function InstagramRawMedia({ url, className = "" }: InstagramRawMediaProps) {
  const shortcode = extractInstagramShortcode(url);
  const canonicalUrl = shortcode
    ? `https://www.instagram.com/p/${shortcode}/`
    : normalizeInstagramUrl(url);

  const [media, setMedia] = useState<InstagramMediaState | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [triedRawVideo, setTriedRawVideo] = useState(false);
  const [triedRawImage, setTriedRawImage] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [isPortrait, setIsPortrait] = useState<boolean>(false);

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setHasError(false);
    setTriedRawVideo(false);
    setTriedRawImage(false);

    if (!canonicalUrl) {
      setLoading(false);
      setHasError(true);
      return;
    }

    const endpoint = `/api/media/instagram?url=${encodeURIComponent(canonicalUrl)}`;

    fetch(endpoint)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Media fetch returned HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (isCancelled) return;
        if (!data || !data.success) {
          setHasError(true);
          return;
        }

        const isVideo =
          data.type === "video" ||
          Boolean(data.videoUrl || data.rawVideoUrl) ||
          Boolean(data.mediaUrl && String(data.mediaUrl).includes(".mp4"));

        const chosenVideo = data.videoUrl || data.rawVideoUrl || null;
        const chosenImage = data.imageUrl || data.rawImageUrl || null;

        const ratio =
          data.aspectRatio ||
          (data.dimensions?.width && data.dimensions?.height
            ? data.dimensions.width / data.dimensions.height
            : null);
        if (ratio) {
          setAspectRatio(ratio);
          setIsPortrait(ratio < 0.95);
        }

        if (isVideo && chosenVideo) {
          setMedia({
            type: "video",
            videoUrl: chosenVideo,
            imageUrl: chosenImage,
            rawVideoUrl: data.rawVideoUrl || chosenVideo,
            rawImageUrl: data.rawImageUrl || chosenImage,
            aspectRatio: ratio,
          });
        } else if (chosenImage) {
          setMedia({
            type: "image",
            imageUrl: chosenImage,
            rawImageUrl: data.rawImageUrl || chosenImage,
            aspectRatio: ratio,
          });
        } else {
          setHasError(true);
        }
      })
      .catch(() => {
        if (!isCancelled) setHasError(true);
      })
      .finally(() => {
        if (!isCancelled) setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [canonicalUrl]);

  // Smart Viewport Scroll Autoplay & Pause:
  // - Autoplays when user scrolls and stops at the video
  // - Pauses immediately when user scrolls past it (up or down)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || media?.type !== "video") return;

    return registerScrollAutoPlay(video);
  }, [media?.type, media?.videoUrl]);

  // Loading state: modern subtle skeleton card
  if (loading) {
    return (
      <figure className={`my-8 flex justify-center items-center w-full bg-transparent ${className}`}>
        <div className="w-full max-w-sm aspect-[4/5] rounded-xl bg-neutral-100 border border-neutral-200 animate-pulse flex flex-col items-center justify-center gap-2.5 text-neutral-400 shadow-xs">
          <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Loading Instagram media...
          </span>
        </div>
      </figure>
    );
  }

  // Fallback state: extraction failed or media could not be loaded
  if (hasError || !media) {
    return (
      <figure className={`my-8 flex flex-col items-center justify-center w-full max-w-md mx-auto ${className}`}>
        <div className="w-full p-6 sm:p-8 bg-neutral-50 rounded-xl border border-neutral-200 text-center shadow-xs flex flex-col items-center">
          <div className="w-12 h-12 mb-3.5 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shadow-sm">
            <svg
              className="w-6 h-6"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
            Instagram Post
          </span>
          <p className="text-sm text-neutral-700 font-medium mb-4">
            View full post and media on Instagram
          </p>
          <a
            href={canonicalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:from-purple-700 hover:via-pink-700 hover:to-amber-600 text-white font-bold text-sm tracking-wide shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 no-underline"
          >
            <span>View on Instagram</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </figure>
    );
  }

  // 1. Video presentation: ONLY the native HTML <video controls> tag, with autoplay & natural aspect ratio (NO black bars)
  if (media.type === "video" && media.videoUrl) {
    return (
      <figure className={`my-8 flex justify-center items-center w-full bg-transparent ${className}`}>
        <div
          className="w-fit max-w-full mx-auto flex justify-center items-center overflow-hidden rounded-xl bg-transparent"
          style={{
            maxWidth: isPortrait ? "min(100%, 420px)" : "100%",
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            controls
            preload="auto"
            poster={media.imageUrl || media.rawImageUrl || undefined}
            src={media.videoUrl}
            referrerPolicy="no-referrer"
            onLoadedMetadata={(e) => {
              const v = e.currentTarget;
              if (v.videoWidth && v.videoHeight) {
                const r = v.videoWidth / v.videoHeight;
                setAspectRatio(r);
                setIsPortrait(v.videoHeight > v.videoWidth);
              }
            }}
            onError={() => {
              // Try direct CDN URL if proxied route failed
              if (
                !triedRawVideo &&
                media.rawVideoUrl &&
                media.rawVideoUrl !== media.videoUrl
              ) {
                setTriedRawVideo(true);
                setMedia((prev) => (prev ? { ...prev, videoUrl: prev.rawVideoUrl } : null));
              } else {
                setHasError(true);
              }
            }}
            className="block mx-auto rounded-xl shadow-md w-auto max-w-full max-h-[80vh] object-contain bg-transparent"
            style={{
              aspectRatio: aspectRatio ? `${aspectRatio}` : undefined,
              maxWidth: isPortrait ? "min(100%, 420px)" : "100%",
              width: "auto",
              backgroundColor: "transparent",
            }}
          />
        </div>
      </figure>
    );
  }

  // 2. Image presentation: ONLY the native HTML <img> tag, no Instagram UI, zero black pillarboxes
  if (media.type === "image" && media.imageUrl) {
    return (
      <figure className={`my-8 flex justify-center items-center w-full bg-transparent ${className}`}>
        <div
          className="w-fit max-w-full mx-auto flex justify-center items-center overflow-hidden rounded-xl bg-transparent"
          style={{
            maxWidth: isPortrait ? "min(100%, 460px)" : "100%",
          }}
        >
          <img
            src={media.imageUrl}
            alt="Instagram media"
            loading="lazy"
            referrerPolicy="no-referrer"
            onLoad={(e) => {
              const img = e.currentTarget;
              if (img.naturalWidth && img.naturalHeight) {
                const r = img.naturalWidth / img.naturalHeight;
                setAspectRatio(r);
                setIsPortrait(img.naturalHeight > img.naturalWidth);
              }
            }}
            onError={() => {
              // Try direct CDN URL if proxied route failed
              if (
                !triedRawImage &&
                media.rawImageUrl &&
                media.rawImageUrl !== media.imageUrl
              ) {
                setTriedRawImage(true);
                setMedia((prev) => (prev ? { ...prev, imageUrl: prev.rawImageUrl } : null));
              } else {
                setHasError(true);
              }
            }}
            className="block mx-auto rounded-xl shadow-md w-auto max-w-full max-h-[80vh] object-contain bg-transparent"
            style={{
              aspectRatio: aspectRatio ? `${aspectRatio}` : undefined,
              maxWidth: isPortrait ? "min(100%, 460px)" : "100%",
              width: "auto",
              backgroundColor: "transparent",
            }}
          />
        </div>
      </figure>
    );
  }

  // Fallback if neither URL is valid
  return (
    <figure className={`my-8 flex flex-col items-center justify-center w-full max-w-md mx-auto ${className}`}>
      <div className="w-full p-6 bg-neutral-50 rounded-xl border border-neutral-200 text-center shadow-xs flex flex-col items-center">
        <a
          href={canonicalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:from-purple-700 hover:via-pink-700 hover:to-amber-600 text-white font-bold text-sm tracking-wide shadow-md transition-all duration-200 no-underline"
        >
          <span>View on Instagram</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </figure>
  );
}

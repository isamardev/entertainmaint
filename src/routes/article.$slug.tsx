import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Loader2 } from "lucide-react";
import { articleService } from "@/services/articleService";
import { ArticleCard } from "@/components/site/ArticleCard";
import { ShareButtons } from "@/components/site/ShareButtons";
import { TrendingSidebar, SmartStickySidebar } from "@/components/site/Sidebar";
import { InstagramIframeEmbed, InstagramRawMedia } from "@/components/site/InstagramRawMedia";
import {
  extractInstagramShortcode,
  normalizeInstagramUrl,
  formatCaptionHtml,
  isInstagramReel,
  getInstagramEmbedUrl,
} from "@/lib/instagram";
import {
  initArticleVideoAutoPlay,
  registerPlayableMedia,
  evaluateActiveVideo,
  calculateElementVisibility,
  registerScrollAutoPlay,
} from "@/lib/video-autoplay";
import { shortDate } from "@/lib/format";

export const Route = createFileRoute("/article/$slug")({
  loader: async ({ params }) => {
    const article = await articleService.getBySlug(params.slug);
    if (!article || article.status !== "published") throw notFound();
    return { article };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData)
      return {
        meta: [{ title: "Article — Entertainment Trends" }, { name: "robots", content: "noindex" }],
      };
    const a = loaderData.article;
    const img = a.hero_image_hd ?? a.hero_image_lq;
    return {
      meta: [
        { title: `${a.title} — Entertainment Trends` },
        { name: "description", content: a.dek ?? a.title },
        { property: "og:title", content: a.title },
        { property: "og:description", content: a.dek ?? "" },
        { property: "og:type", content: "article" },
        { property: "og:url", content: `/article/${params.slug}` },
        ...(img
          ? [
              { property: "og:image", content: img },
              { name: "twitter:image", content: img },
            ]
          : []),
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            headline: a.title,
            description: a.dek,
            image: img ? [img] : undefined,
            datePublished: a.published_at,
            articleSection: a.category?.name,
          }),
        },
      ],
    };
  },
  errorComponent: ({ error }: { error: any }) => (
    <div className="p-8 text-center">{error?.message || "An error occurred"}</div>
  ),
  notFoundComponent: () => (
    <div className="p-8 text-center">
      <div className="display mb-4 text-xl font-black">Article not found</div>
      <Link
        to="/"
        className="mt-4 inline-block yellow-bar px-4 py-2 font-bold uppercase tracking-widest"
      >
        Back home
      </Link>
    </div>
  ),
  component: ArticlePage,
});

function ArticlePage() {
  const { article } = Route.useLoaderData();
  const articleContainerRef = useRef<HTMLDivElement | null>(null);
  const proseRef = useRef<HTMLDivElement | null>(null);
  const [moreStoriesCount, setMoreStoriesCount] = useState(6);
  const [isLoadingMoreStories, setIsLoadingMoreStories] = useState(false);

  const { data: related = [] } = useQuery({
    queryKey: ["related", article.id],
    queryFn: () => articleService.related(article),
  });
  const { data: trending = [] } = useQuery({
    queryKey: ["trending-article"],
    queryFn: () => articleService.listTrending(24),
    staleTime: 60_000,
  });
  const url = typeof window !== "undefined" ? window.location.href : `/article/${article.slug}`;
  const articleBodyHtml = formatArticleBody(article.body);

  useEffect(() => {
    if (!articleContainerRef.current || typeof document === "undefined") return;
    const container = articleContainerRef.current;
    const root = proseRef.current || container;
    const hasTwitter = !!root.querySelector("blockquote.twitter-tweet");
    const hasTiktok = !!root.querySelector("blockquote.tiktok-embed");
    const hasFacebook = !!root.querySelector("blockquote.fb-post");

    // Twitter / X
    if (hasTwitter) {
      const poll = (attempts = 0) => {
        const w = window as any;
        if (w.twttr?.widgets?.load) {
          try {
            w.twttr.widgets.load(root);
          } catch {}
          return;
        }
        if (attempts < 40) {
          setTimeout(() => poll(attempts + 1), 80);
        }
      };
      if (!document.querySelector('script[src="https://platform.twitter.com/widgets.js"]')) {
        const s = document.createElement("script");
        s.async = true;
        s.defer = true;
        s.src = "https://platform.twitter.com/widgets.js";
        s.onerror = () => {};
        document.body.appendChild(s);
      }
      poll();
    }

    // Instagram: hydrate official responsive embeds
    const hasInstagram =
      !!root.querySelector("blockquote.instagram-media") ||
      !!document.querySelector("blockquote.instagram-media");

    if (hasInstagram) {
      const pollIg = (attempts = 0) => {
        const w = window as any;
        if (w.instgrm?.Embeds?.process) {
          try {
            w.instgrm.Embeds.process();
            return;
          } catch {}
        }
        if (attempts < 50) setTimeout(() => pollIg(attempts + 1), 80);
      };

      if (!document.querySelector('script[src*="instagram.com/embed.js"]')) {
        const s = document.createElement("script");
        s.async = true;
        s.defer = true;
        s.src = "https://www.instagram.com/embed.js";
        s.onload = () => pollIg();
        s.onerror = () => {};
        document.body.appendChild(s);
      } else {
        pollIg();
      }
    }

    // TikTok
    if (hasTiktok) {
      const existing = document.querySelector(
        'script[src="https://www.tiktok.com/embed.js"]',
      ) as HTMLScriptElement | null;
      if (!existing) {
        const s = document.createElement("script");
        s.async = true;
        s.defer = true;
        s.src = "https://www.tiktok.com/embed.js";
        s.onerror = () => {};
        document.body.appendChild(s);
      }
    }

    // Facebook
    if (hasFacebook) {
      const ensureRoot = () => {
        if (!document.getElementById("fb-root")) {
          const r = document.createElement("div");
          r.id = "fb-root";
          document.body.prepend(r);
        }
      };
      const parse = () => {
        try {
          const w = window as any;
          if (w.FB?.XFBML?.parse) w.FB.XFBML.parse(root);
        } catch {}
      };
      ensureRoot();
      const existing = document.querySelector(
        'script[src="https://connect.facebook.net/en_US/sdk.js"]',
      ) as HTMLScriptElement | null;
      if (existing && (window as any).FB?.XFBML?.parse) {
        setTimeout(parse, 0);
      } else {
        const s = existing ?? document.createElement("script");
        s.async = true;
        s.defer = true;
        s.src = "https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v18.0";
        s.crossOrigin = "anonymous";
        s.onload = () => setTimeout(parse, 80);
        s.onerror = () => {};
        if (!existing) document.body.appendChild(s);
      }
    }

    // Smart Viewport Scroll Autoplay & Pause for ALL videos & embeds:
    // - Autoplays when user scrolls to a video/embed post (closest to viewport center)
    // - Pauses immediately when user scrolls past it (up or down)
    // - Automatically plays the next video in view ("assy he chlta rehy")
    const cleanupVideos = initArticleVideoAutoPlay(container);

    // Auto-adjust Instagram iframes based on Instagram MEASURE messages
    const handleIgMessage = (event: MessageEvent) => {
      if (!event.origin || !event.origin.includes("instagram.com")) return;
      try {
        const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (data && (data.type === "MEASURE" || data.type === "MOUNTED") && data.details?.height) {
          const h = Number(data.details.height);
          if (h && h > 200 && h < 2500) {
            const iframes = container.querySelectorAll<HTMLIFrameElement>("iframe.instagram-official-iframe");
            iframes.forEach((ifr) => {
              if (ifr.contentWindow === event.source) {
                ifr.style.height = `${h}px`;
                ifr.style.minHeight = `${h}px`;
                const parentWrap = ifr.closest(".instagram-embed-frame-wrap, .instagram-carousel-wrap") as HTMLElement | null;
                if (parentWrap) {
                  parentWrap.style.height = `${h}px`;
                  parentWrap.style.minHeight = `${h}px`;
                }
              }
            });
          }
        }
      } catch {}
    };
    window.addEventListener("message", handleIgMessage);
    return () => {
      cleanupVideos();
      window.removeEventListener("message", handleIgMessage);
    };
  }, [articleBodyHtml, article.embed_url]);

  const readNext = trending.slice(0, 3);
  const moreStoriesList = trending.filter((a) => a.id !== article.id);
  const displayedMore = moreStoriesList.slice(0, moreStoriesCount);
  const hasMoreStories = moreStoriesCount < moreStoriesList.length;

  const handleShowMoreStories = () => {
    setIsLoadingMoreStories(true);
    setTimeout(() => {
      setMoreStoriesCount((prev) => prev + 6);
      setIsLoadingMoreStories(false);
    }, 250);
  };

  return (
    <>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div ref={articleContainerRef} className="max-w-4xl min-w-0">
          <header className="mb-6">
            <h1 className="article-headline font-serif text-xl sm:text-2xl md:text-[28px] lg:text-[32px] font-bold leading-[1.2] tracking-tight text-[#111111] mb-3 normal-case">
              {article.title}
            </h1>
            {article.dek && (
              <p className="mt-2 text-sm sm:text-base text-neutral-600 font-normal leading-relaxed">
                {article.dek}
              </p>
            )}
            <div className="meta mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
              <span className="font-semibold text-neutral-900">By Entertainment Trends Staff</span>
              {article.category?.name && (
                <>
                  <span className="text-neutral-300">•</span>
                  <Link to="/category/$slug" params={{ slug: article.category.slug }}>
                    <div className="eyebrow inline-block">{article.category.name}</div>
                  </Link>
                </>
              )}
              <span className="text-neutral-300">•</span>
              {(() => {
                const published = article.published_at
                  ? new Date(article.published_at).getTime()
                  : 0;
                const updated = article.updated_at ? new Date(article.updated_at).getTime() : 0;
                if (published && updated - published > 5000) {
                  return <span>Updated {shortDate(article.updated_at)}</span>;
                }
                return <span>Published {shortDate(article.published_at)}</span>;
              })()}
            </div>
          </header>

          {article.embed_url && <EmbeddedPost url={article.embed_url} />}

          <div
            ref={proseRef}
            className="article-body prose max-w-none text-[15px] sm:text-[16px] leading-[1.68] text-neutral-900 font-sans prose-p:my-3.5 prose-p:text-[15px] sm:prose-p:text-[16px] prose-p:leading-[1.68] prose-p:text-neutral-900 prose-headings:font-bold prose-headings:font-serif prose-headings:text-[#111111] prose-headings:tracking-tight prose-headings:normal-case prose-h2:text-xl sm:prose-h2:text-2xl prose-h2:mt-6 prose-h2:mb-2.5 prose-h3:text-lg sm:prose-h3:text-xl prose-h3:mt-5 prose-h3:mb-2 prose-a:text-[#cc0000] prose-a:font-medium hover:prose-a:underline prose-strong:text-black prose-strong:font-bold"
            dangerouslySetInnerHTML={{ __html: articleBodyHtml }}
          />

          <div className="my-10 border-y border-border py-4">
            <ShareButtons url={url} title={article.title} />
          </div>

          {displayedMore.length > 0 && (
            <section className="mt-16">
              <div className="mb-6 border-b-2 border-black pb-2">
                <h2 className="display text-2xl font-black uppercase">More Stories</h2>
              </div>
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {displayedMore.map((a: any) => (
                  <ArticleCard key={a.id} article={a} />
                ))}
              </div>

              {hasMoreStories && (
                <div className="mt-8 flex justify-center">
                  <button
                    type="button"
                    onClick={handleShowMoreStories}
                    disabled={isLoadingMoreStories}
                    className="w-full max-w-md py-3.5 px-8 border-2 border-black bg-white hover:bg-black text-black hover:text-white font-black uppercase text-sm tracking-widest transition-all duration-200 flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {isLoadingMoreStories ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Loading Stories...</span>
                      </>
                    ) : (
                      <span>Show More Stories</span>
                    )}
                  </button>
                </div>
              )}
            </section>
          )}

          {related.length > 0 && (
            <section className="mt-16">
              <div className="mb-6 border-b-2 border-black pb-2">
                <h2 className="display text-2xl font-black uppercase">Related Stories</h2>
              </div>
              <div className="flex gap-6 overflow-x-auto pb-4">
                {related.map((a: any) => (
                  <div key={a.id} className="min-w-[280px] max-w-xs flex-1">
                    <ArticleCard article={a} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {readNext.length > 0 && (
            <section className="mt-16">
              <div className="mb-6 border-b-2 border-black pb-2">
                <h2 className="display text-2xl font-black uppercase">Read Next</h2>
              </div>
              <div className="space-y-6">
                {readNext.map((a: any) => (
                  <ArticleCard key={a.id} article={a} horizontal />
                ))}
              </div>
            </section>
          )}

          <div className="mt-10 lg:hidden">
            <TrendingSidebar />
          </div>
        </div>

        <div className="relative hidden lg:block">
          <SmartStickySidebar>
            <TrendingSidebar />
          </SmartStickySidebar>
        </div>
      </div>
    </>
  );
}

function formatArticleBody(body: string) {
  const trimmed = (body || "").trim();
  if (!trimmed) return "<p></p>";

  // Ensure any Hostinger upload URLs in body are proxied via same-origin /api/uploads/
  let enriched = trimmed.replace(
    /https?:\/\/aliceblue-goose-490382\.hostingersite\.com\/api\/uploads\//gi,
    "/api/uploads/",
  );
  if (/<[a-z][\s\S]*>/i.test(enriched)) {
    enriched = sanitizeRichText(enriched);
  } else {
    enriched = trimmed
      .split(/\n\n+/)
      .map((para) => `<p>${escapeHtml(para).replace(/\n/g, "<br />")}</p>`)
      .join("");
  }

  // Convert any black backgrounds in database HTML to white so embeds never have black background gaps
  enriched = enriched.replace(/\b(bg-black|bg-slate-900|bg-gray-900|bg-zinc-900)\b/g, "bg-white");
  enriched = enriched.replace(/background(-color)?\s*:\s*(#000000|#000|black|rgb\(0,\s*0,\s*0\))/gi, "background: #ffffff");

  // Normalize any inline font-size styles from rich text / WordPress so paragraph size stays uniform
  enriched = enriched.replace(/\bfont-size\s*:\s*[^;"]+;?/gi, "");

  // 1. Unwrap any pre-existing raw figure/div wrappers around iframes before embed conversion
  enriched = enriched.replace(
    /<figure(?!\s*class="[^"]*instagram)\b[^>]*>\s*(?:<div(?!\s*class="[^"]*instagram)\b[^>]*>)?\s*(<iframe\b[\s\S]*?<\/iframe>)\s*(?:<\/div>)?\s*<\/figure>/gi,
    "$1",
  );

  // Transform Instagram blockquotes into official responsive embeds (reels/videos get .ig-embed-fit)
  enriched = enriched.replace(
    /(?:<figure[^>]*>\s*)?<blockquote\b[^>]*class="[^"]*instagram-media[^"]*"[^>]*>[\s\S]*?<\/blockquote>(?:\s*<\/figure>)?/gi,
    (fullMatch) => {
      const permalinkMatch =
        fullMatch.match(/data-instgrm-permalink="([^"]+)"/i) ||
        fullMatch.match(/data-embed-permalink="([^"]+)"/i) ||
        fullMatch.match(/href="([^"]+instagram\.com\/[^"]+)"/i);
      if (!permalinkMatch) return fullMatch;
      const permalink = permalinkMatch[1].replace(/^`|`$/g, "").replace(/&amp;/g, "&").trim();
      const shortcode = extractInstagramShortcode(permalink);
      if (!shortcode) return fullMatch;
      const isReel = isInstagramReel(permalink) || /\/reels?\/[A-Za-z0-9_-]+/i.test(permalink) || /reel/i.test(fullMatch);
      const maxWidth = isReel ? "380px" : "540px";
      const iframeSrc = isReel
        ? `https://www.instagram.com/reel/${shortcode}/embed/?autoplay=1&muted=1`
        : `https://www.instagram.com/p/${shortcode}/embed/captioned/?autoplay=1&muted=1`;
      return `<figure class="instagram-carousel-figure my-8 flex flex-col items-center justify-center w-full mx-auto bg-transparent"><div class="instagram-carousel-wrap instagram-embed-slot w-full ${isReel ? "instagram-reel-wrap max-w-[380px]" : "max-w-[540px]"} mx-auto flex flex-col items-center justify-start bg-white rounded-xl shadow-xs border border-neutral-200" data-instagram-shortcode="${shortcode}" data-instagram-url="${permalink}" data-instagram-is-reel="${isReel ? "true" : "false"}" style="width:100%;max-width:${maxWidth};min-height:480px;overflow:visible;"><iframe class="instagram-official-iframe w-full block border-0 bg-white" src="${iframeSrc}" style="width:100%;max-width:${maxWidth};min-height:480px;border:0;display:block;overflow:visible;background:#ffffff;" scrolling="no" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share; fullscreen" allowfullscreen allowtransparency="true" loading="lazy" title="Instagram Post"></iframe></div></figure>`;
    },
  );

  // Transform TikTok blockquotes into responsive vertical embeds
  enriched = enriched.replace(
    /(?:<figure[^>]*>\s*)?<blockquote\b[^>]*class="[^"]*tiktok-embed[^"]*"[^>]*>[\s\S]*?<\/blockquote>(?:\s*<\/figure>)?/gi,
    (fullMatch) => {
      const idMatch =
        fullMatch.match(/data-video-id="(\d+)"/i) ||
        fullMatch.match(/\/video\/(\d+)/i) ||
        fullMatch.match(/\/v\/(\d+)/i);
      if (idMatch && idMatch[1]) {
        const videoId = idMatch[1];
        return `<figure class="inline-embed my-6 flex flex-col items-center justify-center w-full max-h-[80vh] mx-auto text-center bg-transparent no-underline"><div class="mx-auto overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm w-fit" style="max-height:80vh; width:calc(80vh * 9 / 16); max-width:360px;"><iframe src="https://www.tiktok.com/embed/v2/${videoId}" title="TikTok Video" class="w-full h-full block border-0 bg-white" style="height: 100%; min-height: 360px; max-height: 80vh; width: 100%; border: 0;" scrolling="no" frameborder="0" allowtransparency="true"></iframe></div></figure>`;
      }
      return fullMatch;
    },
  );

  // 2. Wrap iframes cleanly with responsive containers according to platform/aspect ratio
  enriched = enriched.replace(/<iframe\b[\s\S]*?<\/iframe>/gi, (fullIframeTag) => {
    // Avoid double-wrapping our official instagram iframe
    if (fullIframeTag.includes("instagram-official-iframe")) {
      return fullIframeTag;
    }

    const srcMatch =
      fullIframeTag.match(/\ssrc="([^"]+)"/i) || fullIframeTag.match(/\ssrc='([^']+)'/i);
    let src = srcMatch ? srcMatch[1].trim() : "";
    if (!src) return fullIframeTag;

    // Safety: if src was corrupted with an embedded <iframe or quotes, extract the real URL
    const realUrlMatch = src.match(/https?:\/\/[^\s"'>]+/i);
    if (realUrlMatch) {
      src = realUrlMatch[0];
    }

    if (/instagram\.com/i.test(src)) {
      const shortcode = extractInstagramShortcode(src);
      if (shortcode) {
        const isReel = isInstagramReel(src) || /\/reels?\/[A-Za-z0-9_-]+/i.test(src);
        const maxWidth = isReel ? "380px" : "540px";
        const iframeSrc = isReel
          ? `https://www.instagram.com/reel/${shortcode}/embed/?autoplay=1&muted=1`
          : `https://www.instagram.com/p/${shortcode}/embed/captioned/?autoplay=1&muted=1`;
        return `<figure class="instagram-carousel-figure my-8 flex flex-col items-center justify-center w-full mx-auto bg-transparent"><div class="instagram-carousel-wrap instagram-embed-slot w-full ${isReel ? "instagram-reel-wrap max-w-[380px]" : "max-w-[540px]"} mx-auto flex flex-col items-center justify-start bg-white rounded-xl shadow-xs border border-neutral-200" data-instagram-shortcode="${shortcode}" data-instagram-url="${src}" data-instagram-is-reel="${isReel ? "true" : "false"}" style="width:100%;max-width:${maxWidth};min-height:480px;overflow:visible;"><iframe class="instagram-official-iframe w-full block border-0 bg-white" src="${iframeSrc}" style="width:100%;max-width:${maxWidth};min-height:480px;border:0;display:block;overflow:visible;background:#ffffff;" scrolling="no" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share; fullscreen" allowfullscreen allowtransparency="true" loading="lazy" title="Instagram Post"></iframe></div></figure>`;
      }
    }

    if (/facebook\.com/i.test(src)) {
      const isReel = /reel/i.test(src);
      const isVideo = /video/i.test(src);
      if (isVideo && !src.includes("autoplay=")) {
        src += (src.includes("?") ? "&" : "?") + "autoplay=true&mute=1";
      }
      const containerClass = isReel
        ? "aspect-[9/16] w-auto max-w-[calc(80vh*9/16)]"
        : isVideo
          ? "aspect-video max-w-[500px]"
          : "max-w-[480px]";
      const containerStyle = isReel
        ? "max-height:80vh; height:80vh; width:calc(80vh * 9 / 16); max-width:100%;"
        : "max-height:80vh;";
      const cleanIframe = fullIframeTag.replace(/\ssrc="[^"]*"/i, ` src="${src}"`);
      return `<figure class="inline-embed my-6 flex flex-col items-center justify-center w-full max-h-[80vh] mx-auto text-center bg-transparent no-underline"><div class="${containerClass} mx-auto flex flex-col items-center overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm" style="${containerStyle}">${cleanIframe}</div></figure>`;
    }

    if (/spotify\.com/i.test(src) || /soundcloud\.com/i.test(src)) {
      const cleanIframe = fullIframeTag.replace(/\ssrc="[^"]*"/i, ` src="${src}"`);
      return `<figure class="inline-embed my-6 flex flex-col items-center justify-center w-full mx-auto max-w-[540px] max-h-[80vh] text-center bg-transparent no-underline"><div class="w-full max-w-[540px] max-h-[80vh] mx-auto overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm" style="max-height:80vh;">${cleanIframe}</div></figure>`;
    }

    // Auto-play for YouTube and Vimeo video iframes
    if (/youtube\.com|youtube-nocookie\.com|youtu\.be/i.test(src)) {
      if (!src.includes("autoplay=")) {
        src += (src.includes("?") ? "&" : "?") + "autoplay=1&mute=1&playsinline=1&enablejsapi=1";
      }
    } else if (/vimeo\.com/i.test(src)) {
      if (!src.includes("autoplay=")) {
        src += (src.includes("?") ? "&" : "?") + "autoplay=1&muted=1&playsinline=1&autopause=0";
      }
    }

    const isVertical = /\/shorts\//i.test(src) || /tiktok\.com/i.test(src) || /\/reel\//i.test(src);
    if (isVertical) {
      return `<figure class="inline-embed my-6 flex flex-col items-center justify-center w-full max-h-[80vh] mx-auto text-center bg-transparent no-underline"><div class="aspect-[9/16] w-auto mx-auto overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm" style="max-height:80vh; height:80vh; width:calc(80vh * 9 / 16); max-width:100%;"><iframe src="${src}" class="h-full w-full block border-0 bg-white" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen loading="lazy"></iframe></div></figure>`;
    }

    return `<figure class="inline-embed my-6 flex flex-col items-center justify-center w-full max-h-[80vh] mx-auto text-center bg-transparent no-underline"><div class="aspect-video w-full max-w-[540px] max-h-[80vh] mx-auto overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm" style="max-height:80vh;"><iframe src="${src}" class="h-full w-full block border-0 bg-white" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen loading="lazy"></iframe></div></figure>`;
  });

  // Wrap standalone video tags: ensure autoplay, muted, playsinline, loop, controls
  enriched = enriched.replace(
    /(<video\b[^>]*>(?:[\s\S]*?<\/video>|<video\b[^>]*\/>))/gi,
    (_m, videoTag) => {
      let enhancedVideo = videoTag;
      if (!/\bautoplay\b/i.test(enhancedVideo)) enhancedVideo = enhancedVideo.replace(/<video\b/i, '<video autoplay');
      if (!/\bmuted\b/i.test(enhancedVideo)) enhancedVideo = enhancedVideo.replace(/<video\b/i, '<video muted');
      if (!/\bplaysinline\b/i.test(enhancedVideo)) enhancedVideo = enhancedVideo.replace(/<video\b/i, '<video playsinline');
      if (!/\bloop\b/i.test(enhancedVideo)) enhancedVideo = enhancedVideo.replace(/<video\b/i, '<video loop');
      if (!/\bcontrols\b/i.test(enhancedVideo)) enhancedVideo = enhancedVideo.replace(/<video\b/i, '<video controls');

      if (!/class="/i.test(enhancedVideo)) {
        enhancedVideo = enhancedVideo.replace(/<video\b/i, '<video class="social-media-item w-auto h-auto max-h-[80vh] max-w-full object-contain rounded-xl mx-auto block"');
      } else {
        enhancedVideo = enhancedVideo.replace(/class="([^"]*)"/i, (_cls: string, c: string) => `class="${c} social-media-item object-contain w-auto h-auto max-h-[80vh] max-w-full block mx-auto"`);
      }
      return `<figure class="inline-embed my-6 flex flex-col items-center justify-center w-full max-h-[80vh] mx-auto text-center bg-transparent no-underline"><div class="social-embed-media-wrapper w-fit max-w-full max-h-[80vh] mx-auto overflow-hidden rounded-xl border border-gray-200 bg-transparent shadow-sm" style="max-height:80vh; width:fit-content; max-width:100%;">${enhancedVideo}</div></figure>`;
    },
  );

  // 3. Ensure any existing or pre-rendered Instagram embed wrapper divs and iframes are clean (no 95vh clamp, scrolling="no")
  enriched = enriched.replace(
    /(<div\b[^>]*class="[^"]*(?:instagram-carousel-wrap|instagram-embed-frame-wrap|instagram-embed-slot)[^"]*"[^>]*>)\s*(<iframe\b[\s\S]*?<\/iframe>)\s*(<\/div>)/gi,
    (_full, divOpen, iframeContent, divClose) => {
      const isReel =
        divOpen.includes('data-instagram-is-reel="true"') ||
        /\/reels?\//i.test(divOpen) ||
        /\/reels?\//i.test(iframeContent);
      const maxWidth = isReel ? "380px" : "540px";
      let updatedDiv = divOpen.replace(/\bh-\[95vh\]/g, "");
      if (/style="[^"]*"/i.test(updatedDiv)) {
        updatedDiv = updatedDiv.replace(/style="[^"]*"/i, `style="width:100%;max-width:${maxWidth};min-height:480px;overflow:visible;"`);
      } else {
        updatedDiv = updatedDiv.replace(/<div\b/i, `<div style="width:100%;max-width:${maxWidth};min-height:480px;overflow:visible;"`);
      }
      if (isReel && !/instagram-reel-wrap/i.test(updatedDiv)) {
        updatedDiv = updatedDiv.replace(/class="([^"]*)"/i, 'class="$1 instagram-reel-wrap max-w-[380px]"');
      }
      let updatedIframe = iframeContent;
      if (/style="[^"]*"/i.test(updatedIframe)) {
        updatedIframe = updatedIframe.replace(/style="[^"]*"/i, `style="width:100%;max-width:${maxWidth};min-height:480px;border:0;display:block;overflow:visible;background:#ffffff;"`);
      }
      updatedIframe = updatedIframe.replace(/scrolling="auto"/gi, 'scrolling="no"');
      if (!/scrolling="/i.test(updatedIframe)) {
        updatedIframe = updatedIframe.replace(/<iframe\b/i, '<iframe scrolling="no"');
      }
      return `${updatedDiv}${updatedIframe}${divClose}`;
    },
  );

  // Wrap known inline social embed blockquotes in responsive, correctly sized centered figures (Twitter, Facebook)
  const embedBQRe =
    /<figure[^>]*>\s*(<blockquote\b[^>]*class="[^"]*(?:twitter-tweet|fb-post|fb-video)[^"]*"[^>]*>[\s\S]*?<\/blockquote>)\s*<\/figure>/gi;
  const standaloneBQRe =
    /(<blockquote\b[^>]*class="[^"]*(?:twitter-tweet|fb-post|fb-video)[^"]*"[^>]*>[\s\S]*?<\/blockquote>)(?!\s*<\/figure>)/gi;
  const wrapEmbed = (bq: string) => {
    let cleanBq = bq;
    const isTwitter = /twitter-tweet/.test(cleanBq);
    if (isTwitter && !/data-align=/.test(cleanBq)) {
      cleanBq = cleanBq.replace(/<blockquote\b/i, '<blockquote data-align="center"');
    }
    if (/fb-post|fb-video/.test(cleanBq)) {
      cleanBq = cleanBq.replace(/data-width="[0-9]+"/i, 'data-width="auto"');
    }
    const maxW = isTwitter ? "max-w-[460px]" : "max-w-[460px]";
    return `<figure class="inline-embed my-6 flex flex-col items-center justify-center w-full ${maxW} mx-auto text-center bg-white">${cleanBq}</figure>`;
  };
  enriched = enriched.replace(embedBQRe, (_m: string, bq: string) => wrapEmbed(bq));
  enriched = enriched.replace(standaloneBQRe, (_m: string, bq: string) => wrapEmbed(bq));

  // Normalize inline body images: constrain height strictly to 80vh, centered, object-contain
  enriched = enriched.replace(
    /<img\b([^>]*?)(\/?>)/gi,
    (_full, attrs, closing) => {
      if (/avatar|icon|emoji/i.test(attrs)) return _full;
      let cleanAttrs = attrs;
      if (/class="/i.test(cleanAttrs)) {
        cleanAttrs = cleanAttrs.replace(
          /class="([^"]*)"/i,
          (_clsMatch: string, currClass: string) => {
            const stripped = currClass
              .split(/\s+/)
              .filter((c: string) => !/^(w-full|max-w-full|max-h-|h-)/.test(c))
              .join(" ");
            return `class="${stripped ? stripped + " " : ""}max-h-[80vh] w-auto max-w-full rounded border border-gray-200 bg-white object-contain mx-auto block"`;
          },
        );
      } else {
        cleanAttrs = ` class="max-h-[80vh] w-auto max-w-full rounded border border-gray-200 bg-white object-contain mx-auto block"${cleanAttrs}`;
      }
      if (!/loading=/i.test(cleanAttrs)) {
        cleanAttrs += ' loading="lazy"';
      }
      return `<img${cleanAttrs}${closing}`;
    },
  );

  // Ensure inline images outside figures look good and are centered inside figures too
  enriched = enriched.replace(
    /(<img\b[^>]*>)(?!\s*<\/figcaption>|<\/a><\/figure>|<\/source>|<\/video>)/gi,
    (_m, img) => {
      if (/<figure[\s\S]*$/i.test(img)) return img;
      return `<figure class="my-6 flex flex-col items-center justify-center bg-transparent w-full">${img}</figure>`;
    },
  );

  // Strip all figcaptions — we never want filename captions on inline body media
  enriched = enriched.replace(/<figcaption\b[^>]*>[\s\S]*?<\/figcaption>/gi, "");

  return enriched;
}

function sanitizeRichText(html: string) {
  let safe = html;

  // Layer 0: strip HTML comments entirely
  safe = safe.replace(/<!--[\s\S]*?-->/g, "");

  // Layer 0b: eliminate entity-escaped dangerous tags that would render
  // as raw visible text after dangerouslySetInnerHTML
  safe = safe.replace(/&lt;script[\s\S]*?&gt;[\s\S]*?&lt;\/script&gt;/gi, "");
  safe = safe.replace(/&lt;style[\s\S]*?&gt;[\s\S]*?&lt;\/style&gt;/gi, "");
  safe = safe.replace(/&lt;noscript[\s\S]*?&gt;[\s\S]*?&lt;\/noscript&gt;/gi, "");
  safe = safe.replace(/&lt;template[\s\S]*?&gt;[\s\S]*?&lt;\/template&gt;/gi, "");
  safe = safe.replace(/&lt;svg[\s\S]*?&gt;[\s\S]*?&lt;\/svg&gt;/gi, "");

  // Layer 1: remove entire blocks (tag + content) that must never exist inside article HTML
  safe = safe.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "");
  safe = safe.replace(/<noscript[\s\S]*?>[\s\S]*?<\/noscript>/gi, "");
  safe = safe.replace(/<template[\s\S]*?>[\s\S]*?<\/template>/gi, "");
  safe = safe.replace(/<svg[\s\S]*?>[\s\S]*?<\/svg>/gi, "");
  safe = safe.replace(/<object[\s\S]*?>[\s\S]*?<\/object>/gi, "");
  safe = safe.replace(/<embed[\s\S]*?\/?>/gi, "");
  safe = safe.replace(/<applet[\s\S]*?>[\s\S]*?<\/applet>/gi, "");
  safe = safe.replace(/<form[\s\S]*?>[\s\S]*?<\/form>/gi, "");
  safe = safe.replace(/<input[\s\S]*?\/?>/gi, "");
  safe = safe.replace(/<button[\s\S]*?>[\s\S]*?<\/button>/gi, "");
  safe = safe.replace(/<textarea[\s\S]*?>[\s\S]*?<\/textarea>/gi, "");
  safe = safe.replace(/<select[\s\S]*?>[\s\S]*?<\/select>/gi, "");

  // Layer 2: classic script + event-handler sanitization
  safe = safe.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
  safe = safe.replace(/\son\w+(\s)*=(\s)*"[^"]*"/gi, "");
  safe = safe.replace(/\son\w+(\s)*=(\s)*'[^']*'/gi, "");
  // Also catch unquoted event-handler assignments (onerror=alert(1))
  safe = safe.replace(/\son\w+(\s)*=(\s)*[^\s>]+/gi, "");
  safe = safe.replace(/javascript:/gi, "");
  safe = safe.replace(/vbscript:/gi, "");
  safe = safe.replace(/data:text\/html/gi, "");

  const allowedTags =
    /<\/?(div|p|span|br|strong|b|em|i|u|h2|h3|h4|ul|ol|li|blockquote|a|figure|figcaption|img|iframe|video|source|section)\b[^>]*>/gi;
  const isSelfClosing = (raw: string) => /\/\s*>$/.test(raw);

  return safe.replace(/<\/?[^>]+>/gi, (tag) => {
    const ok = tag.match(allowedTags);
    if (!ok) return "";
    // Closing tags pass through untouched
    if (/^<\//.test(tag)) return tag;

    // Blockquote: keep class, lang, dir, cite, data-*
    if (/^<blockquote\b/i.test(tag)) {
      const attrs: string[] = [];
      const clazz = (tag.match(/\sclass="([^"]*)"/i) || [])[1];
      if (clazz && /^[a-zA-Z0-9_\s\-:\[\]\/%.#]+$/.test(clazz)) attrs.push(`class="${clazz}"`);
      const cite = (tag.match(/\scite="([^"]*)"/i) || tag.match(/\scite='([^']*)'/i) || [])[1];
      if (cite) {
        try {
          const u = new URL(cite);
          if (u.protocol === "http:" || u.protocol === "https:") {
            const escapedCite = u.toString().replace(/"/g, "&quot;");
            attrs.push(`cite="${escapedCite}"`);
          }
        } catch {
          /* ignore */
        }
      }
      const lang = (tag.match(/\slang="([^"]*)"/i) || [])[1];
      if (lang && /^[a-zA-Z0-9_-]+$/.test(lang)) attrs.push(`lang="${lang}"`);
      const dir = (tag.match(/\sdir="([^"]*)"/i) || [])[1];
      if (dir === "ltr" || dir === "rtl" || dir === "auto") attrs.push(`dir="${dir}"`);
      const style = (tag.match(/\sstyle="([^"]*)"/i) || tag.match(/\sstyle='([^']*)'/i) || [])[1];
      if (style && style.length <= 300 && /^[\w\s:;,%#()\.\!\-]+$/.test(style)) {
        const escapedStyle = style.replace(/"/g, "&quot;");
        attrs.push(`style="${escapedStyle}"`);
      }
      const dataRe = /\sdata-([a-zA-Z0-9_-]+)="([^"]*)"/g;
      let dm: RegExpExecArray | null;
      while ((dm = dataRe.exec(tag))) {
        const key = `data-${dm[1].toLowerCase()}`;
        if (attrs.some((a) => a.startsWith(`${key}="`))) continue;
        const val = String(dm[2])
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;");
        attrs.push(`${key}="${val}"`);
      }
      const close = isSelfClosing(tag) ? " />" : ">";
      return `<blockquote${attrs.length ? " " + attrs.join(" ") : ""}${close}`;
    }

    // Figure: keep class, style + data-*
    if (/^<figure\b/i.test(tag)) {
      const attrs: string[] = [];
      const clazz = (tag.match(/\sclass="([^"]*)"/i) || [])[1];
      if (clazz && /^[a-zA-Z0-9_\s\-:\[\]\/%.#]+$/.test(clazz)) attrs.push(`class="${clazz}"`);
      const style = (tag.match(/\sstyle="([^"]*)"/i) || tag.match(/\sstyle='([^']*)'/i) || [])[1];
      if (style && style.length <= 300 && /^[\w\s:;,%#()\.\!\-]+$/.test(style)) {
        const escapedStyle = style.replace(/"/g, "&quot;");
        attrs.push(`style="${escapedStyle}"`);
      }
      const dataRe = /\sdata-([a-zA-Z0-9_-]+)="([^"]*)"/g;
      let dm: RegExpExecArray | null;
      while ((dm = dataRe.exec(tag))) {
        const key = `data-${dm[1].toLowerCase()}`;
        if (attrs.some((a) => a.startsWith(`${key}="`))) continue;
        const val = String(dm[2])
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;");
        attrs.push(`${key}="${val}"`);
      }
      const close = isSelfClosing(tag) ? " />" : ">";
      return `<figure${attrs.length ? " " + attrs.join(" ") : ""}${close}`;
    }

    // Media + anchor tags: keep existing, strip dangerous attrs already handled in layers above
    if (/^<(?:img|iframe|video|source|a)\b/i.test(tag)) {
      // Basic attribute safety pass: keep attributes but strip any leftover event handlers
      let clean = tag;
      clean = clean.replace(/\son\w+(\s)*=(\s)*"[^"]*"/gi, "");
      clean = clean.replace(/\son\w+(\s)*=(\s)*'[^']*'/gi, "");
      clean = clean.replace(/\son\w+(\s)*=(\s)*[^\s>]+/gi, "");
      clean = clean.replace(/javascript:/gi, "");
      // Ensure it ends with closing >
      if (!/>$/.test(clean)) clean = clean.replace(/\s*$/, ">");
      return clean;
    }

    // Structural tags: keep only valid class + proper close bracket
    if (/^<(figcaption|div|p|span|ul|ol|li|section|br|strong|b|em|i|u|h2|h3|h4)\b/i.test(tag)) {
      const m = tag.match(
        /^<(figcaption|div|p|span|ul|ol|li|section|br|strong|b|em|i|u|h2|h3|h4)\b/i,
      );
      if (!m) return tag;
      const tagName = m[1].toLowerCase();
      const clazz = (tag.match(/\sclass="([^"]*)"/i) || [])[1];
      const style = (tag.match(/\sstyle="([^"]*)"/i) || tag.match(/\sstyle='([^']*)'/i) || [])[1];
      const close = isSelfClosing(tag) ? " />" : ">";
      const attrs: string[] = [];
      if (clazz && /^[a-zA-Z0-9_\s\-:\[\]\/%.#]+$/.test(clazz)) {
        attrs.push(`class="${clazz}"`);
      }
      if (style && style.length <= 300 && /^[\w\s:;,%#()\.\!\-]+$/.test(style)) {
        const escapedStyle = style.replace(/"/g, "&quot;");
        attrs.push(`style="${escapedStyle}"`);
      }
      return `<${tagName}${attrs.length ? " " + attrs.join(" ") : ""}${close}`;
    }

    return tag;
  });

  // Layer 3 (post-sanitization): collapse RAW-PASTED social widget blockquotes
  // that contain their full loading skeleton (many divs/svg/placeholders) into
  // a single clean minimal blockquote.
  // This guarantees pasting Instagram/X/TikTok/FB full embed HTML into the
  // article body will never expose the skeleton as visible garbage.
  const normalized = normalizeSocialEmbedBlockquotes(safe);
  return normalized;
}

// Collapse any "instagram-media" / "twitter-tweet" / fb-post / tiktok-embed
// blockquote with a messy internal skeleton into a clean minimal blockquote.
// Uses a lightweight DOM-ish walk via a scratch element so we don't depend on
// DOMParser being available (SSR safe).
function normalizeSocialEmbedBlockquotes(html: string): string {
  if (!html) return html;
  if (typeof document === "undefined") return html;

  try {
    const scratch = document.createElement("div");
    scratch.innerHTML = html;

    const classes = ["twitter-tweet", "instagram-media", "fb-post", "tiktok-embed"];
    const blockquotes = Array.from(
      scratch.querySelectorAll<HTMLElement>(classes.map((c) => `blockquote.${c}`).join(",")),
    );

    for (const bq of blockquotes) {
      // Extract permalink (data-* attribute, cite, or first contained anchor)
      let permalink =
        bq.getAttribute("data-instgrm-permalink") ||
        bq.getAttribute("data-embed-permalink") ||
        bq.getAttribute("cite") ||
        "";
      if (!permalink) {
        const firstA = bq.querySelector<HTMLAnchorElement>("a[href]");
        permalink = firstA?.href || "";
      }
      // Normalize: remove leading/trailing backticks (common when copying embed snippets)
      permalink = permalink.replace(/^`|`$/g, "").trim();

      // Sanitize permalink before writing back
      let safeLink = permalink;
      try {
        const u = new URL(permalink);
        if (u.protocol !== "http:" && u.protocol !== "https:") safeLink = "";
      } catch {
        safeLink = "";
      }

      // Drop every child div/span/svg/p/etc. (the skeleton + caption fallback paragraphs
      // that were part of the widget's placeholder HTML). We keep ONLY a single
      // clean <a href="permalink"> fallback link, matching what insertPostEmbed()
      // produces in the admin editor.
      while (bq.firstChild) bq.firstChild.remove();

      const label = (() => {
        const cls = bq.getAttribute("class") || "";
        if (cls.includes("instagram-media")) return "View this post on Instagram";
        if (cls.includes("twitter-tweet")) return "View this post on X / Twitter";
        if (cls.includes("fb-post")) return "View this post on Facebook";
        if (cls.includes("tiktok-embed")) return "View this post on TikTok";
        return "View this post";
      })();

      if (safeLink) {
        const a = document.createElement("a");
        a.href = safeLink;
        a.target = "_blank";
        a.rel = "noreferrer";
        a.textContent = label;
        bq.appendChild(a);
      }

      // Ensure data-instgrm-permalink / cite attributes are clean (no backticks)
      // so the respective widget SDKs still hydrate on the frontend.
      if (bq.classList.contains("instagram-media") && safeLink) {
        const canonical = normalizeInstagramUrl(safeLink);
        bq.setAttribute("data-instgrm-captioned", "");
        bq.setAttribute("data-instgrm-permalink", canonical);
        if (!bq.hasAttribute("data-instgrm-version")) bq.setAttribute("data-instgrm-version", "14");
      }
      if (bq.classList.contains("tiktok-embed") && safeLink) {
        bq.setAttribute("cite", safeLink);
      }
      if (bq.classList.contains("fb-post") && safeLink) {
        bq.setAttribute("data-href", safeLink);
      }
    }

    return scratch.innerHTML;
  } catch {
    return html;
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function InstagramEmbed({ permalink }: { permalink: string }) {
  return <InstagramIframeEmbed url={permalink} />;
}

function EmbeddedPost({ url }: { url: string }) {
  const embed = getEmbedConfig(url);

  useEffect(() => {
    if (!embed || typeof document === "undefined") return;
    let cancelled = false;

    if (embed.type === "twitter") {
      const poll = (attempts = 0) => {
        if (cancelled) return;
        const w = window as any;
        if (w.twttr?.widgets?.load) {
          try {
            w.twttr.widgets.load();
          } catch {}
          return;
        }
        if (attempts < 40) {
          setTimeout(() => poll(attempts + 1), 80);
        }
      };

      if (!document.querySelector('script[src="https://platform.twitter.com/widgets.js"]')) {
        const script = document.createElement("script");
        script.async = true;
        script.defer = true;
        script.src = "https://platform.twitter.com/widgets.js";
        script.onerror = () => {};
        document.body.appendChild(script);
      }
      poll();
      return;
    }

    if (embed.type === "tiktok") {
      const existingScript = document.querySelector(
        'script[src="https://www.tiktok.com/embed.js"]',
      ) as HTMLScriptElement | null;
      if (existingScript) return;

      const script = document.createElement("script");
      script.async = true;
      script.defer = true;
      script.src = "https://www.tiktok.com/embed.js";
      script.onerror = () => {};
      document.body.appendChild(script);
    }

    return () => {
      cancelled = true;
    };
  }, [embed]);

  if (!embed) {
    return (
      <div className="mb-8 border border-gray-200 bg-white p-4 max-h-[80vh] overflow-hidden no-underline" style={{ maxHeight: "80vh" }}>
        <div className="display mb-2 text-lg font-black uppercase no-underline">Related Post</div>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="break-all text-sm font-bold text-black no-underline hover:text-neutral-700"
        >
          {url}
        </a>
      </div>
    );
  }

  if (embed.type === "direct_video") {
    return (
      <section className="mb-8 w-full flex flex-col items-center justify-center no-underline">
        <div className="w-fit max-w-full mx-auto flex justify-center items-center overflow-hidden rounded-xl bg-transparent">
          <video
            src={embed.src}
            autoPlay
            muted
            loop
            playsInline
            controls
            preload="auto"
            className="block mx-auto rounded-xl shadow-md w-auto max-w-full max-h-[80vh] object-contain bg-transparent"
          />
        </div>
      </section>
    );
  }

  if (embed.type === "instagram") {
    return <InstagramEmbed permalink={embed.permalink} />;
  }

  if (embed.type === "twitter") {
    return (
      <section className="mb-8 w-full flex flex-col items-center justify-center no-underline">
        <div
          className="w-full max-w-[480px] mx-auto flex flex-col items-center justify-start bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden no-underline"
          style={{
            maxHeight: "80vh",
            minHeight: "320px",
          }}
        >
          <div
            className="w-full h-full overflow-y-auto overflow-x-hidden flex flex-col items-center justify-start p-2 bg-white no-underline"
            style={{
              maxHeight: "80vh",
              scrollbarWidth: "thin",
            }}
          >
            <blockquote
              className="twitter-tweet mx-auto no-underline"
              data-align="center"
              data-conversation="none"
              data-dnt="true"
            >
              <a href={embed.permalink} target="_blank" rel="noreferrer" className="no-underline">
                {embed.permalink}
              </a>
            </blockquote>
          </div>
        </div>
      </section>
    );
  }

  if (embed.type === "youtube") {
    const isShorts =
      (embed as any).isShorts ||
      embed.src.includes("/shorts/") ||
      url.includes("/shorts/");
    const ytAutoplaySrc = embed.src.includes("autoplay=")
      ? embed.src
      : `${embed.src}${embed.src.includes("?") ? "&" : "?"}autoplay=1&mute=1&playsinline=1&enablejsapi=1`;
    return (
      <section className="mb-8 w-full flex flex-col items-center justify-center no-underline">
        <div
          className={`mx-auto flex flex-col items-center justify-center bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden no-underline ${
            isShorts ? "aspect-[9/16] w-auto" : "w-full max-w-[540px] aspect-video"
          }`}
          style={{
            maxHeight: "80vh",
            height: isShorts ? "80vh" : "auto",
            width: isShorts ? "calc(80vh * 9 / 16)" : "100%",
            maxWidth: isShorts ? "calc(80vh * 9 / 16)" : "540px",
          }}
        >
          <iframe
            src={ytAutoplaySrc}
            title="Embedded YouTube video"
            className="h-full w-full block border-0 bg-white"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      </section>
    );
  }

  if (embed.type === "facebook") {
    const rawHref = (embed as any).href || url;
    const isVideo =
      rawHref.includes("/videos/") ||
      rawHref.includes("/watch") ||
      rawHref.includes("fb.watch") ||
      rawHref.includes("/reel/");
    const isReel = rawHref.includes("/reel/") || rawHref.includes("/reels/");
    const fbHref = encodeURIComponent(rawHref);
    const iframeSrc = isVideo
      ? `https://www.facebook.com/plugins/video.php?href=${fbHref}&show_text=false&width=auto&autoplay=true&mute=1`
      : `https://www.facebook.com/plugins/post.php?href=${fbHref}&show_text=true&width=auto`;
    const containerClass = isReel
      ? "aspect-[9/16] w-auto"
      : isVideo
        ? "aspect-video w-full max-w-[500px]"
        : "w-full max-w-[460px]";
    const containerStyle: React.CSSProperties = isReel
      ? {
          maxHeight: "80vh",
          height: "80vh",
          width: "calc(80vh * 9 / 16)",
          maxWidth: "100%",
        }
      : {
          maxHeight: "80vh",
          minHeight: "320px",
        };

    return (
      <section className="mb-8 w-full flex flex-col items-center justify-center no-underline">
        <div
          className={`${containerClass} mx-auto flex flex-col items-center justify-start bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden no-underline`}
          style={containerStyle}
        >
          <div
            className="w-full h-full overflow-y-auto overflow-x-hidden flex flex-col items-center justify-start bg-white p-2 no-underline"
            style={{
              maxHeight: "80vh",
              scrollbarWidth: "thin",
            }}
          >
            <iframe
              src={iframeSrc}
              width="100%"
              style={{
                border: "none",
                overflow: "hidden",
                width: "100%",
                height: "100%",
                minHeight: isReel ? "100%" : isVideo ? "300px" : "420px",
                maxHeight: "80vh",
                background: "#ffffff",
                backgroundColor: "#ffffff",
              }}
              scrolling="no"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              allowFullScreen
              title="Facebook content"
              className="w-full h-full mx-auto block bg-white"
            />
            {!isReel && (
              <div className="p-2 text-center w-full bg-white no-underline">
                <a
                  href={rawHref}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold no-underline text-black hover:text-neutral-700 break-all"
                >
                  View on Facebook
                </a>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  if (embed.type === "tiktok") {
    const videoId = embed.videoId;
    return (
      <section className="mb-8 w-full flex flex-col items-center justify-center no-underline">
        <div
          className="mx-auto flex flex-col items-center justify-start bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden no-underline w-fit"
          style={{
            maxHeight: "80vh",
            height: "80vh",
            width: "calc(80vh * 9 / 16)",
            maxWidth: "360px",
          }}
        >
          <div
            className="w-full h-full overflow-y-auto overflow-x-hidden flex flex-col items-center justify-start p-1 bg-white no-underline"
            style={{
              maxHeight: "80vh",
              scrollbarWidth: "thin",
            }}
          >
            {videoId ? (
              <iframe
                src={`https://www.tiktok.com/embed/v2/${videoId}`}
                title="TikTok video"
                className="w-full h-full block border-0 bg-white"
                style={{ height: "100%", minHeight: "360px", width: "100%", border: 0 }}
                scrolling="no"
                frameBorder="0"
                allowTransparency
              />
            ) : (
              <blockquote
                className="tiktok-embed mx-auto no-underline"
                cite={embed.permalink}
                style={{ maxWidth: "325px", minWidth: "260px", margin: "0 auto", background: "#ffffff" }}
              >
                <section>
                  <a href={embed.permalink} target="_blank" rel="noreferrer" className="no-underline hover:text-neutral-700">
                    {embed.permalink}
                  </a>
                </section>
              </blockquote>
            )}
          </div>
        </div>
      </section>
    );
  }

  if (embed.type === "vimeo") {
    return (
      <section className="mb-8 w-full flex flex-col items-center justify-center no-underline">
        <div className="aspect-video w-full max-w-[540px] max-h-[80vh] mx-auto overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm" style={{ maxHeight: "80vh" }}>
          <iframe
            src={`https://player.vimeo.com/video/${embed.id}?autoplay=1&muted=1&playsinline=1&autopause=0`}
            title="Vimeo video"
            className="h-full w-full block border-0 bg-white"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        </div>
      </section>
    );
  }

  if (embed.type === "threads") {
    return (
      <section className="mb-8 w-full flex flex-col items-center justify-center no-underline">
        <div className="w-full max-w-[500px] max-h-[80vh] mx-auto overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm p-4 text-left no-underline" style={{ maxHeight: "80vh" }}>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 no-underline">Threads Post</div>
          <a
            href={embed.permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-black no-underline hover:text-neutral-700 block break-all"
          >
            View this post on Threads
          </a>
        </div>
      </section>
    );
  }

  if (embed.type === "spotify") {
    const isCompact = embed.embedType === "track" || embed.embedType === "episode";
    const height = isCompact ? "152" : "352";
    return (
      <section className="mb-8 w-full flex flex-col items-center justify-center no-underline">
        <div className="w-full max-w-[540px] max-h-[80vh] mx-auto overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm" style={{ maxHeight: "80vh" }}>
          <iframe
            src={`https://open.spotify.com/embed/${embed.embedType}/${embed.id}`}
            width="100%"
            height={height}
            frameBorder="0"
            allowFullScreen
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="w-full block"
          />
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8 w-full flex flex-col items-center justify-center no-underline">
      <div className="w-full max-w-[460px] max-h-[80vh] mx-auto border border-gray-200 rounded-xl bg-white p-4 shadow-xs no-underline" style={{ maxHeight: "80vh" }}>
        <div className="display mb-2 text-lg font-black uppercase no-underline">Embedded Post</div>
        <a
          href={(embed as any)?.href ?? url}
          target="_blank"
          rel="noreferrer"
          className="break-all text-sm font-bold text-black no-underline hover:text-neutral-700"
        >
          {(embed as any)?.href ?? url}
        </a>
      </div>
    </section>
  );
}

function getEmbedConfig(url: string) {
  try {
    let cleanUrl = (url || "").trim();
    if (!cleanUrl) return null;

    if (
      cleanUrl.includes("<blockquote") ||
      cleanUrl.includes("<iframe") ||
      cleanUrl.includes("data-instgrm-permalink")
    ) {
      const match =
        cleanUrl.match(/data-instgrm-permalink="([^"]+)"/i) ||
        cleanUrl.match(/data-embed-permalink="([^"]+)"/i) ||
        cleanUrl.match(/cite="([^"]+)"/i) ||
        cleanUrl.match(/src="([^"]+)"/i) ||
        cleanUrl.match(/href="([^"]+)"/i);
      if (match) {
        cleanUrl = match[1].replace(/^`|`$/g, "").replace(/&amp;/g, "&").trim();
      }
    }

    const parsed = new URL(cleanUrl);
    const host = parsed.hostname.replace(/^www\./, "");

    const isDirectVideo =
      /\.(mp4|webm|mov|ogg)($|\?)/i.test(parsed.pathname) ||
      parsed.pathname.includes("/api/uploads/");
    if (isDirectVideo) {
      return {
        type: "direct_video" as const,
        src: parsed.toString(),
      };
    }

    if (
      host === "twitter.com" ||
      host === "x.com" ||
      host === "mobile.twitter.com" ||
      host === "m.x.com"
    ) {
      const cleanPath = parsed.pathname.replace(/\/+$/, "") || "/";
      return {
        type: "twitter" as const,
        permalink: `https://x.com${cleanPath}`,
      };
    }

    if (host === "instagram.com" || host === "m.instagram.com" || host === "instagr.am") {
      const pathOnly = parsed.pathname.replace(/\/+$/, "") + "/";
      const reelMatch = pathOnly.match(/^\/reels?\/([A-Za-z0-9_-]+)/i);
      const shortcode = reelMatch ? reelMatch[1] : null;
      const canonicalPath = shortcode ? `/p/${shortcode}/` : pathOnly;
      if (
        pathOnly.startsWith("/p/") ||
        pathOnly.startsWith("/reel/") ||
        pathOnly.startsWith("/reels/") ||
        pathOnly.startsWith("/tv/") ||
        pathOnly.startsWith("/stories/")
      ) {
        return {
          type: "instagram" as const,
          permalink: `https://www.instagram.com${canonicalPath}`,
        };
      }
      return {
        type: "link" as const,
        href: parsed.toString(),
      };
    }

    if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "youtu.be" ||
      host === "youtube-nocookie.com" ||
      host === "music.youtube.com"
    ) {
      const videoId = getYouTubeVideoId(parsed);
      const isShorts =
        parsed.pathname.startsWith("/shorts/") ||
        parsed.pathname.includes("/shorts/") ||
        url.includes("/shorts/");
      if (videoId) {
        return {
          type: "youtube" as const,
          src: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&autoplay=1&mute=1&playsinline=1&enablejsapi=1`,
          isShorts,
        };
      }
    }

    if (host === "tiktok.com" || host.endsWith(".tiktok.com")) {
      const directId = getTikTokVideoId(parsed.pathname);
      if (directId) {
        return {
          type: "tiktok" as const,
          permalink: `https://www.tiktok.com${parsed.pathname.replace(/\/+$/, "")}`,
          videoId: directId,
        };
      }
      const shortMatch = parsed.pathname.match(/^\/v\/(\d+)/);
      if (shortMatch) {
        return {
          type: "tiktok" as const,
          permalink: `https://www.tiktok.com/v/${shortMatch[1]}`,
          videoId: shortMatch[1],
        };
      }
      return {
        type: "link" as const,
        href: parsed.toString(),
      };
    }

    if (
      host === "facebook.com" ||
      host.endsWith(".facebook.com") ||
      host === "fb.watch" ||
      host === "fb.com"
    ) {
      return {
        type: "facebook" as const,
        href: parsed.toString(),
      };
    }

    if (host === "threads.net" || host.endsWith(".threads.net")) {
      return {
        type: "threads" as const,
        permalink: parsed.toString(),
      };
    }

    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const id = parsed.pathname.split("/").filter(Boolean).pop();
      if (id && /^\d+$/.test(id)) {
        return {
          type: "vimeo" as const,
          id,
        };
      }
    }

    if (host === "open.spotify.com" || host === "spotify.com") {
      const parts = parsed.pathname.split("/").filter(Boolean);
      const type = parts[0];
      const id = parts[1];
      if (type && id) {
        return {
          type: "spotify" as const,
          embedType: type,
          id,
        };
      }
    }

    return {
      type: "link" as const,
      href: parsed.toString(),
    };
  } catch {
    return null;
  }
}

function getYouTubeVideoId(parsed: URL) {
  const host = parsed.hostname.replace(/^www\./, "");

  if (host === "youtu.be") {
    const id = parsed.pathname.split("/").filter(Boolean)[0];
    return id || null;
  }

  if (host === "youtube.com" || host === "m.youtube.com") {
    if (parsed.pathname === "/watch") {
      return parsed.searchParams.get("v");
    }

    if (parsed.pathname.startsWith("/shorts/") || parsed.pathname.startsWith("/embed/")) {
      return parsed.pathname.split("/").filter(Boolean)[1] || null;
    }
  }

  return null;
}

function getTikTokVideoId(pathname: string) {
  const direct = pathname.match(/\/video\/(\d+)/);
  if (direct?.[1]) return direct[1];
  const short = pathname.match(/\/v\/(\d+)/);
  return short?.[1] ?? null;
}

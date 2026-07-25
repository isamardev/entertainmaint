import { useEffect } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { articleService } from "@/services/articleService";
import { ArticleCard } from "@/components/site/ArticleCard";
import { ShareButtons } from "@/components/site/ShareButtons";
import { TrendingSidebar } from "@/components/site/Sidebar";
import { fullDate } from "@/lib/format";

export const Route = createFileRoute("/article/$slug")({
  loader: async ({ params }) => {
    const article = await articleService.getBySlug(params.slug);
    if (!article || article.status !== "published") throw notFound();
    return { article };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData)
      return { meta: [{ title: "Article — Entertainment Trends" }, { name: "robots", content: "noindex" }] };
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
        ...(img ? [{ property: "og:image", content: img }, { name: "twitter:image", content: img }] : []),
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
  errorComponent: ({ error }) => <div className="p-8 text-center">{error.message}</div>,
  notFoundComponent: () => (
    <div className="p-8 text-center">
      <div className="display mb-4 text-xl font-black">Article not found</div>
      <Link to="/" className="mt-4 inline-block yellow-bar px-4 py-2 font-bold uppercase tracking-widest">
        Back home
      </Link>
    </div>
  ),
  component: ArticlePage,
});

function ArticlePage() {
  const { article } = Route.useLoaderData();
  const { data: related = [] } = useQuery({
    queryKey: ["related", article.id],
    queryFn: () => articleService.related(article),
  });
  const { data: trending = [] } = useQuery({
    queryKey: ["trending-article"],
    queryFn: () => articleService.listTrending(9),
    staleTime: 60_000,
  });
  const url = typeof window !== "undefined" ? window.location.href : `/article/${article.slug}`;
  const articleBodyHtml = formatArticleBody(article.body);

  const readNext = trending.slice(0, 3);
  const nineGrid = trending.slice(0, 9);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
        <div className="max-w-4xl">
          <header className="mb-6">
            <h1 className="display text-3xl font-black uppercase leading-[0.95] md:text-5xl lg:text-6xl">
              {article.title}
            </h1>
            {article.dek && <p className="mt-4 text-lg text-muted-foreground md:text-xl">{article.dek}</p>}
            <div className="meta mt-4 flex flex-wrap gap-x-4 gap-y-1">
              <span>By Entertainment Trends Staff</span>
              {article.category?.name && (
                <Link to="/category/$slug" params={{ slug: article.category.slug }}>
                  <div className="eyebrow">{article.category.name}</div>
                </Link>
              )}
              <span>{fullDate(article.published_at)}</span>
            </div>
          </header>

          {article.embed_url && <EmbeddedPost url={article.embed_url} />}

          {article.hero_image_hd && (
            <figure className="mb-8">
              <img src={article.hero_image_hd} alt={article.title} className="w-full" />
              {article.hero_caption && <figcaption className="meta mt-2">{article.hero_caption}</figcaption>}
            </figure>
          )}

          <div
            className="prose prose-lg max-w-none text-lg leading-relaxed prose-headings:font-black prose-headings:uppercase prose-a:text-black prose-strong:text-black"
            dangerouslySetInnerHTML={{ __html: articleBodyHtml }}
          />

          <div className="my-10 border-y border-border py-4">
            <ShareButtons url={url} title={article.title} />
          </div>

          {nineGrid.length > 0 && (
            <section className="mt-16">
              <div className="mb-6 border-b-2 border-black pb-2">
                <h2 className="display text-2xl font-black uppercase">More Stories</h2>
              </div>
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {nineGrid.map((a: any) => (
                  <ArticleCard key={a.id} article={a} />
                ))}
              </div>
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
          <div className="sticky top-24">
            <TrendingSidebar />
          </div>
        </div>
      </div>
    </div>
  );
}

function formatArticleBody(body: string) {
  const trimmed = (body || "").trim();
  if (!trimmed) return "<p></p>";

  if (/<[a-z][\s\S]*>/i.test(trimmed)) {
    return sanitizeRichText(trimmed);
  }

  return trimmed
    .split(/\n\n+/)
    .map((para) => `<p>${escapeHtml(para).replace(/\n/g, "<br />")}</p>`)
    .join("");
}

function sanitizeRichText(html: string) {
  let safe = html;

  safe = safe.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
  safe = safe.replace(/\son\w+="[^"]*"/gi, "");
  safe = safe.replace(/\son\w+='[^']*'/gi, "");
  safe = safe.replace(/javascript:/gi, "");

  const allowedTags =
    /<\/?(div|p|span|br|strong|b|em|i|u|h2|h3|ul|ol|li|blockquote|a)\b[^>]*>/gi;

  return safe.replace(/<\/?[^>]+>/gi, (tag) => (tag.match(allowedTags) ? tag : ""));
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function EmbeddedPost({ url }: { url: string }) {
  const embed = getEmbedConfig(url);

  useEffect(() => {
    if (!embed || typeof document === "undefined") return;

    if (embed.type === "instagram") {
      const existingScript = document.querySelector('script[src="//www.instagram.com/embed.js"], script[src="https://www.instagram.com/embed.js"]') as HTMLScriptElement | null;
      if (existingScript && (window as any).instgrm?.Embeds?.process) {
        (window as any).instgrm.Embeds.process();
        return;
      }

      const script = existingScript ?? document.createElement("script");
      script.async = true;
      script.src = "https://www.instagram.com/embed.js";
      script.onload = () => (window as any).instgrm?.Embeds?.process?.();
      if (!existingScript) document.body.appendChild(script);
      return;
    }

    if (embed.type === "twitter") {
      const existingScript = document.querySelector('script[src="https://platform.twitter.com/widgets.js"]') as HTMLScriptElement | null;
      if (existingScript && (window as any).twttr?.widgets?.load) {
        (window as any).twttr.widgets.load();
        return;
      }

      const script = existingScript ?? document.createElement("script");
      script.async = true;
      script.src = "https://platform.twitter.com/widgets.js";
      script.onload = () => (window as any).twttr?.widgets?.load?.();
      if (!existingScript) document.body.appendChild(script);
      return;
    }

    if (embed.type === "tiktok") {
      const existingScript = document.querySelector('script[src="https://www.tiktok.com/embed.js"]') as HTMLScriptElement | null;
      if (existingScript) return;

      const script = document.createElement("script");
      script.async = true;
      script.src = "https://www.tiktok.com/embed.js";
      document.body.appendChild(script);
    }
  }, [embed]);

  if (!embed) {
    return (
      <div className="mb-8 border border-gray-200 bg-gray-50 p-4">
        <div className="display mb-2 text-lg font-black uppercase">Related Post</div>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="break-all text-sm font-bold text-black underline"
        >
          {url}
        </a>
      </div>
    );
  }

  if (embed.type === "instagram") {
    return (
      <section className="mb-8">
        <div className="overflow-hidden rounded border border-gray-200 bg-white p-3">
          <blockquote
            className="instagram-media mx-auto w-full min-w-0"
            data-instgrm-captioned
            data-instgrm-permalink={embed.permalink}
            data-instgrm-version="14"
          >
            <a href={embed.permalink} target="_blank" rel="noreferrer">
              View this post on Instagram
            </a>
          </blockquote>
        </div>
      </section>
    );
  }

  if (embed.type === "twitter") {
    return (
      <section className="mb-8">
        <div className="overflow-hidden rounded border border-gray-200 bg-white p-3">
          <blockquote className="twitter-tweet mx-auto">
            <a href={embed.permalink} target="_blank" rel="noreferrer">
              {embed.permalink}
            </a>
          </blockquote>
        </div>
      </section>
    );
  }

  if (embed.type === "youtube") {
    return (
      <section className="mb-8">
        <div className="overflow-hidden rounded border border-gray-200 bg-white">
          <div className="aspect-video w-full">
            <iframe
              src={embed.src}
              title="Embedded YouTube video"
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        </div>
      </section>
    );
  }

  if (embed.type === "tiktok") {
    return (
      <section className="mb-8">
        <div className="overflow-hidden rounded border border-gray-200 bg-white p-3">
          <blockquote
            className="tiktok-embed mx-auto"
            cite={embed.permalink}
            data-video-id={embed.videoId}
            style={{ maxWidth: "605px", minWidth: "325px" }}
          >
            <section>
              <a href={embed.permalink} target="_blank" rel="noreferrer">
                {embed.permalink}
              </a>
            </section>
          </blockquote>
        </div>
      </section>
    );
  }

  return (
    <div className="mb-8 border border-gray-200 bg-gray-50 p-4">
      <div className="display mb-2 text-lg font-black uppercase">Embedded Post</div>
      <a
        href={embed.href}
        target="_blank"
        rel="noreferrer"
        className="break-all text-sm font-bold text-black underline"
      >
        {embed.href}
      </a>
    </div>
  );
}

function getEmbedConfig(url: string) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "twitter.com" || host === "x.com") {
      return {
        type: "twitter" as const,
        permalink: `https://x.com${parsed.pathname}`,
      };
    }

    if (host === "instagram.com") {
      const cleanPath = parsed.pathname.endsWith("/") ? parsed.pathname : `${parsed.pathname}/`;
      if (cleanPath.startsWith("/p/") || cleanPath.startsWith("/reel/") || cleanPath.startsWith("/tv/")) {
        return {
          type: "instagram" as const,
          permalink: `https://www.instagram.com${cleanPath}`,
        };
      }
    }

    if (host === "youtube.com" || host === "m.youtube.com" || host === "youtu.be") {
      const videoId = getYouTubeVideoId(parsed);
      if (videoId) {
        return {
          type: "youtube" as const,
          src: `https://www.youtube.com/embed/${videoId}`,
        };
      }
    }

    if (host === "tiktok.com" || host.endsWith(".tiktok.com")) {
      const videoId = getTikTokVideoId(parsed.pathname);
      if (videoId) {
        return {
          type: "tiktok" as const,
          permalink: `https://www.tiktok.com${parsed.pathname}`,
          videoId,
        };
      }
      return {
        type: "link" as const,
        href: parsed.toString(),
      };
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
  const match = pathname.match(/\/video\/(\d+)/);
  return match?.[1] ?? null;
}

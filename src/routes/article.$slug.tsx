import { useEffect, useRef } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { articleService } from "@/services/articleService";
import { ArticleCard } from "@/components/site/ArticleCard";
import { ShareButtons } from "@/components/site/ShareButtons";
import { TrendingSidebar } from "@/components/site/Sidebar";
import { shortDate } from "@/lib/format";

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
  const proseRef = useRef<HTMLDivElement | null>(null);
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

  useEffect(() => {
    if (!proseRef.current || typeof document === "undefined") return;
    const root = proseRef.current;
    const hasTwitter = !!root.querySelector("blockquote.twitter-tweet");
    const hasInstagram = !!root.querySelector("blockquote.instagram-media");
    const hasTiktok = !!root.querySelector("blockquote.tiktok-embed");
    const hasFacebook = !!root.querySelector("blockquote.fb-post");

    // Twitter / X
    if (hasTwitter) {
      const load = () => {
        try {
          const w = window as any;
          if (w.twttr?.widgets?.load) w.twttr.widgets.load(root);
        } catch {}
      };
      const existing = document.querySelector(
        'script[src="https://platform.twitter.com/widgets.js"]',
      ) as HTMLScriptElement | null;
      if (existing && (window as any).twttr?.widgets?.load) {
        setTimeout(load, 0);
      } else {
        const s = existing ?? document.createElement("script");
        s.async = true;
        s.defer = true;
        s.src = "https://platform.twitter.com/widgets.js";
        s.onload = () => setTimeout(load, 60);
        s.onerror = () => {};
        if (!existing) document.body.appendChild(s);
      }
    }

    // Instagram
    if (hasInstagram) {
      const process = () => {
        try {
          const w = window as any;
          if (w.instgrm?.Embeds?.process) w.instgrm.Embeds.process();
        } catch {}
      };
      const existing = document.querySelector(
        'script[src="https://www.instagram.com/embed.js"]',
      ) as HTMLScriptElement | null;
      if (existing && (window as any).instgrm?.Embeds?.process) {
        setTimeout(process, 0);
      } else {
        const s = existing ?? document.createElement("script");
        s.async = true;
        s.defer = true;
        s.src = "https://www.instagram.com/embed.js";
        s.onload = () => setTimeout(process, 60);
        s.onerror = () => {};
        if (!existing) document.body.appendChild(s);
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
  }, [articleBodyHtml]);

  const readNext = trending.slice(0, 3);
  const nineGrid = trending.slice(0, 9);

  return (
    <>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="max-w-4xl min-w-0">
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
              {(() => {
                const published = article.published_at ? new Date(article.published_at).getTime() : 0;
                const updated = article.updated_at ? new Date(article.updated_at).getTime() : 0;
                if (published && updated - published > 5000) {
                  return <span>Updated {shortDate(article.updated_at)}</span>;
                }
                return <span>{shortDate(article.published_at)}</span>;
              })()}
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
            ref={proseRef}
            className="prose prose-lg max-w-none text-lg leading-relaxed prose-headings:font-black prose-headings:uppercase prose-a:text-blue-700 prose-a:no-underline hover:prose-a:underline prose-a:font-semibold prose-strong:text-black"
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
    </>
  );
}

function formatArticleBody(body: string) {
  const trimmed = (body || "").trim();
  if (!trimmed) return "<p></p>";

  let enriched = trimmed;
  if (/<[a-z][\s\S]*>/i.test(trimmed)) {
    enriched = sanitizeRichText(trimmed);
  } else {
    enriched = trimmed
      .split(/\n\n+/)
      .map((para) => `<p>${escapeHtml(para).replace(/\n/g, "<br />")}</p>`)
      .join("");
  }

  // Enrich: wrap bare (non-figured) iframes in responsive 16:9 wrapper for mobile/desktop
  // Also normalize YouTube/Vimeo iframes src policy-friendly
  enriched = enriched.replace(
    /(<iframe\b[^>]*><\/iframe>)/gi,
    (_m, iframe) => {
      const insideFigure = /<figure[\s\S]*<\/figure>/i.test(iframe);
      if (insideFigure) return iframe;
      const hasWrapper = /<div[^>]*aspect-video/i.test(iframe);
      if (hasWrapper) return iframe;
      return `<figure class="my-8 w-full max-w-none"><div class="aspect-video w-full overflow-hidden rounded border border-gray-200 bg-black">${iframe}</div></figure>`;
    },
  );

  // Wrap standalone video tags (non-figured) in responsive container
  enriched = enriched.replace(
    /(<video\b[^>]*>(?:[\s\S]*?<\/video>|<video\b[^>]*\/>))/gi,
    (_m, videoTag) => {
      const insideFigure = /<figure[\s\S]*<\/figure>/i.test(videoTag);
      if (insideFigure) return videoTag;
      return `<figure class="my-8 w-full max-w-none"><div class="w-full overflow-hidden rounded border border-gray-200 bg-black">${videoTag}</div></figure>`;
    },
  );

  // Wrap known inline social embed blockquotes (twitter/instagram/facebook/tiktok) in a responsive figure so they match inline image/video spacing
  const embedBQRe = /<figure[^>]*>\s*(<blockquote\s+class="(?:twitter-tweet|instagram-media|fb-post|tiktok-embed)"[^>]*>[\s\S]*?<\/blockquote>)\s*<\/figure>/gi;
  const standaloneBQRe = /(<blockquote\s+class="(?:twitter-tweet|instagram-media|fb-post|tiktok-embed)"[^>]*>[\s\S]*?<\/blockquote>)(?!\s*<\/figure>)/gi;
  const wrapEmbed = (bq: string) =>
    `<figure class="inline-embed my-8 w-full max-w-none overflow-hidden rounded border border-gray-200 bg-white p-3">${bq}</figure>`;
  enriched = enriched.replace(embedBQRe, (_m: string, bq: string) => wrapEmbed(bq));
  enriched = enriched.replace(standaloneBQRe, (_m: string, bq: string) => wrapEmbed(bq));

  // Ensure inline images outside figures look good too
  enriched = enriched.replace(
    /(<img\b[^>]*>)(?!\s*<\/figcaption>|<\/a><\/figure>|<\/source>|<\/video>)/gi,
    (_m, img) => {
      if (/class="[^"]*w-full/.test(img) || /<figure[\s\S]*$/i.test(img)) return img;
      return `<figure class="my-6 flex flex-col items-center">${img.replace(/^<img\b/i, '<img class="w-full max-w-full rounded border border-gray-200 bg-gray-50" loading="lazy"')}</figure>`;
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
      if (clazz && /^[\w\s-]+$/.test(clazz)) attrs.push(`class="${clazz}"`);
      const cite = (tag.match(/\scite="([^"]*)"/i) || tag.match(/\scite='([^']*)'/i) || [])[1];
      if (cite) {
        try {
          const u = new URL(cite);
          if (u.protocol === "http:" || u.protocol === "https:") attrs.push(`cite="${u.toString().replace(/"/g, "&quot;")}"`);
        } catch { /* ignore */ }
      }
      const lang = (tag.match(/\slang="([^"]*)"/i) || [])[1];
      if (lang && /^[a-zA-Z0-9_-]+$/.test(lang)) attrs.push(`lang="${lang}"`);
      const dir = (tag.match(/\sdir="([^"]*)"/i) || [])[1];
      if (dir === "ltr" || dir === "rtl" || dir === "auto") attrs.push(`dir="${dir}"`);
      const dataRe = /\sdata-([a-zA-Z0-9_-]+)="([^"]*)"/g;
      let dm: RegExpExecArray | null;
      while ((dm = dataRe.exec(tag))) {
        const key = `data-${dm[1].toLowerCase()}`;
        if (attrs.some((a) => a.startsWith(`${key}="`))) continue;
        const val = String(dm[2]).replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
        attrs.push(`${key}="${val}"`);
      }
      const close = isSelfClosing(tag) ? " />" : ">";
      return `<blockquote${attrs.length ? " " + attrs.join(" ") : ""}${close}`;
    }

    // Figure: keep class + data-*
    if (/^<figure\b/i.test(tag)) {
      const attrs: string[] = [];
      const clazz = (tag.match(/\sclass="([^"]*)"/i) || [])[1];
      if (clazz && /^[\w\s-]+$/.test(clazz)) attrs.push(`class="${clazz}"`);
      const dataRe = /\sdata-([a-zA-Z0-9_-]+)="([^"]*)"/g;
      let dm: RegExpExecArray | null;
      while ((dm = dataRe.exec(tag))) {
        const key = `data-${dm[1].toLowerCase()}`;
        if (attrs.some((a) => a.startsWith(`${key}="`))) continue;
        const val = String(dm[2]).replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
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
      const m = tag.match(/^<(figcaption|div|p|span|ul|ol|li|section|br|strong|b|em|i|u|h2|h3|h4)\b/i);
      if (!m) return tag;
      const tagName = m[1].toLowerCase();
      const clazz = (tag.match(/\sclass="([^"]*)"/i) || [])[1];
      const close = isSelfClosing(tag) ? " />" : ">";
      if (clazz && /^[\w\s-]+$/.test(clazz)) {
        return `<${tagName} class="${clazz}"${close}`;
      }
      return `<${tagName}${close}`;
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
      scratch.querySelectorAll<HTMLElement>(
        classes.map((c) => `blockquote.${c}`).join(","),
      ),
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
        bq.setAttribute("data-instgrm-captioned", "");
        bq.setAttribute("data-instgrm-permalink", safeLink);
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

function EmbeddedPost({ url }: { url: string }) {
  const embed = getEmbedConfig(url);

  useEffect(() => {
    if (!embed || typeof document === "undefined") return;
    let cancelled = false;

    if (embed.type === "instagram") {
      const process = () => {
        if (cancelled) return;
        try {
          (window as any).instgrm?.Embeds?.process?.();
        } catch {}
      };

      const existingScript = document.querySelector('script[src="https://www.instagram.com/embed.js"]') as HTMLScriptElement | null;
      if (existingScript && (window as any).instgrm?.Embeds?.process) {
        setTimeout(process, 0);
        return;
      }

      const script = existingScript ?? document.createElement("script");
      script.async = true;
      script.defer = true;
      script.src = "https://www.instagram.com/embed.js";
      script.onload = () => setTimeout(process, 50);
      script.onerror = () => {};
      if (!existingScript) document.body.appendChild(script);
      return;
    }

    if (embed.type === "twitter") {
      const load = () => {
        if (cancelled) return;
        try {
          (window as any).twttr?.widgets?.load?.();
        } catch {}
      };

      const existingScript = document.querySelector('script[src="https://platform.twitter.com/widgets.js"]') as HTMLScriptElement | null;
      if (existingScript && (window as any).twttr?.widgets?.load) {
        setTimeout(load, 0);
        return;
      }

      const script = existingScript ?? document.createElement("script");
      script.async = true;
      script.defer = true;
      script.src = "https://platform.twitter.com/widgets.js";
      script.onload = () => setTimeout(load, 50);
      script.onerror = () => {};
      if (!existingScript) document.body.appendChild(script);
      return;
    }

    if (embed.type === "tiktok") {
      const existingScript = document.querySelector('script[src="https://www.tiktok.com/embed.js"]') as HTMLScriptElement | null;
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
          <noscript>
            <iframe
              src={`https://www.instagram.com/p/${embed.permalink.split("/").filter(Boolean).pop()}/embed/captioned/`}
              width="100%"
              height="720"
              frameBorder="0"
              scrolling="no"
              allowTransparency
              title="Instagram post"
              className="w-full border-0"
            />
          </noscript>
        </div>
      </section>
    );
  }

  if (embed.type === "twitter") {
    return (
      <section className="mb-8">
        <div className="overflow-hidden rounded border border-gray-200 bg-white p-3">
          <blockquote className="twitter-tweet mx-auto" data-conversation="none" data-dnt="true">
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
              loading="lazy"
            />
          </div>
        </div>
      </section>
    );
  }

  if (embed.type === "facebook") {
    const fbHref = encodeURIComponent((embed as any).href);
    return (
      <section className="mb-8">
        <div className="overflow-hidden rounded border border-gray-200 bg-white p-3">
          <iframe
            src={`https://www.facebook.com/plugins/post.php?href=${fbHref}&show_text=true&width=500`}
            width="100%"
            height="560"
            style={{ border: "none", overflow: "hidden" }}
            scrolling="no"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            allowFullScreen
            title="Facebook post"
          />
          <div className="mt-2">
            <a
              href={(embed as any).href}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-bold underline text-black break-all"
            >
              {(embed as any).href}
            </a>
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
        href={(embed as any).href ?? url}
        target="_blank"
        rel="noreferrer"
        className="break-all text-sm font-bold text-black underline"
      >
        {(embed as any).href ?? url}
      </a>
    </div>
  );
}

function getEmbedConfig(url: string) {
  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "twitter.com" || host === "x.com" || host === "mobile.twitter.com" || host === "m.x.com") {
      const cleanPath = parsed.pathname.replace(/\/+$/, "") || "/";
      return {
        type: "twitter" as const,
        permalink: `https://x.com${cleanPath}`,
      };
    }

    if (host === "instagram.com" || host === "m.instagram.com" || host === "instagr.am") {
      const pathOnly = parsed.pathname.replace(/\/+$/, "") + "/";
      if (pathOnly.startsWith("/p/") || pathOnly.startsWith("/reel/") || pathOnly.startsWith("/tv/") || pathOnly.startsWith("/stories/")) {
        return {
          type: "instagram" as const,
          permalink: `https://www.instagram.com${pathOnly}`,
        };
      }
      return {
        type: "link" as const,
        href: parsed.toString(),
      };
    }

    if (host === "youtube.com" || host === "m.youtube.com" || host === "youtu.be" || host === "youtube-nocookie.com" || host === "music.youtube.com") {
      const videoId = getYouTubeVideoId(parsed);
      if (videoId) {
        return {
          type: "youtube" as const,
          src: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`,
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

    if (host === "facebook.com" || host.endsWith(".facebook.com") || host === "fb.watch" || host === "fb.com") {
      return {
        type: "facebook" as const,
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
  const direct = pathname.match(/\/video\/(\d+)/);
  if (direct?.[1]) return direct[1];
  const short = pathname.match(/\/v\/(\d+)/);
  return short?.[1] ?? null;
}

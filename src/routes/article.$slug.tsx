import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { articleService, commentService } from "@/services/articleService";
import { ArticleCard } from "@/components/site/ArticleCard";
import { ShareButtons } from "@/components/site/ShareButtons";
import { TrendingSidebar } from "@/components/site/Sidebar";
import { fullDate } from "@/lib/format";
import { useAuth } from "@/context/AuthContext";

export const Route = createFileRoute("/article/$slug")({
  loader: async ({ params }) => {
    const article = await articleService.getBySlug(params.slug);
    if (!article || article.status !== "published") throw notFound();
    return { article };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) return { meta: [{ title: "Article — Entertainment Trends" }, { name: "robots", content: "noindex" }] };
    const a = loaderData.article;
    const img = a.hero_image_hd ?? a.hero_image_lq ?? undefined;
    return {
      meta: [
        { title: `${a.title} — Entertainment Trends` },
        { name: "description", content: a.dek ?? a.title },
        { property: "og:title", content: a.title },
        { property: "og:description", content: a.dek ?? "" },
        { property: "og:type", content: "article" },
        { property: "og:url", content: `/article/${params.slug}` },
        ...(img ? [{ property: "og:image", content: img }, { name: "twitter:image", content: img }] : []),
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: `/article/${params.slug}` }],
      scripts: [{
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org", "@type": "NewsArticle",
          headline: a.title, description: a.dek, image: img ? [img] : undefined,
          datePublished: a.published_at, articleSection: a.category?.name,
        }),
      }],
    };
  },
  component: ArticlePage,
  errorComponent: ({ error }) => <div className="p-8 text-center">{error.message}</div>,
  notFoundComponent: () => (
    <div className="p-16 text-center">
      <h1 className="display text-3xl font-black uppercase">Story not found</h1>
      <Link to="/" className="mt-4 inline-block yellow-bar px-4 py-2 font-bold uppercase tracking-widest">Back home</Link>
    </div>
  ),
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

  // Split trending for different sections
  const readNext = trending.slice(0, 3);
  const nineGrid = trending.slice(0, 9);
  const relatedStories = related.length > 0 ? related : trending.slice(0, 6);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
        {/* Main Content */}
        <div className="max-w-4xl">
          <header className="mb-6">
            {article.category?.name && (
              <Link to="/category/$slug" params={{ slug: article.category.slug }}>
                <div className="eyebrow">{article.category.name}</div>
              </Link>
            )}
            <h1 className="display mt-2 text-3xl font-black uppercase leading-[0.95] md:text-5xl lg:text-6xl">
              {article.title}
            </h1>
            {article.dek && <p className="mt-4 text-lg text-muted-foreground md:text-xl">{article.dek}</p>}
            <div className="meta mt-4 flex flex-wrap gap-x-4 gap-y-1">
              <span>By Entertainment Trends Staff</span>
              <span>{fullDate(article.published_at)}</span>
            </div>
          </header>

          {article.hero_image_hd && (
            <figure className="mb-8">
              <img src={article.hero_image_hd} alt={article.title} className="w-full" />
              {article.hero_caption && <figcaption className="meta mt-2">{article.hero_caption}</figcaption>}
            </figure>
          )}

          <div className="prose prose-lg max-w-none space-y-4 text-lg leading-relaxed">
            {article.body.split(/\n\n+/).map((para: string, i: number) => <p key={i}>{para}</p>)}
          </div>

          <div className="my-10 border-y border-border py-4"><ShareButtons url={url} title={article.title} /></div>

          {/* Read Next */}
          {readNext.length > 0 && (
            <section className="mt-12">
              <div className="mb-6 border-b-2 border-yellow pb-2">
                <h2 className="display text-2xl font-black uppercase">Read Next</h2>
              </div>
              <div className="space-y-6">
                {readNext.map((a: any) => (
                  <ArticleCard key={a.id} article={a} horizontal />
                ))}
              </div>
            </section>
          )}

          {/* 9-Article Grid */}
          {nineGrid.length > 0 && (
            <section className="mt-16">
              <div className="mb-6 border-b-2 border-yellow pb-2">
                <h2 className="display text-2xl font-black uppercase">More Stories</h2>
              </div>
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {nineGrid.map((a: any) => <ArticleCard key={a.id} article={a} />)}
              </div>
            </section>
          )}

          {/* Related Stories Horizontal Scroll */}
          {relatedStories.length > 0 && (
            <section className="mt-16">
              <div className="mb-6 border-b-2 border-yellow pb-2">
                <h2 className="display text-2xl font-black uppercase">Related Stories</h2>
              </div>
              <div className="flex gap-6 overflow-x-auto pb-4">
                {relatedStories.map((a: any) => (
                  <div key={a.id} className="min-w-[280px] max-w-[280px]">
                    <ArticleCard article={a} size="sm" />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Sidebar */}
        <div>
          <TrendingSidebar />
        </div>
      </div>
    </div>
  );
}



import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { articleService, commentService } from "@/services/articleService";
import { ArticleCard } from "@/components/site/ArticleCard";
import { ShareButtons } from "@/components/site/ShareButtons";
import { fullDate } from "@/lib/format";
import { useAuth } from "@/context/AuthContext";

export const Route = createFileRoute("/article/$slug")({
  loader: async ({ params }) => {
    const article = await articleService.getBySlug(params.slug);
    if (!article || article.status !== "published") throw notFound();
    return { article };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) return { meta: [{ title: "Article — Entertainme" }, { name: "robots", content: "noindex" }] };
    const a = loaderData.article;
    const img = a.hero_image_hd ?? a.hero_image_lq ?? undefined;
    return {
      meta: [
        { title: `${a.title} — Entertainme` },
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
  const url = typeof window !== "undefined" ? window.location.href : `/article/${article.slug}`;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
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
          <span>By Entertainme Staff</span>
          <span>{fullDate(article.published_at)}</span>
        </div>
      </header>

      {article.hero_image_hd && (
        <figure className="mb-8">
          <img src={article.hero_image_hd} alt={article.title} className="w-full" />
          {article.hero_caption && <figcaption className="meta mt-2">{article.hero_caption}</figcaption>}
        </figure>
      )}

      <div className="prose prose-invert prose-lg max-w-none space-y-4 text-lg leading-relaxed text-foreground/90">
        {article.body.split(/\n\n+/).map((para: string, i: number) => <p key={i}>{para}</p>)}
      </div>

      <div className="my-10 border-y border-border py-4"><ShareButtons url={url} title={article.title} /></div>

      <Comments articleId={article.id} />

      {related.length > 0 && (
        <section className="mt-16">
          <div className="mb-6 border-b-2 border-yellow pb-2">
            <h2 className="display text-2xl font-black uppercase">Related Stories</h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((a) => <ArticleCard key={a.id} article={a} size="sm" />)}
          </div>
        </section>
      )}
    </div>
  );
}

function Comments({ articleId }: { articleId: string }) {
  const { user } = useAuth();
  const [body, setBody] = useState("");
  const [comments, setComments] = useState<any[]>([]);
  const [posting, setPosting] = useState(false);

  async function load() { setComments(await commentService.listForArticle(articleId)); }
  useEffect(() => { load(); }, [articleId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !body.trim()) return;
    setPosting(true);
    try { await commentService.add(articleId, user.id, body.trim()); setBody(""); await load(); }
    finally { setPosting(false); }
  }

  return (
    <section className="mt-12">
      <div className="mb-6 border-b-2 border-yellow pb-2">
        <h2 className="display text-2xl font-black uppercase">Comments ({comments.length})</h2>
      </div>
      {user ? (
        <form onSubmit={submit} className="mb-6">
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3}
                    className="w-full border border-border bg-surface p-3 text-sm outline-none focus:border-yellow"
                    placeholder="Add your take…" />
          <button disabled={posting} className="mt-2 yellow-bar px-4 py-2 text-xs font-black uppercase tracking-widest disabled:opacity-60">
            {posting ? "Posting…" : "Post comment"}
          </button>
        </form>
      ) : (
        <div className="mb-6 border border-border bg-surface p-4 text-sm">
          <Link to="/auth" className="text-yellow underline">Sign in</Link> to join the conversation.
        </div>
      )}
      <div className="space-y-4">
        {comments.map((c) => (
          <div key={c.id} className="border-b border-border pb-3">
            <div className="meta mb-1">{c.profile?.display_name ?? "Reader"} · {fullDate(c.created_at)}</div>
            <p className="text-sm">{c.body}</p>
          </div>
        ))}
        {comments.length === 0 && <p className="text-sm text-muted-foreground">Be the first to comment.</p>}
      </div>
    </section>
  );
}

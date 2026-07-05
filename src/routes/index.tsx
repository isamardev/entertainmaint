import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { articleService } from "@/services/articleService";
import { ArticleCard } from "@/components/site/ArticleCard";
import { TrendingSidebar } from "@/components/site/Sidebar";
import { GridSkeleton } from "@/components/site/Skeleton";
import { timeAgo } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Entertainme — Celebrity, TV, Music, Style, Royals, Sports" },
      { name: "description", content: "Breaking entertainment news updated all day — celebrity, movies & TV, music, style, royals, sports." },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Home,
});

function Home() {
  const { data, isLoading } = useQuery({
    queryKey: ["home-articles"],
    queryFn: () => articleService.listPublished({ limit: 20 }),
  });
  const articles = data?.data ?? [];
  const [featured, ...rest] = articles;
  const grid = rest.slice(0, 6);
  const secondary = rest.slice(6);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Helmet><title>Entertainme — The Pulse of Pop Culture</title></Helmet>

      {isLoading && !featured ? (
        <div className="aspect-[16/9] w-full animate-pulse bg-surface" />
      ) : featured ? (
        <section className="grid gap-8 lg:grid-cols-3">
          <Link to="/article/$slug" params={{ slug: featured.slug }} className="group block lg:col-span-2">
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-surface">
              {(() => {
                const img = featured.hero_image_hd ?? featured.hero_image_lq;
                return img ? (
                  <img src={img} alt={featured.title}
                       className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                ) : null;
              })()}
              <div className="absolute inset-x-0 bottom-0 top-1/3 bg-gradient-to-t from-black via-black/70 to-transparent p-5 md:p-8">
                {featured.category?.name && <div className="eyebrow mb-2">{featured.category.name}</div>}
                <h1 className="display max-w-3xl text-3xl font-black leading-[0.95] md:text-5xl lg:text-6xl group-hover:text-yellow">
                  {featured.title}
                </h1>
                {featured.dek && <p className="mt-3 max-w-2xl text-base text-white/90 md:text-lg hidden md:block">{featured.dek}</p>}
                <div className="meta mt-3">{timeAgo(featured.published_at)}</div>
              </div>
              {featured.is_breaking && (
                <span className="absolute left-4 top-4 z-10 yellow-bar px-3 py-1 text-xs font-black uppercase tracking-widest">Breaking</span>
              )}
            </div>
          </Link>
          <div className="space-y-6">
            {rest.slice(0, 3).map((a) => (
              <ArticleCard key={a.id} article={a} horizontal size="sm" />
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-14 grid gap-10 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="mb-6 flex items-end justify-between border-b-2 border-yellow pb-2">
            <h2 className="display text-2xl font-black uppercase">Latest</h2>
            <Link to="/search" search={{ q: "" }} className="text-xs font-bold uppercase tracking-widest text-yellow hover:underline">See all</Link>
          </div>
          {isLoading ? <GridSkeleton /> : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {grid.map((a) => <ArticleCard key={a.id} article={a} />)}
            </div>
          )}

          {secondary.length > 0 && (
            <>
              <div className="mb-6 mt-14 border-b-2 border-yellow pb-2">
                <h2 className="display text-2xl font-black uppercase">More Stories</h2>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                {secondary.map((a) => <ArticleCard key={a.id} article={a} horizontal />)}
              </div>
            </>
          )}
        </div>
        <TrendingSidebar />
      </div>
    </div>
  );
}

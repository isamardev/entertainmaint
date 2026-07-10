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
    queryFn: () => articleService.listPublished({ limit: 25 }),
  });
  const articles = data?.data ?? [];
  const [featured1, leftTopArticle, rightLargeArticle, leftBottomArticle, ...rest] = articles;
  
  // Split articles for PageSix style layout
  const grid1 = rest.slice(0, 3);
  const grid2 = rest.slice(3, 6);
  const remaining = rest.slice(6);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Helmet><title>Entertainme — The Pulse of Pop Culture</title></Helmet>

      {/* Full Layout Starts Here - Sidebar from Beginning */}
      <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
        <div>
          {/* 1. First Big Featured Article */}
          {isLoading && !featured1 ? (
            <div className="aspect-[16/9] w-full animate-pulse bg-surface mb-8" />
          ) : featured1 ? (
            <section className="mb-8">
              <Link to={`/article/${featured1.slug}`} className="group block">
                {/* Image */}
                <div className="aspect-[16/9] w-full overflow-hidden bg-surface mb-4">
                  {(() => {
                    const img = featured1.hero_image_hd ?? featured1.hero_image_lq;
                    return img ? (
                      <img src={img} alt={featured1.title}
                           className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    ) : null;
                  })()}
                </div>
                {/* Title and details below image */}
                {featured1.category?.name && <div className="eyebrow mb-2">{featured1.category.name}</div>}
                <h1 className="display text-3xl font-black leading-[0.95] md:text-5xl lg:text-6xl group-hover:text-yellow">
                  {featured1.title}
                </h1>
                {featured1.dek && <p className="mt-3 text-base md:text-lg text-muted-foreground hidden md:block">{featured1.dek}</p>}
                <div className="meta mt-3">{timeAgo(featured1.published_at)}</div>
              </Link>
            </section>
          ) : null}

          {/* 2. First 3-Article Grid */}
          {isLoading ? (
            <GridSkeleton />
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 mb-8">
              {grid1.map((a) => <ArticleCard key={a.id} article={a} />)}
            </div>
          )}

          {/* 3. Second 3-Article Grid */}
          {grid2.length > 0 && (
            <div className="mb-8">
              {isLoading ? <GridSkeleton /> : (
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {grid2.map((a) => <ArticleCard key={a.id} article={a} />)}
                </div>
              )}
            </div>
          )}

          {/* 4. Special Layout (2 left vertical, 1 large right) like image6 - NO EXTRA SPACE */}
          {leftTopArticle && rightLargeArticle && leftBottomArticle && (
            <div className="grid gap-6 md:gap-8 md:grid-cols-[2fr_3fr] mb-8 items-start">
              {/* Left side: 2 vertical articles - image ABOVE title */}
              <div className="space-y-6 md:space-y-8">
                {/* Left Top Article - image above title */}
                <Link to={`/article/${leftTopArticle.slug}`} className="group block flex flex-col items-start">
                  <div className="aspect-[16/10] w-full overflow-hidden bg-surface mb-3">
                    {(() => {
                      const img = leftTopArticle.hero_image_hd ?? leftTopArticle.hero_image_lq;
                      return img ? (
                        <img src={img} alt={leftTopArticle.title}
                             className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      ) : null;
                    })()}
                  </div>
                  <div className="text-left w-full">
                    {leftTopArticle.category?.name && <div className="eyebrow mb-1">{leftTopArticle.category.name}</div>}
                    <h3 className="display font-black leading-tight group-hover:text-yellow text-xl">
                      {leftTopArticle.title}
                    </h3>
                    {leftTopArticle.dek && (
                      <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{leftTopArticle.dek}</p>
                    )}
                    <div className="meta mt-1.5">{timeAgo(leftTopArticle.published_at)}</div>
                  </div>
                </Link>
                {/* Left Bottom Article - image above title */}
                <Link to={`/article/${leftBottomArticle.slug}`} className="group block flex flex-col items-start">
                  <div className="aspect-[16/10] w-full overflow-hidden bg-surface mb-3">
                    {(() => {
                      const img = leftBottomArticle.hero_image_hd ?? leftBottomArticle.hero_image_lq;
                      return img ? (
                        <img src={img} alt={leftBottomArticle.title}
                             className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      ) : null;
                    })()}
                  </div>
                  <div className="text-left w-full">
                    {leftBottomArticle.category?.name && <div className="eyebrow mb-1">{leftBottomArticle.category.name}</div>}
                    <h3 className="display font-black leading-tight group-hover:text-yellow text-xl">
                      {leftBottomArticle.title}
                    </h3>
                    {leftBottomArticle.dek && (
                      <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{leftBottomArticle.dek}</p>
                    )}
                    <div className="meta mt-1.5">{timeAgo(leftBottomArticle.published_at)}</div>
                  </div>
                </Link>
              </div>
              {/* Right side: 1 large article - title BELOW image */}
              <Link to={`/article/${rightLargeArticle.slug}`} className="group block flex flex-col items-start">
                {/* Full-width Image first */}
                <div className="aspect-[16/10] md:aspect-[4/3] w-full overflow-hidden bg-surface mb-4 flex-shrink-0">
                  {(() => {
                    const img = rightLargeArticle.hero_image_hd ?? rightLargeArticle.hero_image_lq;
                    return img ? (
                      <img src={img} alt={rightLargeArticle.title}
                           className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    ) : null;
                  })()}
                </div>
                {/* ALL TEXT CONTENT strictly below image */}
                <div className="text-left w-full">
                  {rightLargeArticle.category?.name && <div className="eyebrow mb-2">{rightLargeArticle.category.name}</div>}
                  <h2 className="display text-2xl font-black leading-[0.95] md:text-3xl group-hover:text-yellow">
                    {rightLargeArticle.title}
                  </h2>
                  {rightLargeArticle.dek && (
                    <p className="mt-2 text-base text-muted-foreground">{rightLargeArticle.dek}</p>
                  )}
                  <div className="meta mt-2">{timeAgo(rightLargeArticle.published_at)}</div>
                </div>
              </Link>
            </div>
          )}

          {/* 5. Remaining Articles */}
          {remaining.length > 0 && (
            <div>
              <div className="mb-6 border-b-2 border-yellow pb-2">
                <h2 className="display text-2xl font-black uppercase">More Stories</h2>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                {remaining.map((a) => <ArticleCard key={a.id} article={a} horizontal />)}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Trending Now (Sticky from Top) */}
        <TrendingSidebar />
      </div>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { articleService, type Article } from "@/services/articleService";
import { ArticleCard, ArticleMedia } from "@/components/site/ArticleCard";
import { TrendingSidebar } from "@/components/site/Sidebar";
import { GridSkeleton } from "@/components/site/Skeleton";

function articleImage(article: Article, alt = false) {
  const primary = article.hero_image_hd ?? article.hero_image_lq ?? "";
  const secondary = article.hero_image_lq ?? article.hero_image_hd ?? "";
  if (!alt) return primary;
  if (secondary && secondary !== primary) return secondary;
  if (primary.includes("picsum.photos/seed/")) {
    return primary.replace(/\/\d+\/\d+$/, "/900/675");
  }
  return primary;
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Entertainment Trends — Celebrity, TV, Music, Style, Royals, Sports" },
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
  const mobileSections: Array<{ featured?: Article; list: Article[] }> = [];

  let mobileIndex = 0;
  while (mobileIndex < articles.length) {
    const featured = articles[mobileIndex++];
    const list = articles.slice(mobileIndex, mobileIndex + 3);
    mobileIndex += list.length;
    mobileSections.push({ featured, list });
  }

  // Split articles into chunks for repeating pattern
  const chunks: Array<{
    large: Article | undefined;
    grid: Article[];
    split: { large: Article | undefined; top: Article | undefined; bottom: Article | undefined } | undefined;
  }> = [];
  
  let i = 0;
  while (i < articles.length) {
    const chunk: any = {};
    
    // First: Large article
    chunk.large = articles[i++];
    
    // Next: 3 for grid
    chunk.grid = [];
    for (let j = 0; j < 3 && i < articles.length; j++) {
      chunk.grid.push(articles[i++]);
    }
    
    // Next: 3 for split layout
    if (i + 2 < articles.length) {
      chunk.split = {
        large: articles[i++],
        top: articles[i++],
        bottom: articles[i++]
      };
    } else {
      chunk.split = undefined;
    }
    
    chunks.push(chunk);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Helmet><title>Entertainment Trends — The Pulse of Pop Culture</title></Helmet>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <div className="md:hidden">
            {isLoading ? (
              <div className="animate-pulse space-y-8">
                <div className="aspect-[16/9] bg-surface w-full" />
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="aspect-[16/10] w-32 shrink-0 bg-surface" />
                      <div className="flex-1 space-y-2 pt-1">
                        <div className="h-5 w-full bg-surface" />
                        <div className="h-5 w-4/5 bg-surface" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="aspect-[16/9] bg-surface w-full" />
              </div>
            ) : (
              <div className="space-y-8">
                {mobileSections.map((section, sectionIndex) => (
                  <div key={section.featured?.id ?? sectionIndex} className="space-y-5">
                    {section.featured && (
                      <FeaturedArticle
                        article={section.featured}
                        isLoading={isLoading}
                        keySuffix={`mobile-${sectionIndex}`}
                        useAltImage={sectionIndex % 2 !== 0}
                      />
                    )}

                    {section.list.length > 0 && (
                      <div className="space-y-4">
                        {section.list.map((article, articleIndex) => (
                          <ArticleCard
                            key={`${article.id}-mobile-${articleIndex}`}
                            article={article}
                            horizontal
                            size="sm"
                            imageOverride={sectionIndex % 2 !== 0 ? articleImage(article, true) : undefined}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="hidden md:block">
            {isLoading ? (
              <div className="animate-pulse space-y-10">
                <div className="aspect-[16/9] bg-surface w-full" />
                <GridSkeleton />
                <GridSkeleton />
                <div className="grid gap-6 md:grid-cols-[2fr_3fr]">
                  <div className="space-y-6">
                    <div className="aspect-[16/10] bg-surface" />
                    <div className="aspect-[16/10] bg-surface" />
                  </div>
                  <div className="aspect-[16/9] bg-surface" />
                </div>
              </div>
            ) : (
              <>
                {chunks.map((chunk, chunkIndex) => (
                  <div key={chunkIndex}>
                    {chunk.large && (
                      <FeaturedArticle
                        article={chunk.large}
                        isLoading={isLoading}
                        keySuffix={`chunk-${chunkIndex}`}
                        useAltImage={chunkIndex % 2 !== 0}
                      />
                    )}

                    {chunk.grid.length > 0 && (
                      <ArticleGrid
                        articles={chunk.grid}
                        isLoading={isLoading}
                        keySuffix={`chunk-${chunkIndex}`}
                        useAltImage={chunkIndex % 2 !== 0}
                      />
                    )}

                    {chunk.split && (
                      <SplitArticleLayout
                        largeArticle={chunk.split.large!}
                        topArticle={chunk.split.top!}
                        bottomArticle={chunk.split.bottom!}
                        largeOnLeft={chunkIndex % 2 === 0}
                        useAltImage={chunkIndex % 2 !== 0}
                      />
                    )}
                  </div>
                ))}

                {chunks.flatMap(c => [c.large, ...c.grid, c.split?.large, c.split?.top, c.split?.bottom]).filter(Boolean).length < articles.length && (
                  <MoreStories
                    articles={articles.slice(chunks.flatMap(c => [c.large, ...c.grid, c.split?.large, c.split?.top, c.split?.bottom]).filter(Boolean).length)}
                  />
                )}
              </>
            )}
          </div>

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

function FeaturedArticle({
  article,
  isLoading,
  keySuffix = "",
  useAltImage = false,
}: {
  article?: Article;
  isLoading: boolean;
  keySuffix?: string;
  useAltImage?: boolean;
}) {
  if (isLoading && !article) {
    return <div className="aspect-[16/9] w-full animate-pulse bg-surface mb-10" />;
  }
  if (!article) return null;

  const img = articleImage(article, useAltImage);

  return (
    <section key={`featured${keySuffix}`} className="mb-10">
      <Link to={`/article/${article.slug}`} className="group block">
        <ArticleMedia
          article={article}
          imageOverride={img}
          className="mb-4 aspect-[16/9] w-full overflow-hidden bg-surface"
          imgClassName="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <h1 className="display text-3xl font-black leading-[0.95] md:text-5xl lg:text-6xl group-hover:text-black">
          {article.title}
        </h1>
        {article.dek && (
          <p className="mt-3 text-base md:text-lg text-muted-foreground hidden md:block">{article.dek}</p>
        )}
      </Link>
    </section>
  );
}

function ArticleGrid({
  articles,
  isLoading,
  keySuffix = "",
  useAltImage = false,
}: {
  articles: Article[];
  isLoading: boolean;
  keySuffix?: string;
  useAltImage?: boolean;
}) {
  if (!articles.length && !isLoading) return null;

  return (
    <div className="mb-10">
      {isLoading ? (
        <GridSkeleton />
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a, i) => (
            <ArticleCard
              key={`${a.id}${keySuffix}-${i}`}
              article={a}
              imageOverride={useAltImage ? articleImage(a, true) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SplitArticleLayout({
  largeArticle,
  topArticle,
  bottomArticle,
  largeOnLeft,
  useAltImage = false,
}: {
  largeArticle: Article;
  topArticle: Article;
  bottomArticle: Article;
  largeOnLeft: boolean;
  useAltImage?: boolean;
}) {
  const renderSmallArticle = (article: Article) => {
    const img = articleImage(article, useAltImage);
    return (
      <Link
        key={article.id}
        to={`/article/${article.slug}`}
        className="group flex min-h-0 flex-1 flex-col"
      >
        <ArticleMedia
          article={article}
          imageOverride={img}
          className="relative mb-3 min-h-[160px] flex-1 overflow-hidden bg-surface sm:min-h-[180px]"
          imgClassName="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="shrink-0 text-left">
          <h3 className="display text-xl font-black leading-tight group-hover:text-black">
            {article.title}
          </h3>
          {article.dek && (
            <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{article.dek}</p>
          )}
        </div>
      </Link>
    );
  };

  const largeImg = articleImage(largeArticle, useAltImage);
  const largeBlock = (
    <Link to={`/article/${largeArticle.slug}`} className="group flex h-full min-h-0 flex-col">
      <ArticleMedia
        article={largeArticle}
        imageOverride={largeImg}
        className="relative mb-4 min-h-[220px] flex-1 overflow-hidden bg-surface sm:min-h-[280px]"
        imgClassName="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="shrink-0 text-left">
        <h2 className="display text-2xl font-black leading-[0.95] md:text-3xl group-hover:text-black">
          {largeArticle.title}
        </h2>
        {largeArticle.dek && (
          <p className="mt-2 line-clamp-3 text-base text-muted-foreground">{largeArticle.dek}</p>
        )}
      </div>
    </Link>
  );

  const smallStack = (
    <div className="flex h-full min-h-0 flex-col gap-5 md:gap-6">
      {renderSmallArticle(topArticle)}
      {renderSmallArticle(bottomArticle)}
    </div>
  );

  return (
    <div
      className={`mb-10 grid gap-6 md:min-h-[560px] md:items-stretch md:gap-5 ${
        largeOnLeft ? "md:grid-cols-[3fr_2fr]" : "md:grid-cols-[2fr_3fr]"
      }`}
    >
      {largeOnLeft ? (
        <>
          <div className="flex h-full min-h-0 flex-col">{largeBlock}</div>
          <div className="flex h-full min-h-0 flex-col">{smallStack}</div>
        </>
      ) : (
        <>
          <div className="flex h-full min-h-0 flex-col">{smallStack}</div>
          <div className="flex h-full min-h-0 flex-col">{largeBlock}</div>
        </>
      )}
    </div>
  );
}

function MoreStories({ articles }: { articles: Article[] }) {
  if (!articles.length) return null;

  return (
    <div className="mt-10">
      <div className="mb-6">
        <h2 className="display text-2xl font-black uppercase">More Stories</h2>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        {articles.map((a) => (
          <ArticleCard key={a.id} article={a} horizontal />
        ))}
      </div>
    </div>
  );
}

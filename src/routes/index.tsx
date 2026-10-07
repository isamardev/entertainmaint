import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { Loader2 } from "lucide-react";
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
    return primary.replace(/\/\d+\/\d+$/, "/1600/1200");
  }
  return primary;
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Entertainment Trends — Celebrity, TV, Music, Style, Royals, Sports" },
      {
        name: "description",
        content:
          "Breaking entertainment news updated all day — celebrity, movies & TV, music, style, royals, sports.",
      },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Home,
});

function Home() {
  const [visibleCount, setVisibleCount] = useState(18);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["home-articles"],
    queryFn: () => articleService.listPublished({ limit: 100 }),
  });
  const allArticles = data?.data ?? [];
  const articles = allArticles.slice(0, visibleCount);
  const hasMore = visibleCount < allArticles.length;

  const handleShowMore = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => prev + 12);
      setIsLoadingMore(false);
    }, 200);
  };
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
    split:
      | { large: Article | undefined; top: Article | undefined; bottom: Article | undefined }
      | undefined;
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
        bottom: articles[i++],
      };
    } else {
      chunk.split = undefined;
    }

    chunks.push(chunk);
  }

  return (
    <>
      <Helmet>
        <title>Entertainment Trends — The Pulse of Pop Culture</title>
      </Helmet>

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
                      <div>
                        <FeaturedArticle
                          article={section.featured}
                          isLoading={isLoading}
                          keySuffix={`mobile-${sectionIndex}`}
                          useAltImage={sectionIndex % 2 !== 0}
                        />
                      </div>
                    )}

                    {section.list.length > 0 && (
                      <div className="space-y-4">
                        {section.list.map((article, articleIndex) => (
                          <div key={`${article.id}-mobile-${articleIndex}`}>
                            <ArticleCard
                              article={article}
                              horizontal
                              size="sm"
                              imageOverride={
                                sectionIndex % 2 !== 0 ? articleImage(article, true) : undefined
                              }
                            />
                            {articleIndex < section.list.length - 1 && (
                              <div className="mt-4 border-b border-gray-400" aria-hidden="true" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="border-b border-gray-400" aria-hidden="true" />
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
                        centerTitle={chunkIndex === 0}
                        hideDek={chunkIndex === 0}
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

                {chunks
                  .flatMap((c) => [
                    c.large,
                    ...c.grid,
                    c.split?.large,
                    c.split?.top,
                    c.split?.bottom,
                  ])
                  .filter(Boolean).length < articles.length && (
                  <MoreStories
                    articles={articles.slice(
                      chunks
                        .flatMap((c) => [
                          c.large,
                          ...c.grid,
                          c.split?.large,
                          c.split?.top,
                          c.split?.bottom,
                        ])
                        .filter(Boolean).length,
                    )}
                  />
                )}
              </>
            )}
          </div>

          {/* Show More Button */}
          {!isLoading && hasMore && (
            <div className="my-10 flex justify-center">
              <button
                type="button"
                onClick={handleShowMore}
                disabled={isLoadingMore}
                className="w-full max-w-md py-3.5 px-8 border-2 border-black bg-white hover:bg-black text-black hover:text-white font-black uppercase text-sm tracking-widest transition-all duration-200 flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isLoadingMore ? (
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

function FeaturedArticle({
  article,
  isLoading,
  keySuffix = "",
  useAltImage = false,
  centerTitle = false,
  hideDek = false,
}: {
  article?: Article;
  isLoading: boolean;
  keySuffix?: string;
  useAltImage?: boolean;
  centerTitle?: boolean;
  hideDek?: boolean;
}) {
  if (isLoading && !article) {
    return <div className="aspect-[16/9] w-full animate-pulse bg-surface mb-10" />;
  }
  if (!article) return null;

  const img = articleImage(article, useAltImage);
  const titleSize = "text-xl sm:text-2xl md:text-[28px] lg:text-[32px] font-black leading-[1.15]";

  return (
    <section key={`featured${keySuffix}`} className="mb-10">
      <Link to={`/article/${article.slug}`} className="group block">
        <ArticleMedia
          article={article}
          imageOverride={img}
          className="mb-4 aspect-[16/9] w-full overflow-hidden bg-surface"
          imgClassName="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <h3
          className={`display ${titleSize} group-hover:text-black text-center line-clamp-3`}
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {article.title}
        </h3>
        {article.dek && !hideDek && (
          <p className="mt-2 text-sm md:text-sm text-muted-foreground hidden md:block">
            {article.dek}
          </p>
        )}
      </Link>
      <div className="mt-10 border-b border-gray-400" aria-hidden="true" />
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
        <div className="relative">
          <div className="grid gap-y-8 gap-x-10 sm:grid-cols-2 sm:gap-y-10 sm:gap-x-10 lg:grid-cols-3 lg:gap-x-12">
            {articles.map((a, i) => (
              <div key={`${a.id}${keySuffix}-${i}`} className="flex flex-col">
                <ArticleCard
                  article={a}
                  imageOverride={useAltImage ? articleImage(a, true) : undefined}
                />
                {i < articles.length - 1 && (
                  <div
                    className="mt-8 block border-b border-gray-400 sm:hidden"
                    aria-hidden="true"
                  />
                )}
              </div>
            ))}
          </div>

          {/* sm 2-col vertical divider — dead centre of the gap-x-10 */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-1/2 hidden -translate-x-1/2 w-px bg-gray-400 sm:block lg:hidden"
          />
          {/* lg 3-col vertical dividers — 2 lines at 33.33% and 66.66% horizontal, dead centre between cols */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-[33.3333%] hidden -translate-x-1/2 w-px bg-gray-400 lg:block"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-[66.6666%] hidden -translate-x-1/2 w-px bg-gray-400 lg:block"
          />
        </div>
      )}
      <div className="mt-10 border-b border-gray-400" aria-hidden="true" />
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
  const renderSmallArticle = (article: Article, isLast: boolean) => {
    const img = articleImage(article, useAltImage);
    return (
      <Link
        key={article.id}
        to={`/article/${article.slug}`}
        className={
          "group flex min-h-0 flex-1 flex-col " +
          (!isLast ? "pb-5 md:pb-6 border-b border-gray-400 mb-5 md:mb-6" : "")
        }
      >
        <ArticleMedia
          article={article}
          imageOverride={img}
          className="relative mb-3 min-h-[160px] flex-1 overflow-hidden bg-surface sm:min-h-[180px]"
          imgClassName="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="shrink-0 text-left">
          <h3
            className="display text-base sm:text-[17px] font-black leading-snug group-hover:text-black line-clamp-3"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {article.title}
          </h3>
          {article.dek && (
            <p className="mt-1.5 line-clamp-2 text-xs sm:text-sm text-muted-foreground">{article.dek}</p>
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
      <div className="shrink-0">
        <h3
          className="display text-lg sm:text-xl md:text-2xl font-black leading-snug group-hover:text-black text-center line-clamp-3"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {largeArticle.title}
        </h3>
        {largeArticle.dek && (
          <p className="mt-2 line-clamp-2 text-xs sm:text-sm text-muted-foreground">{largeArticle.dek}</p>
        )}
      </div>
    </Link>
  );

  const smallStack = (
    <div className="flex h-full min-h-0 flex-col md:gap-0">
      {renderSmallArticle(topArticle, false)}
      {renderSmallArticle(bottomArticle, true)}
    </div>
  );

  return (
    <div className="mb-10">
      <div
        className={`grid gap-6 md:min-h-[560px] md:items-stretch md:gap-0 ${
          largeOnLeft ? "md:grid-cols-[3fr_2fr]" : "md:grid-cols-[2fr_3fr]"
        }`}
      >
        {largeOnLeft ? (
          <>
            <div className="flex h-full min-h-0 flex-col md:pr-5 md:border-r md:border-gray-400">
              {largeBlock}
            </div>
            <div className="flex h-full min-h-0 flex-col md:pl-5">{smallStack}</div>
          </>
        ) : (
          <>
            <div className="flex h-full min-h-0 flex-col md:pr-5 md:border-r md:border-gray-400">
              {smallStack}
            </div>
            <div className="flex h-full min-h-0 flex-col md:pl-5">{largeBlock}</div>
          </>
        )}
      </div>
      <div className="mt-4 border-b border-gray-400" aria-hidden="true" />
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

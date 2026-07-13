import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { articleService, type Article } from "@/services/articleService";
import { ArticleCard } from "@/components/site/ArticleCard";
import { TrendingSidebar } from "@/components/site/Sidebar";
import { GridSkeleton } from "@/components/site/Skeleton";
import { timeAgo } from "@/lib/format";

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
  const [featured1, leftTopArticle, rightLargeArticle, leftBottomArticle, ...rest] = articles;

  const grid1 = rest.slice(0, 3);
  const grid2 = rest.slice(3, 6);
  const remaining = rest.slice(6);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Helmet><title>Entertainment Trends — The Pulse of Pop Culture</title></Helmet>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <HomeArticleSections
            isLoading={isLoading}
            featured1={featured1}
            grid1={grid1}
            grid2={grid2}
            leftTopArticle={leftTopArticle}
            rightLargeArticle={rightLargeArticle}
            leftBottomArticle={leftBottomArticle}
            largeOnLeft={false}
          />

          <MoreStories articles={remaining} />

          <div className="mt-10 border-t-4 border-yellow pt-10">
            <div className="mb-8 border-b-2 border-yellow pb-2">
              <h2 className="display text-2xl font-black uppercase">Latest Stories</h2>
            </div>
            <HomeArticleSections
              isLoading={isLoading}
              featured1={featured1}
              grid1={grid1}
              grid2={grid2}
              leftTopArticle={leftTopArticle}
              rightLargeArticle={rightLargeArticle}
              leftBottomArticle={leftBottomArticle}
              largeOnLeft
              useAltImage
              keySuffix="-copy"
            />
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

function SectionDivider() {
  return <div className="my-8 border-t-4 border-yellow" role="separator" />;
}

function HomeArticleSections({
  isLoading,
  featured1,
  grid1,
  grid2,
  leftTopArticle,
  rightLargeArticle,
  leftBottomArticle,
  largeOnLeft,
  useAltImage = false,
  keySuffix = "",
}: {
  isLoading: boolean;
  featured1?: Article;
  grid1: Article[];
  grid2: Article[];
  leftTopArticle?: Article;
  rightLargeArticle?: Article;
  leftBottomArticle?: Article;
  largeOnLeft: boolean;
  useAltImage?: boolean;
  keySuffix?: string;
}) {
  return (
    <>
      <FeaturedArticle
        article={featured1}
        isLoading={isLoading}
        keySuffix={keySuffix}
        useAltImage={useAltImage}
      />

      {(grid1.length > 0 || isLoading) && (
        <>
          <SectionDivider />
          <ArticleGrid
            articles={grid1}
            isLoading={isLoading}
            keySuffix={keySuffix}
            useAltImage={useAltImage}
          />
        </>
      )}

      {grid2.length > 0 && (
        <>
          <SectionDivider />
          <ArticleGrid
            articles={grid2}
            isLoading={isLoading}
            keySuffix={keySuffix}
            useAltImage={useAltImage}
          />
        </>
      )}

      {leftTopArticle && rightLargeArticle && leftBottomArticle && (
        <>
          <SectionDivider />
          <SplitArticleLayout
            largeArticle={rightLargeArticle}
            topArticle={leftTopArticle}
            bottomArticle={leftBottomArticle}
            largeOnLeft={largeOnLeft}
            useAltImage={useAltImage}
          />
        </>
      )}
    </>
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
    return <div className="aspect-[16/9] w-full animate-pulse bg-surface" />;
  }
  if (!article) return null;

  const img = articleImage(article, useAltImage);

  return (
    <section key={`featured${keySuffix}`}>
      <Link to={`/article/${article.slug}`} className="group block">
        <div className="aspect-[16/9] w-full overflow-hidden bg-surface mb-4">
          {img ? (
            <img
              src={img}
              alt={article.title}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : null}
        </div>
        {article.category?.name && <div className="eyebrow mb-2">{article.category.name}</div>}
        <h1 className="display text-3xl font-black leading-[0.95] md:text-5xl lg:text-6xl group-hover:text-yellow">
          {article.title}
        </h1>
        {article.dek && (
          <p className="mt-3 text-base md:text-lg text-muted-foreground hidden md:block">{article.dek}</p>
        )}
        <div className="meta mt-3">{timeAgo(article.published_at)}</div>
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
    <div>
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
        <div className="relative mb-3 min-h-[160px] flex-1 overflow-hidden bg-surface sm:min-h-[180px]">
          {img ? (
            <img
              src={img}
              alt={article.title}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : null}
        </div>
        <div className="shrink-0 text-left">
          {article.category?.name && (
            <div className="eyebrow mb-1">{article.category.name}</div>
          )}
          <h3 className="display text-xl font-black leading-tight group-hover:text-yellow">
            {article.title}
          </h3>
          {article.dek && (
            <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{article.dek}</p>
          )}
          <div className="meta mt-1.5">{timeAgo(article.published_at)}</div>
        </div>
      </Link>
    );
  };

  const largeImg = articleImage(largeArticle, useAltImage);
  const largeBlock = (
    <Link to={`/article/${largeArticle.slug}`} className="group flex h-full min-h-0 flex-col">
      <div className="relative mb-4 min-h-[220px] flex-1 overflow-hidden bg-surface sm:min-h-[280px]">
        {largeImg ? (
          <img
            src={largeImg}
            alt={largeArticle.title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : null}
      </div>
      <div className="shrink-0 text-left">
        {largeArticle.category?.name && (
          <div className="eyebrow mb-2">{largeArticle.category.name}</div>
        )}
        <h2 className="display text-2xl font-black leading-[0.95] md:text-3xl group-hover:text-yellow">
          {largeArticle.title}
        </h2>
        {largeArticle.dek && (
          <p className="mt-2 line-clamp-3 text-base text-muted-foreground">{largeArticle.dek}</p>
        )}
        <div className="meta mt-2">{timeAgo(largeArticle.published_at)}</div>
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
      className={`grid gap-6 md:min-h-[560px] md:items-stretch md:gap-5 ${
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
    <div className="mt-10 border-t-4 border-yellow pt-10">
      <div className="mb-6 border-b-2 border-yellow pb-2">
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

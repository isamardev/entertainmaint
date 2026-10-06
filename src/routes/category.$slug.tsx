import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { articleService, categoryService, type Article } from "@/services/articleService";
import { TrendingSidebar } from "@/components/site/Sidebar";
import { shortDate } from "@/lib/format";

export const Route = createFileRoute("/category/$slug")({
  loader: async ({ params }) => {
    const cats = await categoryService.list();
    const cat = cats.find((c) => c.slug === params.slug);
    if (!cat) throw notFound();
    return { category: cat };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.category.name} — Entertainment Trends` },
          {
            name: "description",
            content: `Latest ${loaderData.category.name} news on Entertainment Trends.`,
          },
        ]
      : [{ title: "Category — Entertainment Trends" }],
    links: loaderData ? [{ rel: "canonical", href: `/category/${loaderData.category.slug}` }] : [],
  }),
  component: CategoryPage,
  errorComponent: ({ error }) => <div className="p-8 text-center">{error.message}</div>,
  notFoundComponent: () => <div className="p-8 text-center">Category not found.</div>,
});

function LargeCard({ article }: { article: Article }) {
  return (
    <Link
      to="/article/$slug"
      params={{ slug: article.slug }}
      className="group flex h-full w-full flex-col"
    >
      <div className="mb-4 aspect-[4/3] w-full overflow-hidden bg-gray-100 border border-gray-100">
        {article.hero_image_hd || article.hero_image_lq ? (
          <img
            src={article.hero_image_hd ?? article.hero_image_lq ?? ""}
            alt={article.title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : null}
      </div>
      <h3 className="display text-2xl font-black uppercase leading-tight group-hover:text-black md:text-3xl">
        {article.title}
      </h3>
      {article.dek ? (
        <p className="mt-2 text-sm text-muted-foreground md:text-base">{article.dek}</p>
      ) : null}
      <div className="meta mt-3 text-xs text-muted-foreground">
        {shortDate(article.published_at ?? article.updated_at ?? article.created_at)}
      </div>
    </Link>
  );
}

function SmallCard({ article }: { article: Article }) {
  return (
    <Link
      to="/article/$slug"
      params={{ slug: article.slug }}
      className="group flex h-full w-full flex-col"
    >
      <div className="aspect-[16/10] mb-3 w-full overflow-hidden bg-gray-100 border border-gray-100 md:aspect-[4/3]">
        {article.hero_image_hd || article.hero_image_lq ? (
          <img
            src={article.hero_image_hd ?? article.hero_image_lq ?? ""}
            alt={article.title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : null}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-start">
        <h3 className="display text-base font-bold uppercase leading-tight group-hover:text-black md:text-lg">
          {article.title}
        </h3>
        <div className="meta mt-2 text-xs text-muted-foreground">
          {shortDate(article.published_at ?? article.updated_at ?? article.created_at)}
        </div>
      </div>
    </Link>
  );
}

function LatestHorizontal({ article }: { article: Article }) {
  return (
    <Link
      to="/article/$slug"
      params={{ slug: article.slug }}
      className="group flex w-full flex-col sm:items-stretch sm:flex-row sm:gap-5"
    >
      {/* Mobile: image fills width above text. sm+: side-by-side horizontal card (img left, title centre right). */}
      <div className="aspect-[16/10] mb-3 w-full overflow-hidden bg-gray-100 border border-gray-100 sm:mb-0 sm:w-2/5 sm:shrink-0 md:w-1/3">
        {article.hero_image_hd || article.hero_image_lq ? (
          <img
            src={article.hero_image_hd ?? article.hero_image_lq ?? ""}
            alt={article.title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : null}
      </div>
      <div className="flex min-w-0 flex-1 sm:items-center">
        <div className="min-h-0 w-full">
          <h3 className="display text-xl font-black uppercase leading-tight group-hover:text-black md:text-2xl">
            {article.title}
          </h3>
          <div className="meta mt-3 text-xs text-muted-foreground md:text-sm">
            {shortDate(article.published_at ?? article.updated_at ?? article.created_at)}
          </div>
        </div>
      </div>
    </Link>
  );
}

function SplitGroup({ index, three }: { index: number; three: Article[] }) {
  const isLargeOnLeft = index % 2 === 0;

  if (isLargeOnLeft) {
    return (
      <section className="relative pb-10">
        {/* Mobile: always stack LARGE on top, then 2 smalls. md+: split grid (large left). */}
        <div className="flex flex-col gap-6 md:min-h-[560px] md:grid md:items-stretch md:gap-5 md:grid-cols-[3fr_2fr]">
          <div className="flex h-full min-h-0 flex-col">
            <LargeCard article={three[0]} />
            {/* Mobile divider below top large card */}
            <div className="mt-6 block border-b border-gray-400 md:hidden" aria-hidden="true" />
          </div>
          <div className="flex h-full min-h-0 flex-col justify-between gap-6 md:gap-5">
            <div className="min-h-0 flex-1 flex items-stretch pb-6 md:pb-5 border-b border-gray-400">
              <div className="w-full">
                <SmallCard article={three[1]} />
              </div>
            </div>
            <div className="min-h-0 flex-1 flex items-stretch">
              <div className="w-full">
                <SmallCard article={three[2]} />
              </div>
            </div>
          </div>
        </div>
        <div className="col-span-full mt-6 border-b border-gray-400" aria-hidden="true" />
      </section>
    );
  }

  // Large on right, 2 small stacked on left (md+). Mobile: large on top, then 2 small stacked below.
  return (
    <section className="relative pb-10">
      <div className="flex flex-col gap-6 md:min-h-[560px] md:grid md:items-stretch md:gap-5 md:grid-cols-[2fr_3fr]">
        {/* On mobile this column comes AFTER the large one (reorder). On md+: 2 smalls first left. */}
        <div className="flex h-full min-h-0 flex-col justify-between gap-6 md:gap-5 md:order-1 order-2">
          <div className="min-h-0 flex-1 flex items-stretch pb-6 md:pb-5 border-b border-gray-400">
            <div className="w-full">
              <SmallCard article={three[0]} />
            </div>
          </div>
          <div className="min-h-0 flex-1 flex items-stretch">
            <div className="w-full">
              <SmallCard article={three[1]} />
            </div>
          </div>
        </div>
        <div className="flex h-full min-h-0 flex-col md:order-2 order-1">
          <LargeCard article={three[2]} />
          <div className="mt-6 block border-b border-gray-400 md:hidden" aria-hidden="true" />
        </div>
      </div>
      <div className="col-span-full mt-6 border-b border-gray-400" aria-hidden="true" />
    </section>
  );
}

function CategoryPage() {
  const { category } = Route.useLoaderData();
  // Load ALL category articles (limit bumped generous so infinite split works)
  const { data, isLoading } = useQuery({
    queryKey: ["category-page-full", category.slug],
    queryFn: () =>
      articleService.listPublished({ categorySlug: category.slug, limit: 200, offset: 0 }),
    staleTime: 60_000,
  });
  const all = data?.data ?? [];

  // Every 3 articles → alternating large/2small split group
  const fullGroups: Article[][] = [];
  let i = 0;
  while (i + 2 < all.length) {
    fullGroups.push([all[i], all[i + 1], all[i + 2]]);
    i += 3;
  }
  const latest = all.slice(i);

  return (
    <>
      <header className="mb-10 border-b-4 border-yellow pb-4">
        <div className="eyebrow">Section</div>
        <h1 className="display text-4xl font-black uppercase md:text-6xl">{category.name}</h1>
        {category.description && (
          <p className="mt-2 text-muted-foreground">{category.description}</p>
        )}
      </header>

      {isLoading ? (
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-10">
            <div className="h-[620px] animate-pulse bg-surface" />
            <div className="h-[620px] animate-pulse bg-surface" />
          </div>
          <div className="hidden h-[600px] animate-pulse bg-surface lg:block" />
        </div>
      ) : all.length === 0 ? (
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="border border-border bg-surface p-10 text-center text-muted-foreground">
            No stories in {category.name} yet.
          </div>
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <TrendingSidebar />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0">
            <div className="space-y-10">
              {fullGroups.map((three, idx) => (
                <SplitGroup key={`grp-${three[0].id}-${idx}`} index={idx} three={three} />
              ))}
            </div>

            {latest.length > 0 ? (
              <section className="pt-4">
                <div className="mb-6 border-b-4 border-yellow pb-2">
                  <h2 className="display text-2xl font-black uppercase md:text-3xl">Latest</h2>
                </div>
                <div className="grid grid-cols-1">
                  {latest.map((a, idx) => (
                    <div
                      key={a.id}
                      className={idx < latest.length - 1 ? "py-6 border-b border-gray-400" : "py-6"}
                    >
                      <LatestHorizontal article={a} />
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          <div className="hidden lg:block">
            <div className="sticky top-24">
              <TrendingSidebar />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import { createFileRoute, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { articleService, categoryService } from "@/services/articleService";
import { ArticleCard } from "@/components/site/ArticleCard";
import { TrendingSidebar } from "@/components/site/Sidebar";
import { GridSkeleton } from "@/components/site/Skeleton";

export const Route = createFileRoute("/category/$slug")({
  loader: async ({ params }) => {
    const cats = await categoryService.list();
    const cat = cats.find((c) => c.slug === params.slug);
    if (!cat) throw notFound();
    return { category: cat };
  },
  head: ({ loaderData }) => ({
    meta: loaderData ? [
      { title: `${loaderData.category.name} — Entertainme` },
      { name: "description", content: `Latest ${loaderData.category.name} news on Entertainme.` },
    ] : [{ title: "Category — Entertainme" }],
    links: loaderData ? [{ rel: "canonical", href: `/category/${loaderData.category.slug}` }] : [],
  }),
  component: CategoryPage,
  errorComponent: ({ error }) => <div className="p-8 text-center">{error.message}</div>,
  notFoundComponent: () => <div className="p-8 text-center">Category not found.</div>,
});

const PAGE = 12;

function CategoryPage() {
  const { category } = Route.useLoaderData();
  const [page, setPage] = useState(0);
  const { data, isLoading } = useQuery({
    queryKey: ["category", category.slug, page],
    queryFn: () => articleService.listPublished({ categorySlug: category.slug, limit: PAGE, offset: page * PAGE }),
  });
  const articles = data?.data ?? [];
  const total = data?.count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-8 border-b-4 border-yellow pb-4">
        <div className="eyebrow">Section</div>
        <h1 className="display text-4xl font-black uppercase md:text-6xl">{category.name}</h1>
        {category.description && <p className="mt-2 text-muted-foreground">{category.description}</p>}
      </header>

      <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
        <div>
          {isLoading ? <GridSkeleton n={PAGE} /> : articles.length === 0 ? (
            <div className="border border-border bg-surface p-10 text-center text-muted-foreground">
              No stories in {category.name} yet.
            </div>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((a) => <ArticleCard key={a.id} article={a} />)}
            </div>
          )}

          {pages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              <button disabled={page === 0} onClick={() => setPage((p) => p - 1)}
                      className="border border-border px-3 py-1.5 text-xs font-bold uppercase tracking-widest disabled:opacity-40 hover:border-yellow hover:text-yellow">Prev</button>
              <span className="meta">Page {page + 1} of {pages}</span>
              <button disabled={page + 1 >= pages} onClick={() => setPage((p) => p + 1)}
                      className="border border-border px-3 py-1.5 text-xs font-bold uppercase tracking-widest disabled:opacity-40 hover:border-yellow hover:text-yellow">Next</button>
            </div>
          )}
        </div>
        <TrendingSidebar />
      </div>
    </div>
  );
}

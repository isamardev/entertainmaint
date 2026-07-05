import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { articleService } from "@/services/articleService";
import { ArticleCard } from "@/components/site/ArticleCard";
import { GridSkeleton } from "@/components/site/Skeleton";

const searchSchema = z.object({ q: z.string().optional().default("") });

export const Route = createFileRoute("/search")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Search — Entertainme" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q: initial } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [q, setQ] = useState(initial);
  const term = initial.trim();

  const { data = [], isLoading } = useQuery({
    queryKey: ["search", term],
    queryFn: () => articleService.search(term),
    enabled: !!term,
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8">
        <div className="eyebrow">Search</div>
        <h1 className="display text-4xl font-black uppercase md:text-5xl">Find a story</h1>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); navigate({ search: { q } }); }}
            className="mb-8 flex gap-2 border-b-2 border-yellow pb-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search Entertainme…"
               className="flex-1 bg-transparent text-xl outline-none placeholder:text-muted-foreground" />
        <button className="yellow-bar px-4 py-2 text-sm font-black uppercase tracking-widest">Search</button>
      </form>

      {!term && <p className="text-muted-foreground">Enter a search term to see stories.</p>}
      {term && isLoading && <GridSkeleton />}
      {term && !isLoading && data.length === 0 && (
        <div className="border border-border bg-surface p-10 text-center text-muted-foreground">
          No matches for “{term}”.
        </div>
      )}
      {term && !isLoading && data.length > 0 && (
        <>
          <div className="meta mb-4">{data.length} result{data.length === 1 ? "" : "s"} for “{term}”</div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((a) => <ArticleCard key={a.id} article={a} />)}
          </div>
        </>
      )}
    </div>
  );
}

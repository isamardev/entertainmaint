import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { articleService } from "@/services/articleService";

export function TrendingSidebar() {
  const { data: trendingData = [] } = useQuery({
    queryKey: ["trending"],
    queryFn: () => articleService.listTrending(8),
    staleTime: 60_000,
  });
  const { data: popularResponse = { data: [] } } = useQuery({
    queryKey: ["popular"],
    queryFn: () => articleService.listPublished({ limit: 5 }),
    staleTime: 60_000,
  });
  const popularData = popularResponse.data || [];
  return (
    <aside className="sticky top-24 space-y-6">
      {/* Trending Now */}
      <div className="border-t-4 border-yellow bg-white p-5">
        <h3 className="display mb-4 text-xl font-black uppercase tracking-wide">Trending Now</h3>
        <ol className="space-y-4">
          {trendingData.map((a: any, i) => {
            const img = a.hero_image_hd ?? a.hero_image_lq;
            return (
              <li key={a.id} className="flex gap-3 border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                <span className="display shrink-0 text-3xl font-black leading-none text-yellow">{i + 1}</span>
                <div className="flex gap-3 min-w-0">
                  {img && (
                    <Link to="/article/$slug" params={{ slug: a.slug }} className="shrink-0">
                      <img src={img} alt={a.title} className="h-16 w-20 object-cover" />
                    </Link>
                  )}
                  <div className="min-w-0">
                    {a.category?.name && <div className="eyebrow mb-1">{a.category.name}</div>}
                    <Link to="/article/$slug" params={{ slug: a.slug }}
                          className="display block text-sm font-bold leading-snug hover:text-yellow">
                      {a.title}
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
      {/* Popular Articles */}
      <div className="border-t-4 border-gray-300 bg-white p-5">
        <h3 className="display mb-4 text-xl font-black uppercase tracking-wide">Popular Articles</h3>
        <div className="space-y-5">
          {popularData.map((a: any) => {
            const img = a.hero_image_hd ?? a.hero_image_lq;
            return (
              <div key={a.id} className="border-b border-gray-200 pb-5 last:border-0 last:pb-0">
                <Link to={`/article/${a.slug}`} className="group block">
                  {img && (
                    <div className="aspect-[16/10] w-full overflow-hidden mb-2">
                      <img src={img} alt={a.title} 
                           className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    </div>
                  )}
                  <div>
                    {a.category?.name && <div className="eyebrow mb-1">{a.category.name}</div>}
                    <h4 className="display font-bold leading-snug hover:text-yellow">
                      {a.title}
                    </h4>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

export function NewsletterCard() {
  return (
    <div className="mt-6 border border-yellow bg-black p-5">
      <div className="eyebrow mb-2">Newsletter</div>
      <h4 className="display text-xl font-black uppercase">Get the tea, daily.</h4>
      <p className="mt-1 text-xs text-muted-foreground">The biggest scoops straight to your inbox.</p>
      <form className="mt-3 flex gap-0" onSubmit={(e) => e.preventDefault()}>
        <input type="email" required placeholder="email@example.com"
               className="min-w-0 flex-1 border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-yellow" />
        <button className="yellow-bar px-3 py-2 text-xs font-black uppercase tracking-widest">Join</button>
      </form>
    </div>
  );
}

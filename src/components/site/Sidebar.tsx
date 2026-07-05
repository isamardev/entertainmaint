import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { articleService } from "@/services/articleService";

export function TrendingSidebar() {
  const { data = [] } = useQuery({
    queryKey: ["trending"],
    queryFn: () => articleService.listTrending(8),
    staleTime: 60_000,
  });
  return (
    <aside className="sticky top-24">
      <div className="border-t-4 border-yellow bg-surface p-5">
        <h3 className="display mb-4 text-xl font-black uppercase tracking-wide">Trending Now</h3>
        <ol className="space-y-4">
          {data.map((a: any, i) => (
            <li key={a.id} className="flex gap-3 border-b border-border pb-4 last:border-0 last:pb-0">
              <span className="display shrink-0 text-3xl font-black leading-none text-yellow">{i + 1}</span>
              <div className="min-w-0">
                {a.category?.name && <div className="eyebrow mb-1">{a.category.name}</div>}
                <Link to="/article/$slug" params={{ slug: a.slug }}
                      className="display block text-sm font-bold leading-snug hover:text-yellow">
                  {a.title}
                </Link>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <NewsletterCard />
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

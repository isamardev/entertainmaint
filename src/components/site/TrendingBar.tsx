import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { articleService } from "@/services/articleService";

export function TrendingBar() {
  const { data = [] } = useQuery({
    queryKey: ["trending-bar"],
    queryFn: () => articleService.listTrending(12),
    staleTime: 60_000,
  });

  const items = data.length
    ? data
    : [{ id: "fallback", slug: "", title: "Welcome to Entertainment Trends — your daily dose of pop culture." }];
  const doubled = [...items, ...items];

  return (
    <div className="overflow-hidden border-b border-yellow bg-white py-3">
      <div className="flex items-center">
        <span className="display relative z-10 shrink-0 bg-white px-4 text-sm font-black uppercase tracking-widest text-yellow">
          Trending Now
        </span>
        <div className="relative min-w-0 flex-1 overflow-hidden">
          <div className="trending-track flex min-w-max items-center gap-8 pl-2">
            {doubled.map((a: any, i) => {
              const img = a.hero_image_hd ?? a.hero_image_lq;
              return (
                <Link
                  key={`${a.id}-${i}`}
                  to="/article/$slug"
                  params={{ slug: a.slug || "#" }}
                  className="group flex min-w-[320px] max-w-[360px] items-center gap-3"
                >
                  {img && (
                    <img
                      src={img}
                      alt={a.title}
                      className="h-14 w-20 shrink-0 object-cover"
                    />
                  )}
                  <span className="line-clamp-2 text-sm font-bold leading-tight text-black group-hover:text-yellow">
                    {a.title}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

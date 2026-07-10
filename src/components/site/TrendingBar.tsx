import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { articleService } from "@/services/articleService";

export function TrendingBar() {
  const { data = [] } = useQuery({
    queryKey: ["trending-bar"],
    queryFn: () => articleService.listTrending(12),
    staleTime: 60_000,
  });

  return (
    <div className="bg-white py-3 border-b border-yellow">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex items-center gap-4">
          <span className="display shrink-0 text-yellow text-sm font-black uppercase tracking-widest">
            Trending Now
          </span>
          <div className="flex gap-6 overflow-x-auto pb-1 no-scrollbar flex-1">
            {data.map((a: any) => (
              <Link
                key={a.id}
                to="/article/$slug"
                params={{ slug: a.slug }}
                className="flex items-center gap-3 min-w-[350px] group"
              >
                {(() => {
                  const img = a.hero_image_hd ?? a.hero_image_lq;
                  return img ? (
                    <img
                      src={img}
                      alt={a.title}
                      className="h-16 w-24 object-cover flex-shrink-0"
                    />
                  ) : null;
                })()}
                <span className="text-black text-sm font-bold leading-tight group-hover:text-yellow line-clamp-2">
                  {a.title}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
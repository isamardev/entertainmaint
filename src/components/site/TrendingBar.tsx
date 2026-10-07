import React from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { articleService } from "@/services/articleService";

export function TrendingBar() {
  const { data = [] } = useQuery({
    queryKey: ["trending-bar"],
    queryFn: () => articleService.listTrending(24),
    staleTime: 60_000,
  });

  const rows = React.useMemo(() => {
    const seen = new Set<string>();
    return (data || []).filter((a: any) => {
      const slug = String(a.slug || a.id || Math.random())
        .toLowerCase()
        .trim();
      if (seen.has(slug)) return false;
      seen.add(slug);
      return true;
    });
  }, [data]);

  if (!rows.length) return null;

  return (
    <div className="w-full border-b border-gray-300 bg-white">
      <div className="w-full px-3 sm:px-4 md:px-6 !py-0">
        {/* Bar compressed: outer py-2 instead of py-3 (chhota height). */}
        <div className="flex flex-col items-stretch gap-2 py-2 sm:flex-row sm:items-center sm:gap-3">
          <div className="flex shrink-0 items-center gap-3 sm:w-auto">
            <span className="display shrink-0 pl-0 pr-2 text-[11px] font-black uppercase tracking-[0.25em] text-black">
              Trending Now
            </span>
          </div>
          <div
            className="min-w-0 flex-1 overflow-x-auto overflow-y-hidden pb-1 trending-scroll"
            style={{
              scrollbarGutter: "stable both-edges",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {/* Single 1 row, flex-nowrap = NO multi row wrap ever. */}
            <div
              className="flex flex-nowrap items-center gap-x-5 gap-y-0 pr-3"
              style={{ minWidth: "max-content" }}
            >
              {rows.map((a: any) => {
                const img = a.hero_image_hd ?? a.hero_image_lq;
                return (
                  <Link
                    key={a.id}
                    to="/article/$slug"
                    params={{ slug: a.slug || "#" }}
                    className="group flex shrink-0 items-center gap-2.5"
                    style={{ width: "210px", height: "40px" }}
                  >
                    {img && (
                      <div className="h-9 w-12 shrink-0 overflow-hidden bg-gray-100 border border-gray-100">
                        <img
                          src={img}
                          alt={a.title}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    {/* Title 2 lines max with 3 dots (ellipsis) */}
                    <span
                      className="display inline-block flex-1 text-[11px] font-semibold leading-[1.3] text-black group-hover:text-black line-clamp-2"
                      style={{
                        width: img ? "calc(210px - 48px - 10px)" : "100%",
                        wordBreak: "break-word",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {a.title}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

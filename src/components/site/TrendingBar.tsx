import React from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { articleService, type Article } from "@/services/articleService";

export function TrendingBar() {
  // Fetch latest published articles
  const { data } = useQuery({
    queryKey: ["trending-bar-latest"],
    queryFn: () => articleService.listPublished({ limit: 20 }),
    staleTime: 60_000,
  });

  // Exactly 8 latest articles, sorted by newest first
  const rows: Article[] = React.useMemo(() => {
    const list = data?.data ?? [];
    const seen = new Set<string>();
    return list
      .slice()
      .sort((a, b) => {
        const timeA = new Date(a.published_at || a.created_at || 0).getTime();
        const timeB = new Date(b.published_at || b.created_at || 0).getTime();
        return timeB - timeA;
      })
      .filter((a) => {
        const slug = String(a.slug || a.id || Math.random())
          .toLowerCase()
          .trim();
        if (seen.has(slug)) return false;
        seen.add(slug);
        return true;
      })
      .slice(0, 8);
  }, [data]);

  if (!rows.length) return null;

  return (
    <div className="w-full border-b border-gray-300 bg-white">
      <div className="w-full px-1.5 sm:px-2 md:px-3">
        {/* Top header: "TRENDING NOW" with horizontal rule extending across */}
        <div className="flex items-center gap-2 pt-2 pb-1.5">
          <span className="shrink-0 text-[9.5px] font-medium uppercase tracking-[0.18em] text-neutral-800">
            Trending Now
          </span>
          <div className="h-[1px] flex-1 bg-gray-300" />
        </div>

        {/* Story items carousel: Image on left, title on right, 8 latest articles */}
        <div
          className="min-w-0 flex-1 overflow-x-auto overflow-y-hidden pt-1 pb-2.5 trending-scroll"
          style={{
            scrollbarGutter: "stable both-edges",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <div
            className="flex flex-nowrap items-center pr-3"
            style={{ minWidth: "max-content" }}
          >
            {rows.map((a: Article, idx: number) => {
              const img = a.hero_image_hd ?? a.hero_image_lq;
              return (
                <Link
                  key={a.id}
                  to="/article/$slug"
                  params={{ slug: a.slug || "#" }}
                  className={`group flex shrink-0 items-center gap-2.5 pr-4 transition-opacity hover:opacity-80 ${
                    idx < rows.length - 1 ? "border-r border-gray-300 mr-4" : ""
                  }`}
                  style={{ width: "278px", height: "62px" }}
                >
                  {img && (
                    <div className="h-[58px] w-[82px] shrink-0 overflow-hidden bg-gray-100">
                      <img
                        src={img}
                        alt={a.title}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  )}
                  {/* Title 3 lines max in extra bold text */}
                  <span
                    className="font-sans inline-block flex-1 text-[13.5px] font-black leading-[1.2] tracking-tight text-black group-hover:text-black line-clamp-3"
                    style={{
                      fontWeight: 900,
                      wordBreak: "break-word",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
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
  );
}

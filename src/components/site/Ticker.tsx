import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { articleService } from "@/services/articleService";

export function Ticker() {
  const { data = [] } = useQuery({
    queryKey: ["breaking"],
    queryFn: () => articleService.listBreaking(),
    staleTime: 60_000,
  });
  const items = data.length ? data : [{ id: "x", slug: "", title: "Welcome to Entertainment Trends — the pulse of pop culture, refreshed nonstop." }];
  const doubled = [...items, ...items];
  return (
    <div className="yellow-bar overflow-hidden border-y border-black/20 relative">
      <div className="flex items-center">
        <span className="display shrink-0 bg-black px-4 py-2 text-xs font-black uppercase tracking-widest text-yellow relative z-10">
          Breaking
        </span>
        <div className="ticker-track flex min-w-max gap-10 whitespace-nowrap py-2 pl-6 text-sm font-semibold text-black relative">
          {doubled.map((it, i) => (
            <Link key={i + it.id} to="/article/$slug" params={{ slug: it.slug || "#" }} className="hover:underline">
              ● {it.title}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

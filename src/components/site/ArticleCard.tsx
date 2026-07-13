import { Link } from "@tanstack/react-router";
import type { Article } from "@/services/articleService";
import { timeAgo } from "@/lib/format";

type Props = { article: Article; size?: "sm" | "md" | "lg"; horizontal?: boolean; imageOverride?: string };

export function ArticleCard({ article, size = "md", horizontal = false, imageOverride }: Props) {
  const hd = imageOverride ?? article.hero_image_hd ?? article.hero_image_lq ?? "";
  const lq = imageOverride ?? article.hero_image_lq ?? hd;
  const cat = article.category?.name;
  return (
    <article className={`group ${horizontal ? "flex gap-4" : ""}`}>
      <Link to="/article/$slug" params={{ slug: article.slug }} className={horizontal ? "block w-32 shrink-0 sm:w-40" : "block"}>
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface">
          {hd && (
            <picture>
              <source media="(min-width: 768px)" srcSet={hd} />
              <img src={lq} alt={article.title} loading="lazy"
                   className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            </picture>
          )}
          {article.is_breaking && (
            <span className="absolute left-0 top-0 z-10 yellow-bar px-2 py-1 text-[0.65rem] font-black uppercase tracking-widest">Breaking</span>
          )}
        </div>
      </Link>
      <div className={horizontal ? "min-w-0 flex-1" : "mt-3"}>
        {cat && <div className="eyebrow mb-1.5">{cat}</div>}
        <Link to="/article/$slug" params={{ slug: article.slug }}>
          <h3 className={`display font-black leading-tight group-hover:text-yellow ${
            size === "lg" ? "text-3xl md:text-4xl" : size === "sm" ? "text-base" : "text-xl"
          }`}>
            {article.title}
          </h3>
        </Link>
        {size !== "sm" && article.dek && (
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{article.dek}</p>
        )}
        <div className="meta mt-2">{timeAgo(article.published_at)}</div>
      </div>
    </article>
  );
}

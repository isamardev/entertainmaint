import { Link } from "@tanstack/react-router";
import { normalizeMediaUrl, type Article } from "@/services/articleService";

type Props = {
  article: Article;
  size?: "sm" | "md" | "lg";
  horizontal?: boolean;
  imageOverride?: string;
};

export function ArticleCard({ article, size = "md", horizontal = false, imageOverride }: Props) {
  return (
    <article className={`group ${horizontal ? "flex gap-4" : ""}`}>
      <Link
        to="/article/$slug"
        params={{ slug: article.slug }}
        className={horizontal ? "block w-32 shrink-0 sm:w-40" : "block"}
      >
        <ArticleMedia
          article={article}
          imageOverride={imageOverride}
          className="relative aspect-[16/10] w-full overflow-hidden bg-surface"
          imgClassName="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </Link>
      <div className={horizontal ? "min-w-0 flex-1" : "mt-3"}>
        <Link to="/article/$slug" params={{ slug: article.slug }}>
          <h3
            className={`display font-black leading-tight group-hover:text-black ${
              size === "lg" ? "text-3xl md:text-4xl" : size === "sm" ? "text-base" : "text-xl"
            }`}
          >
            {article.title}
          </h3>
        </Link>
        {size !== "sm" && article.dek && (
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{article.dek}</p>
        )}
      </div>
    </article>
  );
}

function getEmbedPreview(url?: string | null) {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();

    if (host.includes("youtu.be") || host.includes("youtube.com")) {
      const pathParts = parsed.pathname.split("/").filter(Boolean);
      const videoId =
        parsed.searchParams.get("v") ??
        (pathParts[0] === "shorts" ? pathParts[1] : null) ??
        (host.includes("youtu.be") ? pathParts[0] : null);

      if (videoId) {
        return {
          label: "YouTube",
          image: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          host,
        };
      }
    }

    if (host.includes("instagram.com")) {
      return { label: "Instagram", image: null, host };
    }

    if (host.includes("x.com") || host.includes("twitter.com")) {
      return { label: "X", image: null, host };
    }

    if (host.includes("tiktok.com")) {
      return { label: "TikTok", image: null, host };
    }

    return { label: "Link", image: null, host };
  } catch {
    return { label: "Link", image: null, host: "" };
  }
}

export function ArticleMedia({
  article,
  imageOverride,
  className,
  imgClassName,
}: {
  article: Article;
  imageOverride?: string;
  className?: string;
  imgClassName?: string;
}) {
  const hd = imageOverride ?? article.hero_image_hd ?? article.hero_image_lq ?? "";
  const lq = imageOverride ?? article.hero_image_lq ?? hd;
  const preview = getEmbedPreview(article.embed_url);
  const rawImageSrc = hd || preview?.image || "";
  const imageSrc = normalizeMediaUrl(rawImageSrc);

  return (
    <div className={className}>
      {imageSrc ? (
        <picture>
          <img
            src={imageSrc}
            alt={article.title}
            loading="lazy"
            decoding="async"
            className={imgClassName}
          />
        </picture>
      ) : preview ? (
        <div className="flex h-full w-full flex-col justify-between border border-gray-200 bg-white p-4 text-black">
          <span className="text-xs font-black uppercase tracking-[0.25em]">{preview.label}</span>
          <div>
            <p className="text-lg font-black leading-tight">Open Story</p>
            <p className="mt-1 text-xs text-muted-foreground">{preview.host || "Embedded post"}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

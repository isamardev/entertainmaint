import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { articleService } from "@/services/articleService";

/**
 * SmartStickySidebar
 * Smooth bi-directional sticky sidebar:
 * - Scrolling DOWN: Sidebar scrolls with page until its bottom edge reaches viewport bottom, then locks (sticks).
 * - Scrolling UP: Sidebar immediately scrolls up with page until its top edge reaches viewport top, then locks (sticks).
 */
export function SmartStickySidebar({
  children,
  topOffset = 80,
  bottomOffset = 24,
  className = "",
}: {
  children: ReactNode;
  topOffset?: number;
  bottomOffset?: number;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [style, setStyle] = useState<React.CSSProperties>({
    position: "sticky",
    top: `${topOffset}px`,
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof window === "undefined") return;

    let lastScrollY = window.scrollY || window.pageYOffset || 0;
    let mode: "sticky-top" | "sticky-bottom" | "scrolling-down" | "scrolling-up" = "sticky-top";
    let relativeTop = 0;
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const scrollY = window.scrollY || window.pageYOffset || 0;
        const delta = scrollY - lastScrollY;
        const vh = window.innerHeight;
        const elHeight = el.offsetHeight;
        const availableHeight = vh - topOffset - bottomOffset;

        // If sidebar fits completely on screen, simple sticky top is enough
        if (elHeight <= availableHeight) {
          if (mode !== "sticky-top") {
            mode = "sticky-top";
            setStyle({ position: "sticky", top: `${topOffset}px` });
          }
          lastScrollY = scrollY;
          return;
        }

        const parent = el.parentElement;
        if (!parent) {
          lastScrollY = scrollY;
          return;
        }

        const parentRect = parent.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();

        // If at very top of page
        if (scrollY <= topOffset) {
          if (mode !== "sticky-top") {
            mode = "sticky-top";
            setStyle({ position: "sticky", top: `${topOffset}px` });
          }
          lastScrollY = scrollY;
          return;
        }

        if (delta > 0) {
          // Scrolling DOWN
          if (mode === "sticky-top" || mode === "scrolling-up") {
            mode = "scrolling-down";
            relativeTop = elRect.top - parentRect.top;
            setStyle({ position: "relative", top: `${relativeTop}px` });
          } else if (mode === "scrolling-down") {
            // Check if bottom of sidebar has reached bottom of viewport
            if (elRect.bottom <= vh - bottomOffset) {
              mode = "sticky-bottom";
              setStyle({
                position: "sticky",
                top: `${vh - elHeight - bottomOffset}px`,
              });
            }
          }
        } else if (delta < 0) {
          // Scrolling UP
          if (mode === "sticky-bottom" || mode === "scrolling-down") {
            mode = "scrolling-up";
            relativeTop = elRect.top - parentRect.top;
            setStyle({ position: "relative", top: `${relativeTop}px` });
          } else if (mode === "scrolling-up") {
            // Check if top of sidebar has reached topOffset
            if (elRect.top >= topOffset) {
              mode = "sticky-top";
              setStyle({ position: "sticky", top: `${topOffset}px` });
            }
          }
        }

        lastScrollY = scrollY > 0 ? scrollY : 0;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [topOffset, bottomOffset]);

  return (
    <div ref={containerRef} style={style} className={className}>
      {children}
    </div>
  );
}

export function TrendingSidebar() {
  const { data: trendingData = [] } = useQuery({
    queryKey: ["trending"],
    queryFn: () => articleService.listTrending(5),
    staleTime: 60_000,
  });

  return (
    <aside className="space-y-6">
      {/* Trending Now Widget matching Page Six reference */}
      <div className="border border-gray-300 bg-white p-4 sm:p-5">
        {/* Header */}
        <div className="mb-5">
          <h3 className="display text-[26px] font-black italic uppercase leading-none tracking-tight text-black">
            Trending Now
          </h3>
          <div className="mt-1.5 h-1.5 w-44 bg-[var(--color-yellow)]" />
          <div className="mt-1.5 text-[11px] font-black uppercase tracking-wider text-black">
            On Entertainmenttrends.com
          </div>
        </div>

        <div className="space-y-5">
          {trendingData.slice(0, 5).map((a: any, idx: number) => {
            const img = a.hero_image_hd ?? a.hero_image_lq;

            return (
              <article key={a.id} className="group">
                {img && (
                  <Link
                    to="/article/$slug"
                    params={{ slug: a.slug }}
                    className="block aspect-[16/10] w-full overflow-hidden bg-gray-100 mb-2.5"
                  >
                    <img
                      src={img}
                      alt={a.title}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </Link>
                )}
                <div>
                  <Link
                    to="/article/$slug"
                    params={{ slug: a.slug }}
                    className="font-sans block text-[15px] font-bold leading-[1.3] text-[#111111] hover:text-[#111111] line-clamp-4"
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {a.title}
                  </Link>
                </div>

                {/* Subtle horizontal separator between articles */}
                {idx < trendingData.slice(0, 5).length - 1 && (
                  <div className="mt-5 border-b border-gray-300" aria-hidden="true" />
                )}
              </article>
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
      <p className="mt-1 text-xs text-muted-foreground">
        The biggest scoops straight to your inbox.
      </p>
      <form className="mt-3 flex gap-0" onSubmit={(e) => e.preventDefault()}>
        <input
          type="email"
          required
          placeholder="email@example.com"
          className="min-w-0 flex-1 border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-yellow"
        />
        <button className="yellow-bar px-3 py-2 text-xs font-black uppercase tracking-widest">
          Join
        </button>
      </form>
    </div>
  );
}

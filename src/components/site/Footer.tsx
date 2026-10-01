import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { articleService, categoryService } from "@/services/articleService";
import { SocialFollowLinks } from "@/components/site/SocialFollowLinks";

export function Footer() {
  const { data: categories = [] } = useQuery({
    queryKey: ["footer-categories"],
    queryFn: categoryService.list,
    staleTime: 60_000,
  });
  const { data: latestResponse } = useQuery({
    queryKey: ["footer-latest"],
    queryFn: () => articleService.listPublished({ limit: 4 }),
    staleTime: 60_000,
  });
  const latestArticles = latestResponse?.data ?? [];

  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-5">
        <div>
          <img
            src="/logo.png"
            alt="Entertainment Trends"
            className="mb-3 h-12 w-12 object-contain"
          />
          <div className="display text-2xl font-black uppercase">
            Entertainment <span className="text-yellow">Trends</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            The pulse of pop culture — celebrity, TV, music, style, royals, and sport.
          </p>
        </div>
        <div>
          <div className="eyebrow mb-3">Sections</div>
          <ul className="space-y-1 text-sm">
            {categories.map((category) => (
              <li key={category.id}>
                <Link to="/category/$slug" params={{ slug: category.slug }}>
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="eyebrow mb-3">Pages</div>
          <ul className="space-y-1 text-sm">
            <li>
              <Link to="/contact">Contact Us</Link>
            </li>
            <li>
              <Link to="/privacy-policy">Privacy Policy</Link>
            </li>
          </ul>
        </div>
        <div>
          <div className="eyebrow mb-3">Latest</div>
          <ul className="space-y-2 text-sm">
            {latestArticles.map((article) => (
              <li key={article.id}>
                <Link to="/article/$slug" params={{ slug: article.slug }} className="line-clamp-2">
                  {article.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="eyebrow mb-3">Follow</div>
          <SocialFollowLinks />
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Entertainment Trends. All rights reserved.
      </div>
    </footer>
  );
}

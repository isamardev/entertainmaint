// Client-side article/category service. Reads use RLS-safe public policies.
import { supabase } from "@/integrations/supabase/client";

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
};

export type Article = {
  id: string;
  slug: string;
  title: string;
  dek: string | null;
  body: string;
  hero_image_hd: string | null;
  hero_image_lq: string | null;
  hero_caption: string | null;
  category_id: string | null;
  author_id: string | null;
  status: "draft" | "published" | "archived";
  is_breaking: boolean;
  is_featured: boolean;
  view_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  category?: Category | null;
};

const REMOVED_SLUGS = new Set(["summer-movie-preview"]);

function withoutRemoved<T extends { slug: string }>(articles: T[]): T[] {
  return articles.filter((a) => !REMOVED_SLUGS.has(a.slug));
}

// Dummy data
const DUMMY_CATEGORIES: Category[] = [
  { id: "cat-1", name: "Celebrity", slug: "celebrity", description: null, sort_order: 1 },
  { id: "cat-2", name: "Movies & TV", slug: "movies-tv", description: null, sort_order: 2 },
  { id: "cat-3", name: "Music", slug: "music", description: null, sort_order: 3 },
  { id: "cat-4", name: "Style", slug: "style", description: null, sort_order: 4 },
  { id: "cat-5", name: "Royals", slug: "royals", description: null, sort_order: 5 },
  { id: "cat-6", name: "Sports", slug: "sports", description: null, sort_order: 6 },
];

const DUMMY_ARTICLES: Article[] = [
  {
    id: "art-1",
    slug: "celebrity-spotlight-a-list-event",
    title: "A-Listers Turn Out For Star-Studded Premiere",
    dek: "Hollywood's biggest names walked the red carpet last night for the year's most anticipated film premiere.",
    body: `Hollywood Boulevard was abuzz last night as A-list celebrities arrived for the world premiere of the summer's biggest blockbuster. Stars arrived in style, showcasing the latest fashion trends on the red carpet. The evening was filled with laughter, excitement, and plenty of photo opportunities as fans lined the streets to catch a glimpse of their favorite actors.

The film, which has been in production for over two years, is already generating massive buzz among critics and fans alike. With an all-star cast and a compelling storyline, it's set to be one of the biggest hits of the year.

After the screening, the cast and crew attended an exclusive after-party where they celebrated the successful premiere. The party featured live music, gourmet food, and plenty of champagne as guests toasted to the film's success.

Stay tuned for more updates on this exciting new release as it hits theaters worldwide next month.`,
    hero_image_hd: "https://picsum.photos/seed/celebrity-red-carpet/1200/800",
    hero_image_lq: "https://picsum.photos/seed/celebrity-red-carpet/600/400",
    hero_caption: null,
    category_id: "cat-1",
    author_id: null,
    status: "published",
    is_breaking: true,
    is_featured: true,
    view_count: 15200,
    published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    category: DUMMY_CATEGORIES[0],
  },
  {
    id: "art-2",
    slug: "new-series-breaks-streaming-records",
    title: "New Streaming Series Shatters Records In First Week",
    dek: "The latest original series from the world's biggest streaming platform has broken all viewing records.",
    body: `A new streaming series has taken the world by storm, breaking all previous viewing records in its first week of release. The show, which combines thrilling drama with stunning visuals, has captivated audiences around the globe.

Viewers have been raving about the incredible performances from the cast, the gripping storyline, and the high production values. Social media has been buzzing with discussions about the show, with fans sharing their favorite moments and theories about what might happen next.

The streaming platform has already announced that a second season is in development, much to the delight of fans worldwide. Production is set to begin later this year, with the entire cast returning to reprise their roles.

If you haven't watched it yet, now is the perfect time to dive into this incredible series that everyone is talking about.`,
    hero_image_hd: "https://picsum.photos/seed/movie-theater/1200/800",
    hero_image_lq: "https://picsum.photos/seed/movie-theater/600/400",
    hero_caption: null,
    category_id: "cat-2",
    author_id: null,
    status: "published",
    is_breaking: false,
    is_featured: false,
    view_count: 12500,
    published_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    category: DUMMY_CATEGORIES[1],
  },
  {
    id: "art-3",
    slug: "chart-topping-artist-announces-world-tour",
    title: "Global Superstar Announces Massive World Tour",
    dek: "The biggest name in music is hitting the road with a world tour that will cover 50 cities across 6 continents.",
    body: `Music fans around the world are celebrating today as the biggest artist on the planet announced an epic world tour that will visit 50 cities across 6 continents. The tour, which kicks off later this year, promises to be one of the most spectacular live shows ever seen.

Tickets go on sale next week, and fans are already preparing for what is expected to be one of the fastest-selling tours in history. The artist has promised a brand-new stage production, a setlist packed with all their biggest hits, and a few surprises along the way.

The tour announcement comes hot on the heels of the artist's latest album, which has been dominating the charts since its release last month. The album has already spawned multiple number-one singles and shows no signs of slowing down.

Make sure you get your tickets early – this is one show you won't want to miss!`,
    hero_image_hd: "https://picsum.photos/seed/concert-stage/1200/800",
    hero_image_lq: "https://picsum.photos/seed/concert-stage/600/400",
    hero_caption: null,
    category_id: "cat-3",
    author_id: null,
    status: "published",
    is_breaking: true,
    is_featured: false,
    view_count: 18000,
    published_at: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
    category: DUMMY_CATEGORIES[2],
  },
  {
    id: "art-4",
    slug: "fashion-week-highlights-top-trends",
    title: "Fashion Week Reveals Hottest Trends For The Season",
    dek: "The world's top fashion designers have unveiled their latest collections at Fashion Week.",
    body: `Fashion Week has come to a close, and the style world is buzzing about the incredible collections unveiled by the world's top designers. From bold colors and dramatic silhouettes to minimalist elegance, this season's trends offer something for everyone.

The week kicked off with stunning shows from established houses, showcasing everything from luxurious evening wear to casual daytime looks. Emerging designers also made their mark, presenting fresh and innovative designs that have critics talking.

Key trends for the season include oversized outerwear, vibrant prints, sustainable materials, and a return to bold accessories. Whether you prefer classic elegance or cutting-edge style, there's plenty of inspiration to be found in this season's collections.

Start planning your wardrobe update now – these trends are too good to miss!`,
    hero_image_hd: "https://picsum.photos/seed/fashion-runway/1200/800",
    hero_image_lq: "https://picsum.photos/seed/fashion-runway/600/400",
    hero_caption: null,
    category_id: "cat-4",
    author_id: null,
    status: "published",
    is_breaking: false,
    is_featured: false,
    view_count: 9800,
    published_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    category: DUMMY_CATEGORIES[3],
  },
  {
    id: "art-5",
    slug: "royal-family-attends-charity-gala",
    title: "Royal Family Makes Glamorous Appearance At Charity Gala",
    dek: "Members of the royal family attended a star-studded charity gala last night to raise funds for important causes.",
    body: `The royal family stepped out in style last night for a glamorous charity gala that raised millions for important causes. The event, which took place at a historic venue, brought together celebrities, philanthropists, and members of the public all united in support of worthy organizations.

The evening featured a dinner, live auction, and performances from world-renowned artists. Members of the royal family gave speeches highlighting the importance of the causes being supported and thanked everyone for their generosity.

The gala was a tremendous success, exceeding all fundraising goals. The funds raised will go towards supporting education, healthcare, and community initiatives both locally and around the world.

It was truly a night to remember, filled with elegance, generosity, and hope for the future.`,
    hero_image_hd: "https://picsum.photos/seed/royal-gala/1200/800",
    hero_image_lq: "https://picsum.photos/seed/royal-gala/600/400",
    hero_caption: null,
    category_id: "cat-5",
    author_id: null,
    status: "published",
    is_breaking: false,
    is_featured: false,
    view_count: 11200,
    published_at: new Date(Date.now() - 60 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 60 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 60 * 60 * 60 * 1000).toISOString(),
    category: DUMMY_CATEGORIES[4],
  },
  {
    id: "art-6",
    slug: "championship-final-thriller",
    title: "Underdog Team Wins Championship In Stunning Upset",
    dek: "In a game for the ages, the underdog team came from behind to win the championship in a thrilling final.",
    body: `Sports history was made last night as the underdog team pulled off one of the greatest upsets in championship history. Trailing by a significant margin at halftime, the team staged an incredible comeback in the second half to win the game in dramatic fashion.

Fans in the stadium and around the world watched in awe as the team scored the winning points in the final seconds of the game. The celebration that followed was one for the ages, with players, coaches, and fans all sharing in the incredible moment.

This victory marks the team's first championship in decades and cements their place in sports history. The players have already promised that this is just the beginning and that they'll be back next season to defend their title.

Congratulations to the champions – you've earned it!`,
    hero_image_hd: "https://picsum.photos/seed/sports-championship/1200/800",
    hero_image_lq: "https://picsum.photos/seed/sports-championship/600/400",
    hero_caption: null,
    category_id: "cat-6",
    author_id: null,
    status: "published",
    is_breaking: true,
    is_featured: false,
    view_count: 22000,
    published_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    category: DUMMY_CATEGORIES[5],
  },
  {
    id: "art-7",
    slug: "celebrity-interview-exclusive",
    title: "Exclusive: Celebrity Opens Up About New Project",
    dek: "In an exclusive interview, one of Hollywood's biggest stars reveals details about their upcoming project.",
    body: `In an exclusive interview with Entertainme, one of Hollywood's most beloved stars opened up about their exciting new project and what fans can expect.

The actor spoke candidly about the challenges and rewards of taking on such a unique role, and how they prepared for the part. They also shared their thoughts on the current state of the entertainment industry and what they hope to see in the future.

This is one interview you won't want to miss – stay tuned for the full story coming soon!`,
    hero_image_hd: "https://picsum.photos/seed/celebrity-portrait/1200/800",
    hero_image_lq: "https://picsum.photos/seed/celebrity-portrait/600/400",
    hero_caption: null,
    category_id: "cat-1",
    author_id: null,
    status: "published",
    is_breaking: false,
    is_featured: false,
    view_count: 8500,
    published_at: new Date(Date.now() - 80 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 80 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 80 * 60 * 60 * 1000).toISOString(),
    category: DUMMY_CATEGORIES[0],
  },
];

const SELECT = "*, category:categories(id,name,slug,description,sort_order)";

export const articleService = {
  async listPublished(opts: { limit?: number; offset?: number; categorySlug?: string } = {}) {
    try {
      let q = supabase.from("articles").select(SELECT, { count: "exact" })
        .eq("status", "published")
        .order("published_at", { ascending: false });
      if (opts.categorySlug) {
        const { data: cat } = await supabase.from("categories").select("id").eq("slug", opts.categorySlug).single();
        if (cat) q = q.eq("category_id", cat.id);
      }
      const from = opts.offset ?? 0;
      const to = from + (opts.limit ?? 20) - 1;
      q = q.range(from, to);
      const { data, error, count } = await q;
      if (error || !data || data.length === 0) throw new Error("No data");
      return { data: withoutRemoved((data ?? []) as unknown as Article[]), count: count ?? 0 };
    } catch (e) {
      // Fallback to dummy data
      let filtered = withoutRemoved([...DUMMY_ARTICLES]);
      if (opts.categorySlug) {
        filtered = filtered.filter(a => a.category?.slug === opts.categorySlug);
      }
      const limit = opts.limit ?? 20;
      const offset = opts.offset ?? 0;
      return {
        data: filtered.slice(offset, offset + limit),
        count: filtered.length,
      };
    }
  },

  async getBySlug(slug: string) {
    if (REMOVED_SLUGS.has(slug)) return null;
    try {
      const { data, error } = await supabase.from("articles").select(SELECT).eq("slug", slug).maybeSingle();
      if (error || !data) throw new Error("Not found");
      return data as unknown as Article | null;
    } catch (e) {
      return DUMMY_ARTICLES.find(a => a.slug === slug) ?? null;
    }
  },

  async listBreaking() {
    try {
      const { data } = await supabase.from("articles").select("id,slug,title,is_breaking")
        .eq("status", "published").eq("is_breaking", true)
        .order("published_at", { ascending: false }).limit(6);
      if (!data || data.length === 0) throw new Error("No data");
      return withoutRemoved(data ?? []);
    } catch (e) {
      return withoutRemoved(DUMMY_ARTICLES.filter(a => a.is_breaking)).slice(0, 6);
    }
  },

  async listTrending(limit = 6) {
    try {
      const { data } = await supabase.from("articles").select("id,slug,title,view_count,published_at,category:categories(slug,name)")
        .eq("status", "published")
        .order("view_count", { ascending: false })
        .order("published_at", { ascending: false })
        .limit(limit);
      if (!data || data.length === 0) throw new Error("No data");
      return withoutRemoved(data ?? []);
    } catch (e) {
      return withoutRemoved([...DUMMY_ARTICLES].sort((a, b) => b.view_count - a.view_count)).slice(0, limit);
    }
  },

  async search(q: string) {
    try {
      const term = q.trim();
      if (!term) return [];
      const { data, error } = await supabase.from("articles").select(SELECT)
        .eq("status", "published")
        .or(`title.ilike.%${term}%,dek.ilike.%${term}%`)
        .order("published_at", { ascending: false })
        .limit(30);
      if (error || !data || data.length === 0) throw new Error("No data");
      return withoutRemoved((data ?? []) as unknown as Article[]);
    } catch (e) {
      const term = q.trim().toLowerCase();
      if (!term) return [];
      return withoutRemoved(DUMMY_ARTICLES.filter(a => 
        a.title.toLowerCase().includes(term) || 
        (a.dek?.toLowerCase().includes(term))
      ));
    }
  },

  async related(article: Article, limit = 4) {
    try {
      if (!article.category_id) return [];
      const { data } = await supabase.from("articles").select(SELECT)
        .eq("status", "published")
        .eq("category_id", article.category_id)
        .neq("id", article.id)
        .order("published_at", { ascending: false })
        .limit(limit);
      if (!data || data.length === 0) throw new Error("No data");
      return withoutRemoved(data ?? []);
    } catch (e) {
      return withoutRemoved(DUMMY_ARTICLES.filter(a => 
        a.category?.id === article.category_id && a.id !== article.id
      )).slice(0, limit);
    }
  },

  // Admin (RLS-enforced)
  async listAll() {
    try {
      const { data, error } = await supabase.from("articles").select(SELECT)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Article[];
    } catch (e) {
      return DUMMY_ARTICLES;
    }
  },
  async create(input: Partial<Article>) {
    const { data, error } = await supabase.from("articles").insert(input as never).select().single();
    if (error) throw error;
    return data;
  },
  async update(id: string, input: Partial<Article>) {
    const { data, error } = await supabase.from("articles").update(input as never).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },
  async remove(id: string) {
    const { error } = await supabase.from("articles").delete().eq("id", id);
    if (error) throw error;
  },
};

export const categoryService = {
  async list(): Promise<Category[]> {
    try {
      const { data, error } = await supabase.from("categories").select("*").order("sort_order");
      if (error || !data || data.length === 0) throw new Error("No data");
      return data ?? [];
    } catch (e) {
      return DUMMY_CATEGORIES;
    }
  },
  async create(input: Partial<Category>) {
    const { data, error } = await supabase.from("categories").insert(input as never).select().single();
    if (error) throw error;
    return data;
  },
  async remove(id: string) {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) throw error;
  },
};

export const commentService = {
  async listForArticle(articleId: string) {
    try {
      const { data, error } = await supabase.from("comments")
        .select("*, profile:profiles(display_name,avatar_url)")
        .eq("article_id", articleId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    } catch (e) {
      return [];
    }
  },
  async add(articleId: string, userId: string, body: string) {
    const { data, error } = await supabase.from("comments")
      .insert({ article_id: articleId, user_id: userId, body } as never)
      .select().single();
    if (error) throw error;
    return data;
  },
};

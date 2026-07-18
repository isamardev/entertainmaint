// Client-side article/category service using Node.js backend
const API_BASE = "http://localhost:3001/api";

export type Category = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  created_at: string;
};

export type Article = {
  id: number;
  slug: string;
  title: string;
  dek: string | null;
  body: string;
  hero_image_hd: string | null;
  hero_image_lq: string | null;
  hero_caption: string | null;
  category_id: number | null;
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

// Dummy data for fallback
const DUMMY_CATEGORIES: Category[] = [
  { id: 1, name: "Celebrity", slug: "celebrity", description: null, sort_order: 1, created_at: new Date().toISOString() },
  { id: 2, name: "Movies & TV", slug: "movies-tv", description: null, sort_order: 2, created_at: new Date().toISOString() },
  { id: 3, name: "Music", slug: "music", description: null, sort_order: 3, created_at: new Date().toISOString() },
  { id: 4, name: "Style", slug: "style", description: null, sort_order: 4, created_at: new Date().toISOString() },
  { id: 5, name: "Royals", slug: "royals", description: null, sort_order: 5, created_at: new Date().toISOString() },
  { id: 6, name: "Sports", slug: "sports", description: null, sort_order: 6, created_at: new Date().toISOString() },
];

const DUMMY_ARTICLES: Article[] = [
  {
    id: 1,
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
    category_id: 1,
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
];

export const articleService = {
  async listPublished(opts: { limit?: number; offset?: number; categorySlug?: string } = {}) {
    try {
      const params = new URLSearchParams();
      if (opts.limit) params.set("limit", opts.limit.toString());
      if (opts.offset) params.set("offset", opts.offset.toString());
      
      const res = await fetch(`${API_BASE}/articles/published?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      let data = await res.json() as Article[];
      
      if (opts.categorySlug) {
        data = data.filter(a => a.category?.slug === opts.categorySlug);
      }
      
      return { data, count: data.length };
    } catch (e) {
      console.error(e);
      let filtered = [...DUMMY_ARTICLES];
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
    try {
      const res = await fetch(`${API_BASE}/articles/slug/${slug}`);
      if (!res.ok) return null;
      return await res.json() as Article;
    } catch (e) {
      console.error(e);
      return DUMMY_ARTICLES.find(a => a.slug === slug) ?? null;
    }
  },

  async listBreaking() {
    try {
      const res = await fetch(`${API_BASE}/articles/published`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json() as Article[];
      return data.filter(a => a.is_breaking).slice(0, 6);
    } catch (e) {
      console.error(e);
      return DUMMY_ARTICLES.filter(a => a.is_breaking).slice(0, 6);
    }
  },

  async listTrending(limit = 6) {
    try {
      const res = await fetch(`${API_BASE}/articles/published`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json() as Article[];
      return data.sort((a, b) => b.view_count - a.view_count).slice(0, limit);
    } catch (e) {
      console.error(e);
      return [...DUMMY_ARTICLES].sort((a, b) => b.view_count - a.view_count).slice(0, limit);
    }
  },

  async search(q: string) {
    try {
      const term = q.trim().toLowerCase();
      if (!term) return [];
      const res = await fetch(`${API_BASE}/articles/published`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json() as Article[];
      return data.filter(a => 
        a.title.toLowerCase().includes(term) || 
        (a.dek?.toLowerCase().includes(term))
      );
    } catch (e) {
      console.error(e);
      const term = q.trim().toLowerCase();
      if (!term) return [];
      return DUMMY_ARTICLES.filter(a => 
        a.title.toLowerCase().includes(term) || 
        (a.dek?.toLowerCase().includes(term))
      );
    }
  },

  async related(article: Article, limit = 4) {
    try {
      if (!article.category_id) return [];
      const res = await fetch(`${API_BASE}/articles/published`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json() as Article[];
      return data.filter(a => 
        a.category_id === article.category_id && a.id !== article.id
      ).slice(0, limit);
    } catch (e) {
      console.error(e);
      return DUMMY_ARTICLES.filter(a => 
        a.category?.id === article.category_id && a.id !== article.id
      ).slice(0, limit);
    }
  },

  // Admin
  async listAll() {
    try {
      const res = await fetch(`${API_BASE}/articles?includeCategory=true`);
      if (!res.ok) throw new Error("Failed to fetch");
      return await res.json() as Article[];
    } catch (e) {
      console.error(e);
      return DUMMY_ARTICLES;
    }
  },
  async create(input: Partial<Article>) {
    const payload = {
      title: input.title || "",
      slug: input.slug || "",
      dek: input.dek || "",
      body: input.body || "",
      category_id: input.category_id || null,
      author_id: input.author_id || null,
      status: input.status || "draft",
      is_breaking: input.is_breaking || false,
      is_featured: input.is_featured || false,
      view_count: input.view_count || 0,
      published_at: input.published_at || null,
      hero_image_hd: input.hero_image_hd || "",
      hero_image_lq: input.hero_image_lq || "",
      hero_caption: input.hero_caption || "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const res = await fetch(`${API_BASE}/articles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to create");
    return await res.json();
  },
  async update(id: number, input: Partial<Article>) {
    const payload = {
      ...input,
      updated_at: new Date().toISOString(),
    };
    const res = await fetch(`${API_BASE}/articles/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to update");
    return await res.json();
  },
  async remove(id: number) {
    const res = await fetch(`${API_BASE}/articles/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete");
  },
};

export const categoryService = {
  async list(): Promise<Category[]> {
    try {
      const res = await fetch(`${API_BASE}/categories`);
      if (!res.ok) throw new Error("Failed to fetch");
      return await res.json() as Category[];
    } catch (e) {
      console.error(e);
      return DUMMY_CATEGORIES;
    }
  },
  async create(input: Partial<Category>) {
    const res = await fetch(`${API_BASE}/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...input, created_at: new Date().toISOString() }),
    });
    if (!res.ok) throw new Error("Failed to create");
    return await res.json();
  },
  async remove(id: number) {
    const res = await fetch(`${API_BASE}/categories/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete");
  },
};

export const commentService = {
  async listForArticle(articleId: number) {
    // Comments not implemented yet, return empty array
    return [];
  },
  async add(articleId: number, userId: string, body: string) {
    // Comments not implemented yet, return dummy data
    return { id: Date.now(), article_id: articleId, user_id: userId, body, created_at: new Date().toISOString() };
  },
};

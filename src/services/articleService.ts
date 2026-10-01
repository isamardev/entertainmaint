// Client-side article/category service using Node.js backend
import { getApiUrl } from "@/lib/api";
import { safeFetchJson } from "@/lib/safe-fetch";

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
  embed_url: string | null;
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

export const articleService = {
  async listPublished(opts: { limit?: number; offset?: number; categorySlug?: string } = {}) {
    try {
      const params = new URLSearchParams();
      if (opts.limit) params.set("limit", opts.limit.toString());
      if (opts.offset) params.set("offset", opts.offset.toString());

      const result = await safeFetchJson<Article[]>(
        getApiUrl(`/articles/published?${params}`),
      );
      if (!result.ok) {
        return { data: [] as Article[], count: 0 };
      }
      let data = Array.isArray(result.data) ? result.data : [];
      if (opts.categorySlug) {
        data = data.filter((a) => a.category?.slug === opts.categorySlug);
      }
      return { data, count: data.length };
    } catch {
      return { data: [] as Article[], count: 0 };
    }
  },

  async getBySlug(slug: string): Promise<Article | null> {
    try {
      const result = await safeFetchJson<Article>(getApiUrl(`/articles/slug/${slug}`));
      return result.ok ? result.data : null;
    } catch {
      return null;
    }
  },

  async listBreaking(): Promise<Article[]> {
    try {
      const result = await safeFetchJson<Article[]>(getApiUrl("/articles/published"));
      if (!result.ok) return [];
      return (Array.isArray(result.data) ? result.data : []).filter((a) => a.is_breaking).slice(0, 6);
    } catch {
      return [];
    }
  },

  async listTrending(limit = 6): Promise<Article[]> {
    try {
      const result = await safeFetchJson<Article[]>(getApiUrl("/articles/published"));
      if (!result.ok) return [];
      const data = Array.isArray(result.data) ? result.data : [];
      const seenSlugs = new Set<string>();
      return data
        .slice()
        .sort((a, b) => {
          const aTime = a.published_at ? new Date(a.published_at).getTime() : new Date(a.created_at).getTime();
          const bTime = b.published_at ? new Date(b.published_at).getTime() : new Date(b.created_at).getTime();
          if (bTime !== aTime) return bTime - aTime;
          return (b.view_count ?? 0) - (a.view_count ?? 0);
        })
        .filter((a) => {
          const key = (a.slug || `${a.id}`).toLowerCase().trim();
          if (seenSlugs.has(key)) return false;
          seenSlugs.add(key);
          return true;
        })
        .slice(0, limit);
    } catch {
      return [];
    }
  },

  async search(q: string): Promise<Article[]> {
    try {
      const term = q.trim().toLowerCase();
      if (!term) return [];
      const result = await safeFetchJson<Article[]>(getApiUrl("/articles/published"));
      if (!result.ok) return [];
      const data = Array.isArray(result.data) ? result.data : [];
      return data.filter(
        (a) => a.title.toLowerCase().includes(term) || a.dek?.toLowerCase().includes(term),
      );
    } catch {
      return [];
    }
  },

  async related(article: Article, limit = 4): Promise<Article[]> {
    try {
      if (!article.category_id) return [];
      const result = await safeFetchJson<Article[]>(getApiUrl("/articles/published"));
      if (!result.ok) return [];
      const data = Array.isArray(result.data) ? result.data : [];
      return data
        .filter((a) => a.category_id === article.category_id && a.id !== article.id)
        .slice(0, limit);
    } catch {
      return [];
    }
  },

  // Admin
  async listAll(): Promise<Article[]> {
    const result = await safeFetchJson<Article[]>(getApiUrl("/articles?includeCategory=true"));
    if (!result.ok) throw new Error(result.error);
    return Array.isArray(result.data) ? result.data : [];
  },
  async create(input: Partial<Article>) {
    const payload = {
      title: input.title || "",
      slug: input.slug || "",
      dek: input.dek || null,
      body: input.body || "",
      category_id: input.category_id || null,
      author_id: input.author_id || null,
      status: input.status || "draft",
      is_breaking: input.is_breaking || false,
      is_featured: input.is_featured || false,
      view_count: input.view_count || 0,
      published_at: input.published_at || null,
      hero_image_hd: input.hero_image_hd || null,
      hero_image_lq: input.hero_image_lq || null,
      hero_caption: input.hero_caption || null,
      embed_url: input.embed_url || null,
    };
    const result = await safeFetchJson<any>(getApiUrl("/articles"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!result.ok) throw new Error(result.error);
    return result.data;
  },
  async update(id: number, input: Partial<Article>) {
    const payload = { ...input };
    delete payload.created_at;
    delete payload.updated_at;
    delete payload.id;
    const result = await safeFetchJson<any>(getApiUrl(`/articles/${id}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!result.ok) throw new Error(result.error);
    return result.data;
  },
  async remove(id: number) {
    const result = await safeFetchJson<any>(getApiUrl(`/articles/${id}`), { method: "DELETE" });
    if (!result.ok) throw new Error(result.error);
  },
  async delete(id: number) {
    return this.remove(id);
  },
};

export const categoryService = {
  async list(): Promise<Category[]> {
    try {
      const result = await safeFetchJson<Category[]>(getApiUrl("/categories"), {
        cache: "no-store" as RequestCache,
      });
      if (!result.ok) return [];
      return Array.isArray(result.data) ? result.data : [];
    } catch {
      return [];
    }
  },
  async create(input: Partial<Category>) {
    const result = await safeFetchJson<any>(getApiUrl("/categories"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store" as RequestCache,
      body: JSON.stringify({ ...input, created_at: new Date().toISOString() }),
    });
    if (!result.ok) throw new Error(result.error);
    return result.data;
  },
  async update(id: number, input: Partial<Category>) {
    const result = await safeFetchJson<any>(getApiUrl(`/categories/${id}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...input }),
    });
    if (!result.ok) throw new Error(result.error);
    return result.data;
  },
  async remove(id: number) {
    const result = await safeFetchJson<any>(getApiUrl(`/categories/${id}`), {
      method: "DELETE",
    });
    if (!result.ok) throw new Error(result.error);
  },
  async delete(id: number) {
    return this.remove(id);
  },
};

export const commentService = {
  async listForArticle(articleId: number) {
    return [];
  },
  async add(articleId: number, userId: string, body: string) {
    return {
      id: Date.now(),
      article_id: articleId,
      user_id: userId,
      body,
      created_at: new Date().toISOString(),
    };
  },
};

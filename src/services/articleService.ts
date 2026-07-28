// Client-side article/category service using Node.js backend
import { getApiUrl } from "@/lib/api";

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

      const res = await fetch(getApiUrl(`/articles/published?${params}`));
      if (!res.ok) throw new Error("Failed to fetch");
      let data = (await res.json()) as Article[];

      if (opts.categorySlug) {
        data = data.filter((a) => a.category?.slug === opts.categorySlug);
      }

      return { data, count: data.length };
    } catch (e) {
      console.error(e);
      return {
        data: [],
        count: 0,
      };
    }
  },

  async getBySlug(slug: string) {
    try {
      const res = await fetch(getApiUrl(`/articles/slug/${slug}`));
      if (!res.ok) return null;
      return (await res.json()) as Article;
    } catch (e) {
      console.error(e);
      return null;
    }
  },

  async listBreaking() {
    try {
      const res = await fetch(getApiUrl("/articles/published"));
      if (!res.ok) throw new Error("Failed to fetch");
      const data = (await res.json()) as Article[];
      return data.filter((a) => a.is_breaking).slice(0, 6);
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  async listTrending(limit = 6) {
    try {
      const res = await fetch(getApiUrl("/articles/published"));
      if (!res.ok) throw new Error("Failed to fetch");
      const data = (await res.json()) as Article[];
      return data.sort((a, b) => b.view_count - a.view_count).slice(0, limit);
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  async search(q: string) {
    try {
      const term = q.trim().toLowerCase();
      if (!term) return [];
      const res = await fetch(getApiUrl("/articles/published"));
      if (!res.ok) throw new Error("Failed to fetch");
      const data = (await res.json()) as Article[];
      return data.filter(
        (a) => a.title.toLowerCase().includes(term) || a.dek?.toLowerCase().includes(term),
      );
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  async related(article: Article, limit = 4) {
    try {
      if (!article.category_id) return [];
      const res = await fetch(getApiUrl("/articles/published"));
      if (!res.ok) throw new Error("Failed to fetch");
      const data = (await res.json()) as Article[];
      return data
        .filter((a) => a.category_id === article.category_id && a.id !== article.id)
        .slice(0, limit);
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  // Admin
  async listAll() {
    try {
      const res = await fetch(getApiUrl("/articles?includeCategory=true"));
      if (!res.ok) throw new Error("Failed to fetch articles");
      return (await res.json()) as Article[];
    } catch (e) {
      console.error(e);
      throw e; // Re-throw the error instead of falling back
    }
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
    console.log("Creating article with payload:", payload);
    const res = await fetch(getApiUrl("/articles"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    console.log("Backend response status:", res.status);
    if (!res.ok) {
      const errorText = await res.text();
      console.error("Backend error response:", errorText);
      throw new Error(`Failed to create article: ${res.status} - ${errorText}`);
    }
    const result = await res.json();
    console.log("Backend response:", result);
    return result;
  },
  async update(id: number, input: Partial<Article>) {
    const payload = { ...input };
    delete payload.created_at;
    delete payload.updated_at;
    delete payload.id;
    const res = await fetch(getApiUrl(`/articles/${id}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to update article");
    return await res.json();
  },
  async remove(id: number) {
    const res = await fetch(getApiUrl(`/articles/${id}`), {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete article");
  },
  async delete(id: number) {
    return this.remove(id);
  }
};

export const categoryService = {
  async list(): Promise<Category[]> {
    try {
      const res = await fetch(getApiUrl("/categories"));
      if (!res.ok) throw new Error("Failed to fetch");
      return (await res.json()) as Category[];
    } catch (e) {
      console.error(e);
      return [];
    }
  },
  async create(input: Partial<Category>) {
    try {
      const res = await fetch(getApiUrl("/categories"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, created_at: new Date().toISOString() }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error || "Failed to create category");
      }
      return await res.json();
    } catch (e) {
      throw e;
    }
  },
  async update(id: number, input: Partial<Category>) {
    try {
      const res = await fetch(getApiUrl(`/categories/${id}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error || "Failed to update category");
      }
      return await res.json();
    } catch (e) {
      throw e;
    }
  },
  async remove(id: number) {
    try {
      const res = await fetch(getApiUrl(`/categories/${id}`), {
        method: "DELETE",
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error || "Failed to delete category");
      }
    } catch (e) {
      throw e;
    }
  },
  async delete(id: number) {
    return this.remove(id);
  }
};

export const commentService = {
  async listForArticle(articleId: number) {
    // Comments not implemented yet, return empty array
    return [];
  },
  async add(articleId: number, userId: string, body: string) {
    // Comments not implemented yet, return dummy data
    return {
      id: Date.now(),
      article_id: articleId,
      user_id: userId,
      body,
      created_at: new Date().toISOString(),
    };
  },
};

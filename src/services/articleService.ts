// Client-side article/category service using Node.js backend
import { getApiUrl } from "@/lib/api";
import { safeFetchJson } from "@/lib/safe-fetch";
import { SEED_ARTICLES, SEED_CATEGORIES } from "./seedData";

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

const IS_DEV_BUILD = Boolean((import.meta as any).env?.DEV);
const PROD_BACKEND_ORIGIN = "https://aliceblue-goose-490382.hostingersite.com";

export function normalizeMediaUrl(url?: string | null): string {
  if (!url || typeof url !== "string") return "";
  const absolutePrefix = /^https?:\/\/aliceblue-goose-490382\.hostingersite\.com\/api\/uploads\//i;
  if (absolutePrefix.test(url)) {
    if (IS_DEV_BUILD) {
      // Locally dev proxy handles /api/uploads → keep relative
      return url.replace(absolutePrefix, "/api/uploads/");
    }
    // Production: frontend is on a static domain with NO backend proxy.
    // Relative /api/uploads/ 404s. Keep absolute origin URL (backend CORS
    // whitelists the frontend origin).
    return url;
  }
  if (url.startsWith("/api/uploads/")) {
    if (IS_DEV_BUILD) return url;
    return `${PROD_BACKEND_ORIGIN}${url}`;
  }
  return url;
}

export function normalizeArticleMedia(a: Article): Article {
  if (!a) return a;
  const hd = a.hero_image_hd ? normalizeMediaUrl(a.hero_image_hd) : null;
  const lq = a.hero_image_lq ? normalizeMediaUrl(a.hero_image_lq) : null;
  let body = a.body;
  if (
    typeof body === "string" &&
    body.includes("aliceblue-goose-490382.hostingersite.com/api/uploads/")
  ) {
    const abs = /https?:\/\/aliceblue-goose-490382\.hostingersite\.com\/api\/uploads\//gi;
    if (IS_DEV_BUILD) {
      body = body.replace(abs, "/api/uploads/");
    } else {
      // Production: leave absolute URLs unchanged (backend CORS handles it).
      body = body;
    }
  } else if (typeof body === "string" && IS_DEV_BUILD === false) {
    // Body had relative /api/uploads/ — rewrite to absolute origin for prod.
    body = body.replace(/(["'])\/api\/uploads\//gi, `$1${PROD_BACKEND_ORIGIN}/api/uploads/`);
  }
  return {
    ...a,
    hero_image_hd: hd,
    hero_image_lq: lq,
    body: body ?? "",
  };
}

export const articleService = {
  async listPublished(opts: { limit?: number; offset?: number; categorySlug?: string } = {}) {
    try {
      const params = new URLSearchParams();
      if (opts.limit) params.set("limit", opts.limit.toString());
      if (opts.offset) params.set("offset", opts.offset.toString());

      const result = await safeFetchJson<Article[]>(getApiUrl(`/articles/published?${params}`));
      let data =
        result.ok && Array.isArray(result.data) && result.data.length > 0
          ? result.data.map(normalizeArticleMedia)
          : SEED_ARTICLES;

      if (opts.categorySlug) {
        data = data.filter((a) => a.category?.slug === opts.categorySlug);
      }
      if (opts.limit) {
        const offset = opts.offset || 0;
        data = data.slice(offset, offset + opts.limit);
      }
      return { data, count: data.length };
    } catch {
      let data = SEED_ARTICLES;
      if (opts.categorySlug) {
        data = data.filter((a) => a.category?.slug === opts.categorySlug);
      }
      return { data, count: data.length };
    }
  },

  async getBySlug(slug: string): Promise<Article | null> {
    try {
      const result = await safeFetchJson<Article>(getApiUrl(`/articles/slug/${slug}`));
      if (result.ok && result.data) return normalizeArticleMedia(result.data);
      return SEED_ARTICLES.find((a) => a.slug === slug) ?? null;
    } catch {
      return SEED_ARTICLES.find((a) => a.slug === slug) ?? null;
    }
  },

  async listBreaking(): Promise<Article[]> {
    try {
      const result = await safeFetchJson<Article[]>(getApiUrl("/articles/published"));
      const list =
        result.ok && Array.isArray(result.data) && result.data.length > 0
          ? result.data.map(normalizeArticleMedia)
          : SEED_ARTICLES;
      return list.filter((a) => a.is_breaking).slice(0, 6);
    } catch {
      return SEED_ARTICLES.filter((a) => a.is_breaking).slice(0, 6);
    }
  },

  async listTrending(limit = 6): Promise<Article[]> {
    try {
      const result = await safeFetchJson<Article[]>(getApiUrl("/articles/published"));
      const list =
        result.ok && Array.isArray(result.data) && result.data.length > 0
          ? result.data.map(normalizeArticleMedia)
          : SEED_ARTICLES;
      const seenSlugs = new Set<string>();
      return list
        .slice()
        .sort((a, b) => {
          const aTime = a.published_at
            ? new Date(a.published_at).getTime()
            : new Date(a.created_at).getTime();
          const bTime = b.published_at
            ? new Date(b.published_at).getTime()
            : new Date(b.created_at).getTime();
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
      return SEED_ARTICLES.slice(0, limit);
    }
  },

  async search(q: string): Promise<Article[]> {
    try {
      const term = q.trim().toLowerCase();
      if (!term) return [];
      const result = await safeFetchJson<Article[]>(getApiUrl("/articles/published"));
      const data =
        result.ok && Array.isArray(result.data) && result.data.length > 0
          ? result.data.map(normalizeArticleMedia)
          : SEED_ARTICLES;
      return data.filter(
        (a) => a.title.toLowerCase().includes(term) || a.dek?.toLowerCase().includes(term),
      );
    } catch {
      const term = q.trim().toLowerCase();
      return SEED_ARTICLES.filter(
        (a) => a.title.toLowerCase().includes(term) || a.dek?.toLowerCase().includes(term),
      );
    }
  },

  async related(article: Article, limit = 4): Promise<Article[]> {
    try {
      if (!article.category_id) return [];
      const result = await safeFetchJson<Article[]>(getApiUrl("/articles/published"));
      const data =
        result.ok && Array.isArray(result.data) && result.data.length > 0
          ? result.data.map(normalizeArticleMedia)
          : SEED_ARTICLES;
      return data
        .filter((a) => a.category_id === article.category_id && a.id !== article.id)
        .slice(0, limit);
    } catch {
      return SEED_ARTICLES.filter(
        (a) => a.category_id === article.category_id && a.id !== article.id,
      ).slice(0, limit);
    }
  },

  // Admin
  async listAll(): Promise<Article[]> {
    const result = await safeFetchJson<Article[]>(getApiUrl("/articles?includeCategory=true"));
    if (!result.ok) throw new Error(result.error);
    const list = Array.isArray(result.data) ? result.data : [];
    return list.map(normalizeArticleMedia);
  },
  async create(input: Partial<Article>) {
    if (!input.title || !input.title.trim()) {
      throw new Error("Article title is required.");
    }
    if (!input.dek || !input.dek.trim()) {
      throw new Error("Article description (dek) is required.");
    }
    if (!input.category_id) {
      throw new Error("Article category is required.");
    }
    if (!input.hero_image_hd?.trim() && !input.hero_image_lq?.trim()) {
      throw new Error("Article hero image is required.");
    }

    const payload = {
      title: input.title.trim(),
      slug: input.slug || "",
      dek: input.dek.trim(),
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
    if (input.title !== undefined && !input.title.trim()) {
      throw new Error("Article title cannot be empty.");
    }
    if (input.dek !== undefined && !input.dek.trim()) {
      throw new Error("Article description (dek) cannot be empty.");
    }
    if (
      (input.hero_image_hd !== undefined || input.hero_image_lq !== undefined) &&
      !input.hero_image_hd?.trim() &&
      !input.hero_image_lq?.trim()
    ) {
      throw new Error("Article hero image cannot be empty.");
    }

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
      if (result.ok && Array.isArray(result.data) && result.data.length > 0) {
        return result.data;
      }
      return SEED_CATEGORIES;
    } catch {
      return SEED_CATEGORIES;
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

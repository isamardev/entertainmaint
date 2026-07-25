require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const db = require("./models/index.cjs");

// Explicitly import models so Sequelize knows about them
const Category = require("./models/Category.cjs");
const Article = require("./models/Article.cjs");

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${file.originalname.split(".").pop()}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(uploadsDir));

function slugify(value = "") {
  const slug = String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 90);

  return slug || `article-${Date.now()}`;
}

async function getUniqueArticleSlug(input, excludeId = null) {
  const baseSlug = slugify(input);
  let candidate = baseSlug;
  let suffix = 2;

  while (true) {
    const where = excludeId
      ? { slug: candidate, id: { [db.Sequelize.Op.ne]: excludeId } }
      : { slug: candidate };

    const existing = await Article.findOne({ where });
    if (!existing) return candidate;

    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

function buildArticlePayload(body, slug, existingArticle = null) {
  const now = new Date();
  const status = body.status || existingArticle?.status || "draft";
  const publishedAt =
    status === "published"
      ? body.published_at || existingArticle?.published_at || now
      : null;

  return {
    title: body.title || existingArticle?.title || "",
    slug,
    dek: body.dek ?? existingArticle?.dek ?? null,
    body: body.body || existingArticle?.body || "",
    hero_image_hd: body.hero_image_hd ?? existingArticle?.hero_image_hd ?? null,
    hero_image_lq: body.hero_image_lq ?? existingArticle?.hero_image_lq ?? null,
    hero_caption: body.hero_caption ?? existingArticle?.hero_caption ?? null,
    embed_url: body.embed_url ?? existingArticle?.embed_url ?? null,
    category_id: body.category_id || null,
    author_id: body.author_id ?? existingArticle?.author_id ?? null,
    status,
    is_breaking:
      typeof body.is_breaking === "boolean"
        ? body.is_breaking
        : (existingArticle?.is_breaking ?? false),
    is_featured:
      typeof body.is_featured === "boolean"
        ? body.is_featured
        : (existingArticle?.is_featured ?? false),
    view_count:
      body.view_count != null && body.view_count !== ""
        ? Number(body.view_count)
        : (existingArticle?.view_count ?? 0),
    published_at: publishedAt,
    created_at: existingArticle?.created_at || now,
    updated_at: now,
  };
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Categories CRUD
app.get("/api/categories", async (req, res) => {
  try {
    const data = await Category.findAll({ order: [["sort_order", "ASC"]] });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/categories", async (req, res) => {
  try {
    const data = await Category.create(req.body);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/categories/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const existing = await Category.findByPk(id);
    if (!existing) return res.status(404).json({ error: "Category not found" });
    await Category.update(req.body, { where: { id } });
    const updated = await Category.findByPk(id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/categories/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const result = await db.sequelize.transaction(async (t) => {
      const deletedArticles = await Article.destroy({
        where: { category_id: id },
        transaction: t,
      });
      const deletedCategories = await Category.destroy({
        where: { id },
        transaction: t,
      });
      return { deletedArticles, deletedCategories };
    });

    if (!result.deletedCategories) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json({ success: true, deletedArticles: result.deletedArticles });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Articles CRUD
app.get("/api/articles", async (req, res) => {
  try {
    const includeCategory = req.query.includeCategory === "true";
    const options = {
      order: [["created_at", "DESC"]],
      ...(includeCategory && { include: [{ model: Category, as: "category" }] }),
    };
    const data = await Article.findAll(options);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/articles/published", async (req, res) => {
  try {
    const options = {
      where: { status: "published" },
      order: [["published_at", "DESC"]],
      include: [{ model: Category, as: "category" }],
    };
    if (req.query.limit) options.limit = parseInt(req.query.limit);
    if (req.query.offset) options.offset = parseInt(req.query.offset);
    const data = await Article.findAll(options);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/articles/:id", async (req, res) => {
  try {
    const data = await Article.findByPk(req.params.id, {
      include: [{ model: Category, as: "category" }],
    });
    if (!data) return res.status(404).json({ error: "Article not found" });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/articles/slug/:slug", async (req, res) => {
  try {
    const data = await Article.findOne({
      where: { slug: req.params.slug },
      include: [{ model: Category, as: "category" }],
    });
    if (!data) return res.status(404).json({ error: "Article not found" });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/articles", async (req, res) => {
  try {
    const slug = await getUniqueArticleSlug(req.body.slug || req.body.title);
    const payload = buildArticlePayload(req.body, slug);

    console.log("Creating article with data:", payload);
    const data = await Article.create(payload);
    console.log("Created article:", data);
    res.json(data);
  } catch (error) {
    console.error("Error creating article:", error);
    const details = error?.errors?.map((item) => item.message).join(", ");
    res.status(500).json({ error: details || error.message });
  }
});

app.put("/api/articles/:id", async (req, res) => {
  try {
    const existing = await Article.findByPk(req.params.id);
    if (!existing) return res.status(404).json({ error: "Article not found" });

    const slug = await getUniqueArticleSlug(
      req.body.slug || req.body.title || existing.slug,
      existing.id,
    );
    const payload = buildArticlePayload(req.body, slug, existing);

    await existing.update(payload);
    const updated = await Article.findByPk(req.params.id);
    res.json(updated);
  } catch (error) {
    const details = error?.errors?.map((item) => item.message).join(", ");
    res.status(500).json({ error: details || error.message });
  }
});

app.delete("/api/articles/:id", async (req, res) => {
  try {
    await Article.destroy({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Image upload endpoint
app.post("/api/upload", upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const imageUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;
    res.json({ imageUrl: imageUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const startServer = async () => {
  try {
    await db.sequelize.authenticate();
    console.log("Database connected successfully");

    // Auto-create tables - use force: true to drop and recreate (only for development!)
    // or alter: true to update existing tables
    await db.sequelize.sync({ alter: true });
    console.log("Tables synced successfully");

    app.listen(PORT, () => {
      console.log(`Backend server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Error starting server:", error);
  }
};

startServer();

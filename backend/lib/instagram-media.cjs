const https = require("https");
const { URL } = require("url");

const cache = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function extractInstagramShortcode(url) {
  if (!url) return null;
  const m = url.match(/\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/i);
  return m ? m[1] : null;
}

function cleanMediaUrl(raw) {
  if (!raw) return null;
  return raw
    .replaceAll("\\/", "/")
    .replaceAll("\\u00253D", "%3D")
    .replaceAll("\\u00253d", "%3D")
    .replaceAll("u00253D", "%3D")
    .replaceAll("u00253d", "%3D")
    .replaceAll("\\u0026", "&")
    .replaceAll("&amp;", "&")
    .replaceAll("\\", "")
    .trim();
}

function getInstagramMedia(rawUrl) {
  return new Promise((resolve) => {
    try {
      const shortcode = extractInstagramShortcode(rawUrl);
      if (!shortcode) {
        return resolve({ success: false, error: "Invalid Instagram URL" });
      }

      const cached = cache.get(shortcode);
      if (
        cached &&
        Date.now() - cached.timestamp < CACHE_TTL_MS &&
        cached.data &&
        (!cached.data.imageUrl || !cached.data.imageUrl.includes("profile_pic"))
      ) {
        return resolve(cached.data);
      }

      const req = https.get(
        {
          hostname: "www.instagram.com",
          path: `/reel/${shortcode}/embed/`,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            Accept: "*/*",
          },
          timeout: 8000,
        },
        (res) => {
          let data = "";
          res.on("data", (c) => (data += c));
          res.on("end", () => {
            let videoUrl = null;
            let imageUrl = null;

            // 1. Extract video URL if present
            const mp4Idx = data.indexOf(".mp4");
            if (mp4Idx !== -1) {
              const httpIdx = data.lastIndexOf("http", mp4Idx);
              if (httpIdx !== -1) {
                const endIdx = data.indexOf('"', mp4Idx);
                if (endIdx !== -1) {
                  const raw = data.substring(httpIdx, endIdx);
                  videoUrl = cleanMediaUrl(raw);
                }
              }
            }

            // 2. Extract high-res display cover image / video thumbnail
            // Priority A: EmbeddedMediaImage img tag from the Instagram embed HTML
            const embeddedImgMatch =
              data.match(/<img[^>]+class="[^"]*EmbeddedMediaImage[^"]*"[^>]*src="([^"]+)"/i) ||
              data.match(/<img[^>]+src="([^"]+)"[^>]*class="[^"]*EmbeddedMediaImage[^"]*"/i);
            if (embeddedImgMatch && embeddedImgMatch[1]) {
              imageUrl = cleanMediaUrl(embeddedImgMatch[1]);
            }

            // Priority B: display_url in JSON script
            if (!imageUrl) {
              const dIdx = data.indexOf("display_url");
              if (dIdx !== -1) {
                const part = data.substring(dIdx);
                const httpIdx = part.indexOf("http");
                if (httpIdx !== -1) {
                  const endIdx = part.indexOf('"', httpIdx);
                  if (endIdx !== -1) {
                    imageUrl = cleanMediaUrl(part.substring(httpIdx, endIdx));
                  }
                }
              }
            }

            // Priority C: video_default_cover_frame
            if (!imageUrl) {
              const coverIdx = data.indexOf("video_default_cover_frame");
              if (coverIdx !== -1) {
                const part = data.substring(coverIdx);
                const httpIdx = part.indexOf("http");
                if (httpIdx !== -1) {
                  const endIdx = part.indexOf('"', httpIdx);
                  if (endIdx !== -1) {
                    imageUrl = cleanMediaUrl(part.substring(httpIdx, endIdx));
                  }
                }
              }
            }

            // Priority D: any non-profile-pic jpg in the data
            if (!imageUrl) {
              const unescaped = data.replaceAll("\\/", "/");
              const jpgs = unescaped.match(/https:\/\/[^"'\s\\]+\.jpg[^"'\s\\]*/g) || [];
              const validJpg = jpgs.find(
                (u) =>
                  !u.includes("profile_pic") &&
                  !u.includes("s150x150") &&
                  !u.includes("s100x100") &&
                  (u.includes("CLIPS") || u.includes("cover") || u.includes("dst-jpg"))
              );
              if (validJpg) {
                imageUrl = cleanMediaUrl(validJpg);
              }
            }

            const result = {
              success: true,
              shortcode,
              type: videoUrl ? "video" : "image",
              videoUrl,
              imageUrl,
              embedUrl: `https://www.instagram.com/reel/${shortcode}/`,
            };

            cache.set(shortcode, { data: result, timestamp: Date.now() });
            resolve(result);
          });
        }
      );

      req.on("error", (err) => {
        resolve({ success: false, error: err.message });
      });
      req.on("timeout", () => {
        req.destroy();
        resolve({ success: false, error: "Instagram request timeout" });
      });
    } catch (err) {
      resolve({ success: false, error: err.message });
    }
  });
}

function streamInstagramMedia(targetUrl, req, res) {
  try {
    if (!targetUrl || !targetUrl.startsWith("http")) {
      res.writeHead(400, { "Content-Type": "text/plain" });
      return res.end("Invalid media target URL");
    }

    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Accept: "*/*",
    };
    if (req.headers && req.headers.range) {
      headers.Range = req.headers.range;
    }

    const parsed = new URL(targetUrl);
    const options = {
      protocol: parsed.protocol,
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      headers,
    };

    const upstreamReq = https.get(options, (upstreamRes) => {
      const responseHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
        "Access-Control-Allow-Headers": "Range, Accept, Origin",
        "Accept-Ranges": "bytes",
      };

      if (upstreamRes.headers["content-type"]) {
        responseHeaders["Content-Type"] = upstreamRes.headers["content-type"];
      }
      if (upstreamRes.headers["content-length"]) {
        responseHeaders["Content-Length"] = upstreamRes.headers["content-length"];
      }
      if (upstreamRes.headers["content-range"]) {
        responseHeaders["Content-Range"] = upstreamRes.headers["content-range"];
      }

      res.writeHead(upstreamRes.statusCode || 200, responseHeaders);
      upstreamRes.pipe(res);
    });

    upstreamReq.on("error", () => {
      if (!res.headersSent) {
        res.writeHead(502, { "Content-Type": "text/plain" });
        res.end("Bad Gateway streaming Instagram media");
      }
    });

    req.on("close", () => {
      upstreamReq.destroy();
    });
  } catch (err) {
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Internal Server Error: " + err.message);
    }
  }
}

module.exports = {
  extractInstagramShortcode,
  getInstagramMedia,
  streamInstagramMedia,
};

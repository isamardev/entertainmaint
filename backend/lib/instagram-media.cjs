const https = require("https");
const { URL } = require("url");

const cache = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000;

function extractInstagramShortcode(url) {
  if (!url) return null;
  const m = url.match(/\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/i);
  return m ? m[1] : null;
}

function detectPathType(url) {
  if (!url) return "reel";
  if (/\/p\//i.test(url)) return "p";
  if (/\/reels?\//i.test(url)) return "reel";
  if (/\/tv\//i.test(url)) return "tv";
  return "reel";
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

function httpsGetWithRedirects(options, maxRedirects = 3) {
  return new Promise((resolve, reject) => {
    let redirectsLeft = maxRedirects;
    const makeRequest = (currentOpts) => {
      const req = https.get(currentOpts, (res) => {
        const status = res.statusCode || 0;
        if ((status === 301 || status === 302 || status === 303 || status === 307 || status === 308) && redirectsLeft > 0) {
          redirectsLeft -= 1;
          const location = res.headers.location;
          res.resume();
          if (!location) {
            return reject(new Error("Redirect without location"));
          }
          try {
            let nextUrl;
            if (location.startsWith("http://") || location.startsWith("https://")) {
              nextUrl = new URL(location);
            } else {
              nextUrl = new URL(location, `https://${currentOpts.hostname}${currentOpts.path}`);
            }
            const nextOpts = {
              hostname: nextUrl.hostname,
              path: nextUrl.pathname + nextUrl.search,
              headers: currentOpts.headers,
              timeout: currentOpts.timeout || 8000,
            };
            return makeRequest(nextOpts);
          } catch (e) {
            return reject(e);
          }
        }
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => resolve({ status, body: data, headers: res.headers }));
      });
      req.on("error", (err) => reject(err));
      req.on("timeout", () => {
        req.destroy();
        reject(new Error("Instagram request timeout"));
      });
    };
    makeRequest(options);
  });
}

function parseEmbedHtml(data) {
  let videoUrl = null;
  let imageUrl = null;
  let caption = null;
  let likes = null;
  let comments = null;
  let username = null;
  let profilePicUrl = null;
  let dimensions = null;

  if (!data || data.length < 200) {
    return { videoUrl: null, imageUrl: null, isLoginWall: true };
  }

  const isLoginWall =
    /\/accounts\/login/i.test(data) ||
    /login-machine/i.test(data) ||
    /"__typename"\s*:\s*"PolarisLoginPage"/i.test(data) ||
    /content="Instagram".*?login/i.test(data.slice(0, 4000));

  // 1. Video URL: search for escaped or unescaped video_url / .mp4
  const vMatch = data.match(/\\"[vV]ideo_url\\":\\"((?:\\\\.|[^\\])+?)\\"/) ||
    data.match(/"[vV]ideo_url":"([^"]+)"/);
  if (vMatch) {
    videoUrl = cleanMediaUrl(vMatch[1]);
  }

  if (!videoUrl) {
    const mp4Idx = data.indexOf(".mp4");
    if (mp4Idx !== -1) {
      const httpIdx = data.lastIndexOf("http", mp4Idx);
      if (httpIdx !== -1) {
        const endIdx = data.indexOf('"', mp4Idx);
        const endIdx2 = data.indexOf("'", mp4Idx);
        let end = endIdx;
        if (endIdx2 !== -1 && (endIdx === -1 || endIdx2 < endIdx)) end = endIdx2;
        if (end !== -1) {
          const raw = data.substring(httpIdx, end);
          videoUrl = cleanMediaUrl(raw);
        }
      }
    }
  }

  if (!videoUrl) {
    const ogVideo = data.match(/<meta[^>]+property=["']og:video["'][^>]+content=["']([^"']+)["']/i) ||
      data.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:video["']/i);
    if (ogVideo && ogVideo[1]) videoUrl = cleanMediaUrl(ogVideo[1]);
  }

  // 2. Image / poster URL
  const dMatch = data.match(/\\"display_url\\":\\"((?:\\\\.|[^\\])+?)\\"/) ||
    data.match(/"display_url":"([^"]+)"/);
  if (dMatch) {
    imageUrl = cleanMediaUrl(dMatch[1]);
  }

  if (!imageUrl) {
    const embeddedImgMatch =
      data.match(/<img[^>]+class="[^"]*EmbeddedMediaImage[^"]*"[^>]*src="([^"]+)"/i) ||
      data.match(/<img[^>]+src="([^"]+)"[^>]*class="[^"]*EmbeddedMediaImage[^"]*"/i);
    if (embeddedImgMatch && embeddedImgMatch[1]) {
      imageUrl = cleanMediaUrl(embeddedImgMatch[1]);
    }
  }

  if (!imageUrl) {
    const ogImage = data.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      data.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    if (ogImage && ogImage[1]) imageUrl = cleanMediaUrl(ogImage[1]);
  }

  if (!imageUrl) {
    const coverIdx = data.indexOf("video_default_cover_frame");
    if (coverIdx !== -1) {
      const part = data.substring(coverIdx, coverIdx + 4000);
      const httpIdx = part.indexOf("http");
      if (httpIdx !== -1) {
        const endIdx = part.indexOf('"', httpIdx);
        if (endIdx !== -1) {
          imageUrl = cleanMediaUrl(part.substring(httpIdx, endIdx));
        }
      }
    }
  }

  // 3. Caption text
  const capIdx = data.indexOf("edge_media_to_caption");
  if (capIdx !== -1) {
    const capPart = data.substring(capIdx, capIdx + 3000);
    const mCap = capPart.match(/"text\\":\\"(.*?)\\"/) || capPart.match(/"text":"(.*?)"/);
    if (mCap && mCap[1]) {
      try {
        const unescaped = mCap[1].replace(/\\\\u/g, "\\u").replace(/\\\\n/g, "\n");
        caption = JSON.parse(`"${unescaped}"`);
      } catch {
        caption = mCap[1].replaceAll("\\n", "\n").replaceAll('\\"', '"');
      }
    }
  }

  // 4. Like & Comment counts
  const likeMatch = data.match(/\\"edge_liked_by\\":\{\\"count\\":(\d+)\}/) ||
    data.match(/"edge_liked_by":\{"count":(\d+)\}/);
  if (likeMatch) {
    likes = parseInt(likeMatch[1], 10);
  }

  const commMatch = data.match(/\\"edge_media_to_comment\\":\{\\"count\\":(\d+)\}/) ||
    data.match(/"edge_media_to_comment":\{"count":(\d+)\}/);
  if (commMatch) {
    comments = parseInt(commMatch[1], 10);
  }

  // 5. Creator username & profile pic
  const ownerNameMatch = data.match(/\\"owner\\":\{[^\}]*\\"username\\":\\"([^"\\]+)\\"/) ||
    data.match(/"owner":\{[^\}]*"username":"([^"]+)"/);
  if (ownerNameMatch) {
    username = ownerNameMatch[1];
  }

  const ownerPicMatch = data.match(/\\"profile_pic_url\\":\\"((?:\\\\.|[^\\])+?)\\"/) ||
    data.match(/"profile_pic_url":"([^"]+)"/);
  if (ownerPicMatch) {
    profilePicUrl = cleanMediaUrl(ownerPicMatch[1]);
  }

  // 6. Dimensions and aspect ratio
  const dimMatch = data.match(/\\"dimensions\\":\{\\"height\\":(\d+),\\"width\\":(\d+)\}/) ||
    data.match(/"dimensions":\{"height":(\d+),"width":(\d+)\}/);
  if (dimMatch) {
    const width = parseInt(dimMatch[2], 10);
    const height = parseInt(dimMatch[1], 10);
    dimensions = { width, height };
  }

  return {
    videoUrl,
    imageUrl,
    caption,
    likes,
    comments,
    username,
    profilePicUrl,
    dimensions,
    isLoginWall,
  };
}

function getInstagramMedia(rawUrl) {
  return new Promise(async (resolve) => {
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
        (cached.data.videoUrl || cached.data.imageUrl)
      ) {
        return resolve(cached.data);
      }

      // Candidate paths: captioned embed endpoints provide full metadata and SSR tags
      const pathCandidates = [
        `/p/${shortcode}/embed/captioned/`,
        `/reel/${shortcode}/embed/captioned/`,
        `/p/${shortcode}/embed/`,
        `/reel/${shortcode}/embed/`,
      ];

      // Use curl user-agent to receive full SSR data from Instagram without client-side React block
      const userAgents = [
        "curl/7.88.1",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
      ];

      let finalResult = {
        videoUrl: null,
        imageUrl: null,
        caption: null,
        likes: null,
        comments: null,
        username: null,
        profilePicUrl: null,
        dimensions: null,
        isLoginWall: false,
      };
      let successRequest = false;

      for (const ua of userAgents) {
        for (const path of pathCandidates) {
          try {
            const opts = {
              hostname: "www.instagram.com",
              path,
              headers: {
                "User-Agent": ua,
                Accept: "*/*",
                "Accept-Language": "en-US,en;q=0.9",
              },
              timeout: 7000,
            };
            const res = await httpsGetWithRedirects(opts, 4);
            if (!res || !res.body || res.status >= 400) continue;
            const parsed = parseEmbedHtml(res.body);
            if (parsed.isLoginWall && !parsed.videoUrl && !parsed.imageUrl) continue;

            if (parsed.videoUrl || parsed.imageUrl) {
              finalResult = parsed;
              successRequest = true;
              break;
            }
          } catch (_e) {
            // continue next candidate
          }
        }
        if (successRequest) break;
      }

      const isLandscape =
        finalResult.dimensions &&
        finalResult.dimensions.width > finalResult.dimensions.height;

      const result = {
        success: successRequest || !!(finalResult.videoUrl || finalResult.imageUrl),
        shortcode,
        type: finalResult.videoUrl ? "video" : "image",
        videoUrl: finalResult.videoUrl,
        imageUrl: finalResult.imageUrl,
        caption: finalResult.caption,
        likes: finalResult.likes,
        comments: finalResult.comments,
        username: finalResult.username,
        profilePicUrl: finalResult.profilePicUrl,
        dimensions: finalResult.dimensions,
        isLandscape: !!isLandscape,
        aspectRatio:
          finalResult.dimensions && finalResult.dimensions.height > 0
            ? finalResult.dimensions.width / finalResult.dimensions.height
            : null,
        embedUrl: `https://www.instagram.com/p/${shortcode}/`,
      };

      if (result.success) {
        cache.set(shortcode, { data: result, timestamp: Date.now() });
      } else {
        cache.set(shortcode, {
          data: { ...result, success: false, error: "Could not extract Instagram media" },
          timestamp: Date.now() - CACHE_TTL_MS + 5 * 60 * 1000,
        });
      }
      resolve(result);
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
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
      Accept: "*/*",
      "Accept-Language": "en-US,en;q=0.9",
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

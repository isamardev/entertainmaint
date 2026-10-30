import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const url = new URL(request.url);

      // Fast-path: Instagram media extraction and streaming proxy
      if (url.pathname === "/api/media/instagram" || url.pathname === "/api/instagram") {
        let targetUrl = url.searchParams.get("url");
        if (!targetUrl && request.method === "POST") {
          try {
            const body = await request.clone().json();
            if (body && typeof body.url === "string") targetUrl = body.url;
          } catch {}
        }
        if (!targetUrl) {
          return new Response(JSON.stringify({ success: false, error: "Missing url parameter" }), {
            status: 400,
            headers: { "content-type": "application/json", "access-control-allow-origin": "*" },
          });
        }
        const shortcodeMatch = targetUrl.match(/\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/i);
        const shortcode = shortcodeMatch ? shortcodeMatch[1] : null;
        if (shortcode) {
          try {
            const https = (await import("node:https")).default;
            const fastResult = await new Promise<{
              type: "video" | "carousel";
              videoUrl?: string;
              poster?: string;
            }>((resolve) => {
              const req = https.get(
                `https://www.instagram.com/p/${shortcode}/embed/captioned/`,
                { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }, timeout: 4000 },
                (res) => {
                  let html = "";
                  res.on("data", (c) => (html += c));
                  res.on("end", () => {
                    const idx = html.indexOf("video_url");
                    if (idx === -1) return resolve({ type: "carousel" });
                    const mp4Idx = html.indexOf(".mp4", idx);
                    if (mp4Idx === -1) return resolve({ type: "carousel" });
                    const raw = html.slice(idx + 'video_url\\":\\"'.length, mp4Idx + 4);
                    const clean = raw.replace(/\\\//g, "/").replace(/\\\\/g, "").replace(/^["\\]+|["\\]+$/g, "");
                    const afterIdx = mp4Idx + 4;
                    const endQuoteIdx = html.indexOf('\\"', afterIdx);
                    const after = html.slice(afterIdx, endQuoteIdx);
                    const cleanAfter = after.replace(/\\u0026/g, "&").replace(/\\u00253D/g, "%3D").replace(/\\\//g, "/").replace(/\\\\/g, "").replace(/^["\\]+|["\\]+$/g, "");
                    const full = "https://" + clean.split("https://").pop() + cleanAfter;

                    let poster: string | undefined = undefined;
                    const imgIdx = html.indexOf("display_url");
                    if (imgIdx !== -1) {
                      const endImg = html.indexOf('\\"', imgIdx + 15);
                      poster = html.slice(imgIdx + 14, endImg).replace(/\\\//g, "/").replace(/\\u0026/g, "&");
                    }
                    resolve({ type: "video", videoUrl: full, poster });
                  });
                },
              );
              req.on("error", () => resolve({ type: "carousel" }));
              req.on("timeout", () => {
                req.destroy();
                resolve({ type: "carousel" });
              });
            });

            if (fastResult.type === "video" && fastResult.videoUrl) {
              const proxiedVideo = `/api/media/instagram/stream?url=${encodeURIComponent(fastResult.videoUrl)}`;
              return new Response(
                JSON.stringify({
                  success: true,
                  type: "video",
                  videoUrl: proxiedVideo,
                  rawVideoUrl: fastResult.videoUrl,
                  imageUrl: fastResult.poster,
                  shortcode,
                }),
                {
                  status: 200,
                  headers: { "content-type": "application/json", "access-control-allow-origin": "*" },
                },
              );
            }
          } catch (fastErr) {
            console.warn("[ssr-fast-instagram] error:", fastErr);
          }
        }

        try {
          const { createRequire } = await import("node:module");
          const requireLocal = createRequire(import.meta.url);
          const instagramModules = requireLocal("../backend/lib/instagram-media.cjs");
          if (instagramModules?.getInstagramMedia) {
            const result = await instagramModules.getInstagramMedia(targetUrl);
            if (result && result.success) {
              const proxiedVideo = result.videoUrl
                ? `/api/media/instagram/stream?url=${encodeURIComponent(result.videoUrl)}`
                : null;
              const proxiedImage = result.imageUrl
                ? `/api/media/instagram/image?url=${encodeURIComponent(result.imageUrl)}`
                : null;
              return new Response(
                JSON.stringify({
                  ...result,
                  mediaUrl: proxiedVideo || proxiedImage || result.videoUrl || result.imageUrl,
                  videoUrl: proxiedVideo,
                  imageUrl: proxiedImage,
                  rawVideoUrl: result.videoUrl,
                  rawImageUrl: result.imageUrl,
                }),
                {
                  status: 200,
                  headers: { "content-type": "application/json", "access-control-allow-origin": "*" },
                },
              );
            }
          }
        } catch (igErr) {
          console.warn("[ssr-instagram-media] local handler error, falling back to upstream:", igErr);
        }
      }

      if (
        url.pathname === "/api/media/instagram/stream" ||
        url.pathname === "/api/media/instagram/image" ||
        url.pathname === "/api/instagram/stream" ||
        url.pathname === "/api/instagram/image"
      ) {
        const streamTarget = url.searchParams.get("url");
        if (streamTarget && streamTarget.startsWith("http")) {
          try {
            const streamHeaders = new Headers();
            streamHeaders.set(
              "User-Agent",
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
            );
            streamHeaders.set("Accept", "*/*");
            const range = request.headers.get("range");
            if (range) streamHeaders.set("range", range);
            const streamRes = await fetch(streamTarget, { headers: streamHeaders });
            const respHeaders = new Headers(streamRes.headers);
            respHeaders.set("access-control-allow-origin", "*");
            respHeaders.set("accept-ranges", "bytes");
            return new Response(streamRes.body, {
              status: streamRes.status,
              headers: respHeaders,
            });
          } catch (streamErr) {
            console.warn("[ssr-instagram-stream] error streaming media:", streamErr);
          }
        }
      }

      if (url.pathname.startsWith("/api/")) {
        try {
          const targetUrl = `https://aliceblue-goose-490382.hostingersite.com${url.pathname}${url.search}`;
          const headers = new Headers(request.headers);
          headers.set("host", "aliceblue-goose-490382.hostingersite.com");
          headers.set("origin", "https://entertainment-trends.com");
          headers.set("referer", "https://entertainment-trends.com/");
          // Prevent upstream compression from leaking decoded bodies with encoding headers
          headers.delete("accept-encoding");
          const upstreamRes = await fetch(targetUrl, {
            method: request.method,
            headers,
            body: request.method !== "GET" && request.method !== "HEAD" ? request.body : undefined,
            duplex: "half",
          } as any);

          const responseHeaders = new Headers(upstreamRes.headers);
          responseHeaders.delete("content-encoding");
          responseHeaders.delete("content-length");
          responseHeaders.delete("transfer-encoding");
          responseHeaders.set("access-control-allow-origin", "*");

          return new Response(upstreamRes.body, {
            status: upstreamRes.status,
            statusText: upstreamRes.statusText,
            headers: responseHeaders,
          });
        } catch (apiErr) {
          console.warn("Upstream API fetch failed:", apiErr);
          return new Response(
            JSON.stringify({ error: "Upstream API temporarily unavailable" }),
            {
              status: 503,
              headers: { "content-type": "application/json" },
            },
          );
        }
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};

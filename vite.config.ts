// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { createRequire } from "module";
const requireFromRoot = createRequire(import.meta.url);

export default defineConfig({
  nitro: { preset: "node-server" },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [
      {
        name: "instagram-media-dev-proxy",
        configureServer(server) {
          // Dev-only require — avoids breaking production builds that don't include backend/
          let instagramModules: any = null;
          try {
            instagramModules = requireFromRoot("./backend/lib/instagram-media.cjs");
          } catch {
            server.config.logger.warn(
              "[instagram-media-dev-proxy] backend/lib/instagram-media.cjs not found — dev proxy disabled. Production backend handles these routes."
            );
          }

          server.middlewares.use(async (req, res, next) => {
            if (!instagramModules) return next();
            const { getInstagramMedia, streamInstagramMedia } = instagramModules;
            const urlObj = new URL(req.url || "", "http://localhost:3000");
            if (urlObj.pathname === "/api/media/instagram") {
              const url = urlObj.searchParams.get("url");
              if (!url) {
                res.writeHead(400, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ success: false, error: "Missing url" }));
              }
              try {
                const result = await getInstagramMedia(url);
                res.writeHead(200, {
                  "Content-Type": "application/json",
                  "Access-Control-Allow-Origin": "*",
                });
                return res.end(
                  JSON.stringify({
                    ...result,
                    videoUrl: result.videoUrl
                      ? `/api/media/instagram/stream?url=${encodeURIComponent(result.videoUrl)}`
                      : null,
                    imageUrl: result.imageUrl
                      ? `/api/media/instagram/image?url=${encodeURIComponent(result.imageUrl)}`
                      : null,
                    rawVideoUrl: result.videoUrl,
                    rawImageUrl: result.imageUrl,
                  })
                );
              } catch (err) {
                res.writeHead(500, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ success: false, error: err.message }));
              }
            }
            if (
              urlObj.pathname === "/api/media/instagram/stream" ||
              urlObj.pathname === "/api/media/instagram/image"
            ) {
              const targetUrl = urlObj.searchParams.get("url");
              return streamInstagramMedia(targetUrl, req, res);
            }
            next();
          });
        },
      },
    ],
    server: {
      host: "0.0.0.0",
      port: 3000,
      proxy: {
        "/api": {
          target: "https://aliceblue-goose-490382.hostingersite.com",
          changeOrigin: true,
          secure: false,
          headers: {
            Origin: "https://entertainment-trends.com",
            Referer: "https://entertainment-trends.com/",
          },
        },
      },
    },
  },
});

const fs = require("node:fs");
const path = require("node:path");

const projectRoot = process.cwd();
const publicDir = path.join(projectRoot, ".output", "public");
const assetsDir = path.join(publicDir, "assets");
const outDir = path.join(projectRoot, "build");

if (!fs.existsSync(publicDir) || !fs.existsSync(assetsDir)) {
  console.error("Missing .output/public. Run `npm run build` first.");
  process.exit(1);
}

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const copyDir = (src, dest) => {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
};

copyDir(publicDir, outDir);

const assetFiles = fs.readdirSync(path.join(outDir, "assets"));
const entryJs =
  assetFiles.find((f) => /^index-.*\.js$/i.test(f)) || assetFiles.find((f) => /\.js$/i.test(f));

if (!entryJs) {
  console.error("Could not find JS entry in build/assets");
  process.exit(1);
}

const cssFiles = assetFiles.filter((f) => /\.css$/i.test(f));
const cssLinks = cssFiles.map((f) => `    <link rel="stylesheet" href="./assets/${f}">`).join("\n");

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
${cssLinks ? cssLinks + "\n" : ""}    <link rel="icon" href="./favicon.ico">
    <title>Entertainment Trends</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./assets/${entryJs}"></script>
  </body>
</html>
`;

fs.writeFileSync(path.join(outDir, "index.html"), html);

const htaccess = `RewriteEngine On
RewriteBase /

# ----------- API PROXY TO BACKEND -----------
# Route /api/* and /api/media/instagram requests to the standalone backend
# (Hostinger Node.js app). This keeps frontend on entertainment-trends.com using
# SAME-ORIGIN /api URLs — which means zero CORS preflight, zero CORB, no mixed
# content warnings, and shared backend uploads (/api/uploads/*) resolve correctly.
SSLProxyEngine On
ProxyPreserveHost Off
ProxyRequests Off

# /api/media sub-route (Instagram direct media scraper + stream)
<IfModule mod_proxy.c>
  ProxyPass        /api https://aliceblue-goose-490382.hostingersite.com/api connectiontimeout=15 timeout=60
  ProxyPassReverse /api https://aliceblue-goose-490382.hostingersite.com/api

  # Ensure incoming Origin header reflects the public frontend domain so the
  # Node.js backend CORS whitelist accepts it.
  RequestHeader set Origin "https://entertainment-trends.com"
  RequestHeader set Referer "https://entertainment-trends.com/"
  RequestHeader unset X-Forwarded-Host
</IfModule>

# ----------- SPA FALLBACK -----------
# For any URL that is NOT /api/* and NOT a real file/dir, serve index.html
RewriteRule ^index\\.html$ - [L]
RewriteCond %{REQUEST_URI} !^/api [NC]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
`;

fs.writeFileSync(path.join(outDir, ".htaccess"), htaccess);

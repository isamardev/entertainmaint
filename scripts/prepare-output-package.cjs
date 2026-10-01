const fs = require("node:fs");
const path = require("node:path");

const outputDir = path.join(process.cwd(), ".output");
const pkgPath = path.join(outputDir, "package.json");

const serverPkgPath = path.join(outputDir, "server", "package.json");
const serverPkg = fs.existsSync(serverPkgPath)
  ? JSON.parse(fs.readFileSync(serverPkgPath, "utf8"))
  : null;

const pkg = fs.existsSync(pkgPath) ? JSON.parse(fs.readFileSync(pkgPath, "utf8")) : {};

pkg.private = true;
pkg.type = "module";
pkg.main = "./server/index.mjs";
pkg.scripts = {
  ...(pkg.scripts ?? {}),
  build: "node -e \"console.log('build skipped: using prebuilt .output')\"",
  start: "node ./server/index.mjs",
};
pkg.engines = {
  ...(pkg.engines ?? {}),
  node: ">=18",
};
pkg.dependencies = {
  ...(serverPkg?.dependencies ?? {}),
  ...(pkg.dependencies ?? {}),
};

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

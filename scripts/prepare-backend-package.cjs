const fs = require("node:fs");
const path = require("node:path");

const rootPkgPath = path.join(process.cwd(), "package.json");
const backendDir = path.join(process.cwd(), "backend");
const backendPkgPath = path.join(backendDir, "package.json");

if (!fs.existsSync(rootPkgPath) || !fs.existsSync(backendDir)) {
  process.exit(0);
}

const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, "utf8"));
const existingBackendPkg = fs.existsSync(backendPkgPath)
  ? JSON.parse(fs.readFileSync(backendPkgPath, "utf8"))
  : null;

const pickVersion = (name) =>
  existingBackendPkg?.dependencies?.[name] ??
  rootPkg.dependencies?.[name] ??
  rootPkg.devDependencies?.[name];

const deps = [
  "cors",
  "dotenv",
  "express",
  "multer",
  "mysql2",
  "pg",
  "pg-hstore",
  "sequelize",
  "sequelize-auto",
];

const backendPkg = {
  name: "entertainmaint-backend",
  private: true,
  type: "commonjs",
  scripts: {
    build: "node -e \"console.log('build skipped: backend has no build step')\"",
    start: "node server.js",
  },
  engines: {
    node: ">=18",
  },
  dependencies: {},
};

for (const dep of deps) {
  const version = pickVersion(dep);
  if (version) backendPkg.dependencies[dep] = version;
}

fs.writeFileSync(backendPkgPath, JSON.stringify(backendPkg, null, 2) + "\n");

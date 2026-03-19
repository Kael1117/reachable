const { mkdirSync, writeFileSync } = require("node:fs");
const path = require("node:path");

const distDir = path.join(__dirname, "..", "dist");
mkdirSync(distDir, { recursive: true });
writeFileSync(path.join(distDir, "package.json"), JSON.stringify({ type: "commonjs" }, null, 2));

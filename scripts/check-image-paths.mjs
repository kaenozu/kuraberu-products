#!/usr/bin/env node
/**
 * Build-time assertion: verify every imagePath and comparison-v2 image reference
 * maps to an actual file in src/assets/products/.
 *
 * This catches typos and missing images at build time instead of producing
 * silent 404s or runtime throws deep inside Astro rendering.
 *
 * Usage:
 *   node scripts/check-image-paths.mjs          # verify only
 *   node scripts/check-image-paths.mjs --delete  # delete orphaned images
 * Exit 1 if any image path is missing.
 */
import fs from "node:fs";
import path from "node:path";

const DELETE_MODE = process.argv.includes("--delete");

const ASSETS_DIR = path.resolve("src/assets/products");
const ARTICLE_DIR = path.resolve("src/content/articles");
const COMPARISON_V2_DIR = path.resolve("src/content/articles/comparison-v2");

const availableFiles = new Set(fs.readdirSync(ASSETS_DIR));

const errors = [];

/* ── 1. Collect imagePath from individual article files ── */
for (const file of fs.readdirSync(ARTICLE_DIR)) {
  if (
    !file.endsWith(".ts") ||
    file === "index.ts" ||
    file === "types.ts" ||
    file === "commercial.ts"
  )
    continue;
  const text = fs.readFileSync(path.join(ARTICLE_DIR, file), "utf8");
  for (const match of text.matchAll(
    /(?:imagePath|image):\s*["'`]([^"'`]+)["'`]/g,
  )) {
    const imgPath = match[1];
    if (imgPath.startsWith("http")) continue; // external URL, skip
    const filename = imgPath.replace(/^\/products\//, "");
    if (!availableFiles.has(filename)) {
      errors.push(
        `${file}: imagePath "${imgPath}" → file not found in src/assets/products/`,
      );
    }
  }
}

/* ── 2. Collect image from comparison-v2 files ── */
for (const file of fs.readdirSync(COMPARISON_V2_DIR)) {
  if (!file.endsWith(".ts") || file === "_base.ts" || file === "index.ts")
    continue;
  const text = fs.readFileSync(path.join(COMPARISON_V2_DIR, file), "utf8");
  for (const match of text.matchAll(/image:\s*["'`]([^"'`]+)["'`]/g)) {
    const imgPath = match[1];
    if (!imgPath || imgPath.startsWith("http")) continue; // external URL or empty
    const filename = imgPath.replace(/^\/products\//, "");
    if (!availableFiles.has(filename)) {
      errors.push(
        `comparison-v2/${file}: image "${imgPath}" → file not found in src/assets/products/`,
      );
    }
  }
}

/* ── 3. Collect leftImage/rightImage from commercial seeds ── */
const commercialText = fs.readFileSync(
  path.join(ARTICLE_DIR, "commercial.ts"),
  "utf8",
);
for (const match of commercialText.matchAll(
  /(?:leftImage|rightImage):\s*["'`]([^"'`]+)["'`]/g,
)) {
  const imgPath = match[1];
  if (imgPath.startsWith("http")) continue;
  const filename = imgPath.replace(/^\/products\//, "");
  if (!availableFiles.has(filename)) {
    errors.push(
      `commercial.ts: ${match[0].split(":")[0]} "${imgPath}" → file not found in src/assets/products/`,
    );
  }
}

/* ── 4. Collect all referenced images (for orphan detection) ── */
const referencedFiles = new Set();
const collectRef = (imgPath) => {
  if (imgPath && !imgPath.startsWith("http")) {
    referencedFiles.add(imgPath.replace(/^\/products\//, ""));
  }
};

for (const file of fs.readdirSync(ARTICLE_DIR)) {
  if (!file.endsWith(".ts") || file === "index.ts" || file === "types.ts")
    continue;
  const text = fs.readFileSync(path.join(ARTICLE_DIR, file), "utf8");
  for (const match of text.matchAll(
    /(?:imagePath|leftImage|rightImage|image):\s*["'`]([^"'`]+)["'`]/g,
  )) {
    collectRef(match[1]);
  }
}
for (const file of fs.readdirSync(COMPARISON_V2_DIR)) {
  if (!file.endsWith(".ts") || file === "_base.ts" || file === "index.ts")
    continue;
  const text = fs.readFileSync(path.join(COMPARISON_V2_DIR, file), "utf8");
  for (const match of text.matchAll(/image:\s*["'`]([^"'`]+)["'`]/g)) {
    collectRef(match[1]);
  }
}
// Also scan commercialArticleImages map (key: "id", value: {left, right})
for (const match of commercialText.matchAll(/\"\/(?:products\/[^\"]+)\"/g)) {
  collectRef(match[0].replace(/"/g, ""));
}
// Scan left/right image paths in seed entries (e.g., left: "/products/...")
for (const match of commercialText.matchAll(
  /(?:^|\s)(?:left|right):\s*["'`]([^"'`]+)["'`]/gm,
)) {
  collectRef(match[1]);
}
// Scan src/pages/articles/ for image references in hand-written pages
const PAGES_DIR = path.resolve("src/pages/articles");
for (const dir of fs.readdirSync(PAGES_DIR, { withFileTypes: true })) {
  if (!dir.isDirectory() || dir.name === "index") continue;
  const pageFile = path.join(PAGES_DIR, dir.name, "index.astro");
  if (!fs.existsSync(pageFile)) continue;
  const text = fs.readFileSync(pageFile, "utf8");
  // Skip one-liner pages (only import + component call)
  if (text.split("\n").filter((l) => l.trim()).length < 10) continue;
  // Match image: "/products/..." or image: '/products/...'
  for (const match of text.matchAll(
    /image:\s*["'`][\/]?products\/([^"'`]+)["'`]/g,
  )) {
    collectRef(`/products/${match[1]}`);
  }
  // Match const xImage = '/products/...'
  for (const match of text.matchAll(
    /(?:const\s+\w+\s*=\s*)["'`][\/]?products\/([^"'`]+)["'`]/g,
  )) {
    collectRef(`/products/${match[1]}`);
  }
  // Match imagePath: "/products/..."
  for (const match of text.matchAll(
    /imagePath:\s*["'`][\/]?products\/([^"'`]+)["'`]/g,
  )) {
    collectRef(`/products/${match[1]}`);
  }
}

const orphans = [...availableFiles].filter((f) => !referencedFiles.has(f));

if (DELETE_MODE && orphans.length > 0) {
  console.log(`\nDeleting ${orphans.length} orphaned image(s)...\n`);
  let deleted = 0;
  for (const orphan of orphans) {
    const filePath = path.join(ASSETS_DIR, orphan);
    try {
      fs.unlinkSync(filePath);
      console.log(`  deleted ${orphan}`);
      deleted++;
    } catch (err) {
      console.error(`  FAILED to delete ${orphan}: ${err.message}`);
    }
  }
  console.log(`\n✔ Deleted ${deleted}/${orphans.length} orphaned image(s)`);
} else {
  for (const orphan of orphans) {
    console.warn(
      `WARN: orphaned image — src/assets/products/${orphan} is not referenced by any article`,
    );
  }
}

/* ── Report ── */
if (errors.length > 0) {
  console.error(`\n✖ ${errors.length} image path error(s):\n`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}

const remaining = fs.readdirSync(ASSETS_DIR).length;
console.log(
  `✔ All image paths verified (${referencedFiles.size} referenced, ${remaining} files on disk, ${orphans.length - (DELETE_MODE ? orphans.length : 0)} orphaned)`,
);

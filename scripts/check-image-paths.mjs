#!/usr/bin/env node
/**
 * Build-time assertion: verify every imagePath and comparison-v2 image reference
 * maps to an actual file in src/assets/products/.
 *
 * This catches typos and missing images at build time instead of producing
 * silent 404s or runtime throws deep inside Astro rendering.
 *
 * Usage: node scripts/check-image-paths.mjs
 * Exit 1 if any image path is missing.
 */
import fs from "node:fs";
import path from "node:path";

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
  for (const match of text.matchAll(/imagePath:\s*["'`]([^"'`]+)["'`]/g)) {
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

/* ── 4. Check for orphaned image files (in assets but not referenced) ── */
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
    /(?:imagePath|leftImage|rightImage):\s*["'`]([^"'`]+)["'`]/g,
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

const orphans = [...availableFiles].filter((f) => !referencedFiles.has(f));
for (const orphan of orphans) {
  console.warn(
    `WARN: orphaned image — src/assets/products/${orphan} is not referenced by any article`,
  );
}

/* ── Report ── */
if (errors.length > 0) {
  console.error(`\n✖ ${errors.length} image path error(s):\n`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}

console.log(
  `✔ All image paths verified (${referencedFiles.size} referenced, ${availableFiles.size} files on disk, ${orphans.length} orphaned)`,
);

#!/usr/bin/env node
/**
 * scripts/find-missing-article-pairs.mjs
 *
 * 診断カテゴリの商品ペアから未記事の組み合わせを検出し、
 * メタデータドラフトを自動生成する。
 *
 * 使い方:
 *   node scripts/find-missing-article-pairs.mjs [--output-dir .acceptance/missing-pairs]
 */

import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const PRODUCTS_DIR = "src/data/products";
const ARTICLES_DIR = "src/content/articles";

function extractString(body, key) {
  const re = new RegExp(key + ':\\s*["\u0027]([^"\u0027]+)["\u0027]');
  const m = body.match(re);
  return m ? m[1] : null;
}

function extractStringArray(body, key) {
  const re = new RegExp(key + ":\\s*\\[([^\\]]*)\\]");
  const m = body.match(re);
  if (!m) return [];
  return [...m[1].matchAll(/["\u0027]([^"\u0027]+)["\u0027]/g)].map(
    (x) => x[1],
  );
}

function extractKeywords(name) {
  return name
    .split(/[\s\u3000]+/)
    .filter((w) => w.length >= 2)
    .map((w) => w.toLowerCase());
}

function extractShortName(product) {
  const m = product.name.match(/([A-Z]{1,10}[-\s]?\d{2,5}[A-Z0-9-]*)/i);
  return m ? product.brand + " " + m[1] : product.brand;
}

function readDiagnosisProducts() {
  const files = readdirSync(PRODUCTS_DIR).filter(
    (f) => f.endsWith(".ts") && f !== "index.ts",
  );
  const products = [];
  for (const file of files) {
    const src = readFileSync(path.join(PRODUCTS_DIR, file), "utf8");
    const re = /export\s+const\s+(\w+):\s*Product\s*=\s*\{([\s\S]*?)\n\};/g;
    for (const match of src.matchAll(re)) {
      const b = match[2];
      const id = extractString(b, "id");
      const categoryId = extractString(b, "categoryId");
      const brand = extractString(b, "brand");
      const name = extractString(b, "name");
      if (id && categoryId && brand && name) {
        products.push({
          id,
          categoryId,
          brand,
          name,
          tags: extractStringArray(b, "tags"),
          articleUrls: extractStringArray(b, "articleUrls"),
        });
      }
    }
  }
  return products;
}

function readExistingArticles() {
  const files = readdirSync(ARTICLES_DIR).filter(
    (f) =>
      f.endsWith(".ts") &&
      f !== "index.ts" &&
      f !== "types.ts" &&
      f !== "commercial.ts",
  );
  const articles = [];
  for (const file of files) {
    const src = readFileSync(path.join(ARTICLES_DIR, file), "utf8");
    const m = src.match(
      /defineArticleMetadata\s*\(\s*\{([\s\S]*?)\n\s*\}\s*\)/,
    );
    if (!m) continue;
    const b = m[1];
    const id = extractString(b, "id");
    const p = extractString(b, "path");
    const title = extractString(b, "title");
    if (id && p) articles.push({ id, path: p, title, sourceFile: file });
  }
  return articles;
}

function generatePairs(products) {
  const pairs = [];
  for (let i = 0; i < products.length; i++) {
    for (let j = i + 1; j < products.length; j++) {
      if (products[i].categoryId === products[j].categoryId) {
        pairs.push([products[i], products[j]]);
      }
    }
  }
  return pairs;
}

function isPairCovered(pair, existingArticles) {
  const [a, b] = pair;
  const paths = new Set(existingArticles.map((x) => x.path));
  for (const u1 of a.articleUrls) {
    for (const u2 of b.articleUrls) {
      if (u1 === u2 && paths.has(u1)) return { covered: true, path: u1 };
    }
  }
  const kw1 = extractKeywords(a.name);
  const kw2 = extractKeywords(b.name);
  for (const art of existingArticles) {
    const t = art.title.toLowerCase();
    if (kw1.some((k) => t.includes(k)) && kw2.some((k) => t.includes(k)))
      return { covered: true, path: art.path };
  }
  return { covered: false };
}

function generateDraft(pair) {
  const [a, b] = pair;
  const id = a.id + "-vs-" + b.id;
  const dp = "/articles/" + id + "/";
  const sA = extractShortName(a);
  const sB = extractShortName(b);
  const title = sA + "と" + sB + "、どっち？｜くらべる商品メモ";
  const headline = sA + "と" + sB + "を比較";
  const desc = a.name + "と" + b.name + "の違いを公式情報で比較";
  const cats = {
    "baby-bottle": "育児",
    diaper: "育児",
    "water-bottle": "生活雑貨",
    "hair-dryer": "美容家電",
    "rice-cooker": "キッチン家電",
  };
  const cat = cats[a.categoryId] || "未分類";
  const tags = [...new Set([...a.tags, ...b.tags])].slice(0, 5);
  const tagStr = tags.map((t) => '"' + t + '"').join(", ");
  const esc = (s) => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

  return [
    'import { defineArticleMetadata } from "../types";',
    "",
    "export const " +
      id.replace(/-/g, "") +
      "Article = defineArticleMetadata({",
    '  id: "' + id + '",',
    "  productCount: 2,",
    '  path: "' + dp + '",',
    '  title: "' + esc(title) + '",',
    '  headline: "' + esc(headline) + '",',
    '  description: "' + esc(desc) + '",',
    '  category: "' + cat + '",',
    "  tags: [" + tagStr + "],",
    '  audiences: ["' + esc(sA) + "と" + esc(sB) + 'の違いを知りたい人"],',
    '  uses: ["比較して選びたい"],',
    '  summary: "' + esc(desc) + '",',
    '  publishedAt: "",',
    '  modifiedAt: "",',
    '  productInfoCheckedAt: "",',
    '  purchaseLinkStatus: "placeholder",',
    '  imagePath: "",',
    "  changeLog: [",
    "    {",
    '      date: "",',
    '      summary: "自動生成ドラフト。手動で仕様を確認・修正すること。",',
    "    },",
    "  ],",
    "});",
    "",
  ].join("\n");
}

function main() {
  const args = process.argv.slice(2);
  let outputDir = ".acceptance/missing-pairs";
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--output-dir" && args[i + 1]) outputDir = args[++i];
  }

  console.log("Reading diagnosis products...");
  const products = readDiagnosisProducts();
  console.log("  Found " + products.length + " products");

  console.log("Reading existing articles...");
  const articles = readExistingArticles();
  console.log("  Found " + articles.length + " articles");

  const byCat = new Map();
  for (const p of products) {
    if (!byCat.has(p.categoryId)) byCat.set(p.categoryId, []);
    byCat.get(p.categoryId).push(p);
  }

  console.log("\nGenerating pairs and checking coverage...");
  const missing = [];
  const covered = [];

  for (const [catId, catProds] of byCat) {
    const pairs = generatePairs(catProds);
    console.log("  " + catId + ": " + pairs.length + " pairs");
    for (const pair of pairs) {
      const r = isPairCovered(pair, articles);
      if (r.covered) covered.push({ pair, articlePath: r.path });
      else missing.push({ pair, categoryId: catId });
    }
  }

  console.log("\nCovered: " + covered.length + " pairs");
  console.log("Missing: " + missing.length + " pairs");

  if (missing.length === 0) {
    console.log("\nAll pairs covered! No drafts needed.");
    return;
  }

  mkdirSync(outputDir, { recursive: true });

  console.log("\nGenerating drafts...");
  for (const { pair } of missing) {
    const draftId = pair[0].id + "-vs-" + pair[1].id;
    const fp = path.join(outputDir, draftId + ".ts");
    writeFileSync(fp, generateDraft(pair), "utf8");
    console.log("  " + fp);
  }

  const lines = [
    "# Missing Article Pairs Report",
    "",
    "Generated: " + new Date().toISOString(),
    "",
    "## Covered",
    "",
    ...covered.map(
      (c) =>
        "- " +
        c.pair[0].brand +
        " " +
        c.pair[0].name +
        " vs " +
        c.pair[1].brand +
        " " +
        c.pair[1].name +
        " → " +
        c.articlePath,
    ),
    "",
    "## Missing",
    "",
    ...missing.map(
      (m) =>
        "- " +
        m.pair[0].brand +
        " " +
        m.pair[0].name +
        " vs " +
        m.pair[1].brand +
        " " +
        m.pair[1].name,
    ),
    "",
    "Generated " + missing.length + " draft(s) in " + outputDir + "/",
  ];
  writeFileSync(path.join(outputDir, "REPORT.md"), lines.join("\n"), "utf8");
  console.log("\nReport: " + outputDir + "/REPORT.md");
}

main();

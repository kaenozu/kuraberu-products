/**
 * scripts/export-articles-to-json.mjs
 * 既存の articles.ts から JSON データファイルを生成する。
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const ARTICLES_TS = "src/content/articles.ts";

function extractString(block, field) {
  const re = new RegExp(field + ':\\s*"([^"]*)"');
  const m = block.match(re);
  return m ? m[1] : null;
}

function extractArray(block, field) {
  const re = new RegExp(field + ":\\s*\\[([^\\]]*)\\]");
  const m = block.match(re);
  if (!m) return [];
  const items = [];
  const itemRe = /"([^"]+)"/g;
  let im;
  while ((im = itemRe.exec(m[1])) !== null) items.push(im[1]);
  return items;
}

function extractNumber(block, field) {
  const re = new RegExp(field + ":\\s*(\\d+)");
  const m = block.match(re);
  return m ? Number.parseInt(m[1], 10) : null;
}

function main() {
  const content = readFileSync(ARTICLES_TS, "utf8");

  const ids = [];
  const idRe = /^\s+id:\s+"([^"]+)"/gm;
  let match;
  while ((match = idRe.exec(content)) !== null) ids.push(match[1]);

  console.log(`Found ${ids.length} articles`);

  const articles = [];
  for (const id of ids) {
    const needle = `id: "${id}"`;
    const start = content.indexOf(needle);
    if (start === -1) continue;
    const blockStart = content.lastIndexOf("defineArticleMetadata({", start);
    const nextArticle = content.indexOf("defineArticleMetadata({", blockStart + 25);
    const block = content.substring(blockStart, nextArticle !== -1 ? nextArticle : content.length);

    articles.push({
      id,
      productCount: extractNumber(block, "productCount"),
      path: extractString(block, "path"),
      title: extractString(block, "title"),
      headline: extractString(block, "headline"),
      description: extractString(block, "description"),
      category: extractString(block, "category"),
      tags: extractArray(block, "tags"),
      audiences: extractArray(block, "audiences"),
      uses: extractArray(block, "uses"),
      summary: extractString(block, "summary"),
      publishedAt: extractString(block, "publishedAt"),
      modifiedAt: extractString(block, "modifiedAt"),
      productInfoCheckedAt: extractString(block, "productInfoCheckedAt"),
      purchaseLinkStatus: extractString(block, "purchaseLinkStatus"),
      imagePath: extractString(block, "imagePath"),
    });
  }

  mkdirSync("data", { recursive: true });
  const output = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    count: articles.length,
    articles,
  };
  writeFileSync("data/articles.json", JSON.stringify(output, null, 2) + "\n");
  console.log(`Exported to data/articles.json`);

  const cats = {};
  for (const a of articles) cats[a.category] = (cats[a.category] || 0) + 1;
  console.log("\nCategories:");
  for (const [c, n] of Object.entries(cats).sort((a, b) => b[1] - a[1]))
    console.log(`  ${c}: ${n}`);
  const v = articles.filter((a) => a.purchaseLinkStatus === "verified").length;
  console.log(`\nPurchase: ${v} verified, ${articles.length - v} unverified`);
}

main();

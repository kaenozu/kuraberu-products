/**
 * scripts/check-articles-json-consistency.mjs
 *
 * data/articles.json と src/content/articles.ts の整合性を検証する。
 * JSON が TS の真のデータソースと一致していることを保証する。
 *
 * 使い方:
 *   node scripts/check-articles-json-consistency.mjs
 */
import { readFileSync } from "node:fs";

const ARTICLES_TS = "src/content/articles.ts";
const ARTICLES_JSON = "data/articles.json";

function extractIdsFromTs(content) {
  const ids = [];
  const re = /^\s+id:\s+"([^"]+)"/gm;
  let m;
  while ((m = re.exec(content)) !== null) ids.push(m[1]);
  return ids;
}

function main() {
  const tsContent = readFileSync(ARTICLES_TS, "utf8");
  const jsonData = JSON.parse(readFileSync(ARTICLES_JSON, "utf8"));

  const tsIds = extractIdsFromTs(tsContent);
  const jsonIds = jsonData.articles.map((a) => a.id);

  const issues = [];

  // Check count
  if (tsIds.length !== jsonIds.length) {
    issues.push(`Count mismatch: TS=${tsIds.length}, JSON=${jsonIds.length}`);
  }

  // Check for missing in JSON
  const jsonIdSet = new Set(jsonIds);
  for (const id of tsIds) {
    if (!jsonIdSet.has(id)) {
      issues.push(`Missing in JSON: ${id}`);
    }
  }

  // Check for extra in JSON
  const tsIdSet = new Set(tsIds);
  for (const id of jsonIds) {
    if (!tsIdSet.has(id)) {
      issues.push(`Extra in JSON (not in TS): ${id}`);
    }
  }

  // Check key fields for each article
  for (const article of jsonData.articles) {
    if (!article.title) issues.push(`${article.id}: missing title`);
    if (!article.category) issues.push(`${article.id}: missing category`);
    if (!article.path) issues.push(`${article.id}: missing path`);
    if (!article.purchaseLinkStatus) issues.push(`${article.id}: missing purchaseLinkStatus`);
  }

  if (issues.length > 0) {
    console.error("❌ Consistency check FAILED:");
    for (const issue of issues) console.error(`  - ${issue}`);
    process.exit(1);
  } else {
    console.log(`✅ ${tsIds.length} articles: TS and JSON are consistent`);
  }
}

main();

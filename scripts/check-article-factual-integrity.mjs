/**
 * scripts/check-article-factual-integrity.mjs
 * 公開記事の事実整合性を機械検証する (Issue #353)。
 */
import { readFileSync } from "node:fs";

const ARTICLES_FILE = "src/content/articles.ts";

const MISCLASSIFICATION_CHECKS = [
  {
    articleId: "panasonic-nt-t501-vs-nt-d700",
    forbidden: "オーブンレンジ",
    message: "NT-T501/NT-D700 はオーブントースター（オーブンレンジではない）",
  },
];

const INCOMPLETE_PATTERNS = [/購入先の確認中/g, /公開後に.*表示されます/g];

function extractArticleIds(content) {
  const ids = [];
  const re = /^\s+id:\s+"([^"]+)"/gm;
  let m;
  while ((m = re.exec(content)) !== null) ids.push(m[1]);
  return ids;
}

function extractArticleBlock(content, articleId) {
  const needle = `id: "${articleId}"`;
  const start = content.indexOf(needle);
  if (start === -1) return null;
  const before = content.lastIndexOf("defineArticleMetadata({", start);
  if (before === -1) return null;
  const next = content.indexOf("defineArticleMetadata({", before + 25);
  return content.substring(before, next !== -1 ? next : content.length);
}

function main() {
  const content = readFileSync(ARTICLES_FILE, "utf8");
  const articles = extractArticleIds(content);
  console.log(
    `Checking ${articles.length} articles for factual integrity...\n`,
  );

  const issues = [];
  let checked = 0;

  for (const id of articles) {
    const block = extractArticleBlock(content, id);
    if (!block) {
      console.warn(`  ⚠ Could not extract: ${id}`);
      continue;
    }
    checked++;

    for (const c of MISCLASSIFICATION_CHECKS) {
      if (c.articleId === id && block.includes(c.forbidden))
        issues.push({ severity: "BLOCKER", articleId: id, message: c.message });
    }

    for (const pat of INCOMPLETE_PATTERNS) {
      const am = block.match(/audiences:\s*\[([^\]]+)\]/);
      const sm = block.match(/summary:\s*"([^"]+)"/);
      for (const f of [am?.[1], sm?.[1]].filter(Boolean)) {
        if (pat.test(f))
          issues.push({
            severity: "BLOCKER",
            articleId: id,
            message: `未完成状態の文言が残存: "${pat.source}"`,
          });
      }
    }
  }

  console.log(`Checked ${checked} articles.`);
  if (issues.length > 0) {
    for (const i of issues)
      console.error(`  ❌ [${i.severity}] ${i.articleId}: ${i.message}`);
    console.error(`\n${issues.length} issue(s) found.`);
    process.exit(1);
  } else {
    console.log("✅ No factual integrity issues found.");
  }
}

main();

/**
 * scripts/check-price-claims.mjs
 *
 * 未確認の価格・在庫断定ゲート（warn-first）。
 * 記事系ソース（src/pages, src/content, src/data）から「○○円」「在庫あり」等の
 * 断定的な表示を探し、同じ行に確認コンテキスト（確認日・公式・変動注意など）が
 * なければ警告する。確立した表記ルール:
 * - 価格は「2026-08-10確認」「○○時点の確認」「公式○○表示価格」等と併記する
 * - 在庫は断定せず「販売ページで確認してください」へ倒す
 *
 * ロールアウト方針（warn-first、check-source-relevancy と同じ）:
 * - 違反があっても通常は exit 0（警告のみ）
 * - STRICT_PRICE_CLAIMS=1 または --strict のときだけ exit 1
 *
 * 使い方:
 *   node scripts/check-price-claims.mjs check [--strict]
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const TARGET_DIRS = ["pages", "content", "data"];
const TARGET_EXTENSIONS = new Set([".astro", ".ts"]);

const PRICE_RE = /[0-9][0-9,]*円/g;
const STOCK_ASSERTION_RE = /在庫あり|在庫僅少|在庫切れ|売り切れ|完売|入荷/g;

// 同じ行にあれば「確認コンテキストあり」とみなす語彙。
// （確立した慣行: 確認日・公式表示・変動注意・販売ページ誘導）
const CONFIRMATION_CONTEXT_RE =
  /確認|時点|公式|目安|変動|販売|可能性|注意|キャンペーン/;

// 誤検知除外: フォームの placeholder 例示など、表示価格の主張ではない行。
const EXCLUDED_LINE_RE = /placeholder\s*=/;

export function classifyLine(line, previousLines = []) {
  PRICE_RE.lastIndex = 0;
  STOCK_ASSERTION_RE.lastIndex = 0;
  const hasPrice = PRICE_RE.test(line);
  const hasStock = STOCK_ASSERTION_RE.test(line);
  if (!hasPrice && !hasStock) return null;
  if (EXCLUDED_LINE_RE.test(line)) return null;
  if (CONFIRMATION_CONTEXT_RE.test(line)) return null;
  // ブロック対応: 比較表の {label, left, right} 構造では確認日が label 行に
  // 書かれる慣行のため、直前3行まで確認コンテキストを探す。
  // （例: label: "公式ショップ価格（2026-08-10確認）" + left: "27,280円〜。"、
  //  right の値が次行に折り返す変種も含む）
  const context = previousLines.slice(-3).join("\n");
  if (context && CONFIRMATION_CONTEXT_RE.test(context)) return null;
  return { hasPrice, hasStock };
}

export function checkPriceClaims({ srcDirectory = "src" } = {}) {
  const findings = [];
  let checkedFiles = 0;
  function walk(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const current = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        walk(current);
      } else if (TARGET_EXTENSIONS.has(path.extname(current))) {
        checkedFiles += 1;
        const lines = fs.readFileSync(current, "utf8").split("\n");
        lines.forEach((line, index) => {
          const hit = classifyLine(line, lines.slice(0, index));
          if (hit) {
            findings.push({
              file: current,
              line: index + 1,
              text: line.trim().slice(0, 120),
              ...hit,
            });
          }
        });
      }
    }
  }
  for (const dir of TARGET_DIRS) {
    walk(path.join(srcDirectory, dir));
  }
  return { findings, checkedFiles };
}

function formatReport({ findings, checkedFiles }) {
  const lines = [];
  lines.push(`price claims check: ${checkedFiles} files`);
  lines.push(
    `found ${findings.length} price/stock assertion(s) without confirmation context`,
  );
  for (const finding of findings) {
    const kind = [
      finding.hasPrice ? "price" : "",
      finding.hasStock ? "stock" : "",
    ]
      .filter(Boolean)
      .join("+");
    lines.push(`- ${finding.file}:${finding.line} [${kind}]: ${finding.text}`);
  }
  return lines;
}

if (
  path.resolve(process.argv[1] ?? "") ===
  path.resolve(fileURLToPath(import.meta.url))
) {
  const mode = process.argv[2] ?? "check";
  if (mode !== "check") {
    console.error(`ERROR: unknown mode: ${mode}`);
    process.exitCode = 2;
  } else {
    const result = checkPriceClaims();
    const strict =
      process.env.STRICT_PRICE_CLAIMS === "1" ||
      process.argv.includes("--strict");
    if (result.findings.length > 0) {
      const header = strict
        ? "price claim violations (STRICT_PRICE_CLAIMS=1):"
        : "price claim warnings (set STRICT_PRICE_CLAIMS=1 to enforce):";
      console.error(header);
      for (const line of formatReport(result)) console.error(line);
      process.exitCode = strict ? 1 : 0;
    } else {
      for (const line of formatReport(result)) console.log(line);
      console.log(
        "price claims ok: every assertion carries confirmation context",
      );
    }
  }
}

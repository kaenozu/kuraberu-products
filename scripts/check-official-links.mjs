/**
 * scripts/check-official-links.mjs
 *
 * HeroComparison / ArticleComparisonV2 に渡す officialHref（ヒーロー画像リンクと
 * 「公式」ボタンの両方が使う）が、アフィリエイト・リダイレクトドメイン
 * （a.r10.to / r10.to / hb.afl.rakuten.co.jp）を指していないことを機械検証する。
 * 公式リンクと広告リンクの混入（「公式」表記の CTA が楽天アフィリエイトへ飛ぶ事故）を防ぐ。
 *
 * モード:
 *   check (既定) — src/pages 配下の .astro を走査し、officialHref の値を解決して
 *               ドメインを判定する。次のいずれかがあれば exit 1。
 *               1. 解決先の URL がアフィリエイトドメイン
 *               2. officialHref の値を URL へ解決できない（fail-closed）
 *
 * officialHref の値は次の形を解決する（CI で全箇所が解決できることを確認済み）。
 *   - URL リテラル            officialHref: 'https://www.babybjorn.jp/...'
 *   - 同一ファイルの const      const leftOfficial = 'https://...'; officialHref: leftOfficial
 *   - const 経由のプロパティ    const officialPage = tigerMtaJ050.officialUrl; officialHref: officialPage
 *   - 同一ファイルのオブジェクト const plus = { official: plusOfficial, ... }; officialHref: plus.official
 *   - src/lib/products.ts の import const thermosJnlS500 = {...}; officialHref: thermosJnlS500.officialUrl
 *
 * 使い方:
 *   node scripts/check-official-links.mjs check
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const PRODUCTS_FILE = "src/lib/products.ts";
const MAX_RESOLVE_DEPTH = 6;

/** アフィリエイト・リダイレクトドメイン（a.r10.to / r10.to / hb.afl.rakuten.co.jp）。 */
export const AFFILIATE_URL_PATTERN =
  /https?:\/\/(?:[^./]+\.)?(?:a\.r10\.to|r10\.to|hb\.afl\.rakuten\.co\.jp)(?:\/|$)/i;

const IDENTIFIER_RE = /^[A-Za-z_$][\w$]*$/;
const MEMBER_RE = /^([A-Za-z_$][\w$]*)\.([A-Za-z_$][\w$]*)$/;
const URL_LITERAL_RE = /^['"](https?:\/\/[^'"]+)['"]$/;

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** `{` の開始位置から対応する `}` までの本文（中括弧を除く）を返す。 */
export function extractBalancedBody(text, openBraceIndex) {
  let depth = 0;
  let quote = null;
  for (let index = openBraceIndex; index < text.length; index += 1) {
    const character = text[index];
    if (quote) {
      if (character === quote && text[index - 1] !== "\\") quote = null;
      continue;
    }
    if (character === '"' || character === "'" || character === "`") {
      quote = character;
      continue;
    }
    if (character === "{") depth += 1;
    else if (character === "}") {
      depth -= 1;
      if (depth === 0) return text.slice(openBraceIndex + 1, index);
    }
  }
  return null;
}

/** オブジェクト定義（const NAME = { ... }）内のプロパティ値を返す。 */
function objectPropertyValue(text, objectName, propertyName) {
  const objectMatch = new RegExp(
    `\\bconst\\s+${escapeRegex(objectName)}\\s*(?::[^=]*)?=\\s*\\{`,
  ).exec(text);
  if (!objectMatch) return null;
  const openBraceIndex = objectMatch.index + objectMatch[0].length - 1;
  const body = extractBalancedBody(text, openBraceIndex);
  if (body === null) return null;
  const propertyMatch = new RegExp(
    `\\b${escapeRegex(propertyName)}\\s*:\\s*([^,\\n}]+)`,
  ).exec(body);
  return propertyMatch ? propertyMatch[1].trim() : null;
}

/** const 定義の右辺を返す（const NAME = <expr>）。 */
function constValue(text, name) {
  const match = new RegExp(
    `\\bconst\\s+${escapeRegex(name)}\\s*=\\s*([^;\\n]+)`,
  ).exec(text);
  if (!match) return null;
  return match[1].trim().replace(/[;,]\s*$/, "");
}

/**
 * officialHref の式（URL リテラル / 識別子 / obj.prop）を URL 文字列へ解決する。
 * 解決できない場合は null を返す（呼び出し側が fail-closed にする）。
 */
export function resolveOfficialHref(
  source,
  expression,
  productsText = "",
  depth = 0,
) {
  if (depth > MAX_RESOLVE_DEPTH) return null;
  const expr = expression.trim();
  if (!expr) return null;

  const literal = expr.match(URL_LITERAL_RE);
  if (literal) return literal[1];

  if (IDENTIFIER_RE.test(expr)) {
    const value = constValue(source, expr);
    if (value === null) return null;
    return resolveOfficialHref(source, value, productsText, depth + 1);
  }

  const member = expr.match(MEMBER_RE);
  if (member) {
    const [, objectName, propertyName] = member;
    // 同一ファイル内のオブジェクト
    const local = objectPropertyValue(source, objectName, propertyName);
    if (local !== null) {
      return resolveOfficialHref(source, local, productsText, depth + 1);
    }
    // src/lib/products.ts から import したオブジェクト
    const products = objectPropertyValue(
      productsText,
      objectName,
      propertyName,
    );
    if (products !== null) {
      return resolveOfficialHref(
        productsText,
        products,
        productsText,
        depth + 1,
      );
    }
  }

  return null;
}

function lineNumber(text, offset) {
  return text.slice(0, offset).split("\n").length;
}

/**
 * 記事ページの officialHref を走査し、アフィリエイト URL・解決不能を検出する。
 * sources: [{ filePath, source }]、productsText: src/lib/products.ts の内容。
 */
export function findOfficialHrefViolations(sources, productsText) {
  const violations = [];
  const pattern = /officialHref:\s*([^,}\n]+)/g;
  for (const { filePath, source } of sources) {
    let match;
    while ((match = pattern.exec(source)) !== null) {
      const expression = match[1].trim();
      const line = lineNumber(source, match.index);
      const url = resolveOfficialHref(source, expression, productsText);
      if (url === null) {
        violations.push(
          `${filePath}:${line}: cannot resolve officialHref value "${expression}" to a URL; use a literal or a local const so the official/advertising separation can be verified`,
        );
      } else if (AFFILIATE_URL_PATTERN.test(url)) {
        violations.push(
          `${filePath}:${line}: officialHref "${expression}" resolves to affiliate URL ${url}; official links must point to the manufacturer page`,
        );
      }
    }
  }
  return violations;
}

function walkAstroFiles(directory, files) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const current = path.join(directory, entry.name);
    if (entry.isDirectory()) walkAstroFiles(current, files);
    else if (entry.isFile() && current.endsWith(".astro")) files.push(current);
  }
}

function collectAstroFiles(directory) {
  const files = [];
  if (existsSync(directory)) walkAstroFiles(directory, files);
  return files;
}

export function validateOfficialHrefDirectory(directory = "src/pages") {
  const productsText = existsSync(PRODUCTS_FILE)
    ? readFileSync(PRODUCTS_FILE, "utf8")
    : "";
  const sources = collectAstroFiles(directory).map((filePath) => ({
    filePath,
    source: readFileSync(filePath, "utf8"),
  }));
  return findOfficialHrefViolations(sources, productsText);
}

async function main() {
  const mode = process.argv[2] ?? "check";
  if (mode !== "check") {
    console.error(`ERROR: unknown mode: ${mode}`);
    process.exitCode = 2;
    return;
  }
  const violations = validateOfficialHrefDirectory();
  if (violations.length > 0) {
    console.error("official link 検査に失敗しました:");
    for (const violation of violations) console.error(`- ${violation}`);
    process.exitCode = 1;
    return;
  }
  console.log("official links ok: no affiliate URL in officialHref");
}

if (process.argv[1] && path.resolve(process.argv[1]) === import.meta.filename) {
  await main();
}

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// 購入リンクの単一情報源ゲート（購入URL集約の恒久化）。
//
// 全購入（アフィリエイト）URL は src/lib/products.ts の articlePurchaseLinks
// レジストリにのみ存在する。記事ページの「次にすること」ブロック
// （NextStepBlock / ArticleComparisonV2 の purchaseHref）と記事末尾の
// PurchaseCard は、すべて articlePurchaseLinks['<記事>:<side>'].purchaseUrl を
// 参照しなければならない。本ゲートは:
//   1. 購入コンテキスト（ブロック・購入カード）に URL 直書きがないこと
//   2. 参照キーがレジストリに存在すること
//   3. ブロックと記事末尾カードが**同一キーを同一順序**で参照すること
// を fail-closed で検証する。
//
// レンダリング結果ではなくソースの式を比較する理由:
// - レンダリング済み HTML では、productId を持つ記事は Rakuten API が
//   末尾 CTA を商品ページ（hb.afl item）へ強化するため、両者に正当な
//   差が出る（pigeon-bottle-240 / logicool-zone 等）。式レベルなら常に一致する。
// - 作者が「片方だけ直す」ミスをした瞬間に、ビルドが失敗する。
//
// 対象: src/pages/articles/*/index.astro（手書き記事）。商用記事
// （CommercialArticlePage）はビルド時に Rakuten API で URL を解決するため対象外。

const PAGES_GLOB = "pages/articles";
const REGISTRY_FILE = "lib/products.ts";

function braceSpan(source, start) {
  let depth = 0;
  for (let index = start; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    else if (source[index] === "}") {
      depth -= 1;
      if (depth === 0) return [start, index];
    }
  }
  throw new Error(`unbalanced braces at ${start}`);
}

// `key=` の直後の式を取り出す。{...} なら内側、裸の値ならカンマ/閉じ括弧まで。
function expressionAfterKey(tag, key) {
  const match = new RegExp(`\\b${key}\\s*=`).exec(tag);
  if (!match) return null;
  let pointer = match.index + match[0].length;
  while (pointer < tag.length && /\s/.test(tag[pointer])) pointer += 1;
  if (pointer >= tag.length) return null;
  if (tag[pointer] === "{") {
    const [, end] = braceSpan(tag, pointer);
    return tag.slice(pointer + 1, end).trim();
  }
  let end = pointer;
  while (end < tag.length && !/[,\\}]/.test(tag[end])) end += 1;
  return tag.slice(pointer, end).trim();
}

// 記事ソースから購入カード（PurchaseCard）の href 式を順に取り出す。
export function extractPurchaseCardHrefs(source) {
  const hrefs = [];
  for (const match of source.matchAll(/<PurchaseCard\b/g)) {
    const close = source.indexOf("/>", match.index);
    const tag = source.slice(match.index, close === -1 ? source.length : close);
    const braced = /\bhref=\{(.*?)\}/s.exec(tag);
    if (braced) {
      hrefs.push(braced[1].trim());
      continue;
    }
    const literal = /\bhref="([^"]*)"/.exec(tag);
    hrefs.push(literal ? `"${literal[1]}"` : null);
  }
  return hrefs;
}

// 記事ソースから next-step ブロックの購入リンク式を順に取り出す。
// 供給元は 2 系統: ArticleComparisonV2 の left/right.purchaseHref か、
// NextStepBlock の left/right.href。ブロックが無ければ null（ガイド記事）。
export function extractNextStepHrefs(source) {
  const v2 = /<ArticleComparisonV2\b/.exec(source);
  if (v2) {
    const close = source.indexOf("/>", v2.index);
    const tag = source.slice(v2.index, close === -1 ? source.length : close);
    const out = [];
    for (const key of ["left", "right"]) {
      const literal = expressionAfterKey(tag, key);
      if (literal === null) return null;
      const href = /\bpurchaseHref:\s*([^,}]+)/.exec(literal);
      out.push(href ? href[1].trim() : null);
    }
    return out;
  }
  const block = /<NextStepBlock\b/.exec(source);
  if (block) {
    const close = source.indexOf("/>", block.index);
    const tag = source.slice(block.index, close === -1 ? source.length : close);
    const out = [];
    for (const key of ["left", "right"]) {
      const literal = expressionAfterKey(tag, key);
      if (literal === null) return null;
      const href = /\bhref:\s*([^,}]+)/.exec(literal);
      out.push(href ? href[1].trim() : null);
    }
    return out;
  }
  return null;
}

// レジストリ参照式 articlePurchaseLinks['KEY'].purchaseUrl から KEY を取り出す。
// レジストリ参照でなければ null（URL直書き・変数参照は違反）。
export function keyFromRef(expr) {
  if (expr === null || expr === undefined) return null;
  const match = /articlePurchaseLinks\['([^']+)'\]\.purchaseUrl/.exec(
    expr.trim(),
  );
  return match ? match[1] : null;
}

// src/lib/products.ts の articlePurchaseLinks からキー集合を読み込む。
export function loadRegistryKeys(srcDirectory) {
  const file = path.join(srcDirectory, REGISTRY_FILE);
  const source = fs.readFileSync(file, "utf8");
  const block =
    /export const articlePurchaseLinks = \{([\s\S]*?)\} as const satisfies/.exec(
      source,
    );
  if (!block)
    throw new Error(`articlePurchaseLinks registry not found in ${file}`);
  const keys = new Set();
  for (const match of block[1].matchAll(/^\s*"([^"]+)":\s*\{/gm))
    keys.add(match[1]);
  return keys;
}

// 1 記事のソースを検査する。エラーを errors に積む。
export function checkArticleSource(source, relative, errors, registryKeys) {
  if (/CommercialArticlePage/.test(source)) return; // テンプレート側で 1 回だけ検査

  const blockExprs = extractNextStepHrefs(source);
  const cardExprs = extractPurchaseCardHrefs(source);

  const blockKeys = blockExprs === null ? null : blockExprs.map(keyFromRef);
  const cardKeys = cardExprs.map(keyFromRef);

  // 1. URL 直書きの禁止（ブロック・カードともレジストリ参照であること）
  const rawBlock = blockExprs === null ? [] : blockExprs;
  for (const expr of [...rawBlock, ...cardExprs]) {
    if (expr !== null && keyFromRef(expr) === null) {
      errors.push(
        `${relative}: purchase URL must come from the articlePurchaseLinks registry (src/lib/products.ts), found: ${expr}`,
      );
    }
  }

  // 2. 参照キーがレジストリに存在すること（重複報告しない）
  const allKeys = [...(blockKeys ?? []), ...cardKeys];
  const reported = new Set();
  for (const key of allKeys) {
    if (key === null || reported.has(key)) continue;
    if (!registryKeys.has(key)) {
      reported.add(key);
      errors.push(
        `${relative}: articlePurchaseLinks has no entry for "${key}"`,
      );
    }
  }

  // 3. ブロックと記事末尾カードが同一キーを同一順序で参照すること
  if (blockKeys !== null) {
    if (cardKeys.length !== blockKeys.length) {
      errors.push(
        `${relative}: expected ${blockKeys.length} next-step links and ${cardKeys.length} article-end PurchaseCard hrefs`,
      );
      return;
    }
    for (let index = 0; index < blockKeys.length; index += 1) {
      if (blockKeys[index] === cardKeys[index]) continue;
      if (blockKeys[index] === null) {
        errors.push(
          `${relative}: next-step purchase link #${index + 1} is missing; give the block the same articlePurchaseLinks key as the article-end PurchaseCard (${cardKeys[index] ?? "?"})`,
        );
      } else {
        errors.push(
          `${relative}: next-step purchase link #${index + 1} (${blockKeys[index]}) does not match the article-end PurchaseCard (${cardKeys[index]}) — both must reference the same articlePurchaseLinks key in the same order`,
        );
      }
    }
  }
}

export function checkPurchaseLinkConsistency({ srcDirectory = "src" } = {}) {
  const errors = [];
  const articleDir = path.join(srcDirectory, PAGES_GLOB);
  if (!fs.existsSync(articleDir)) {
    errors.push(`missing article directory: ${articleDir}`);
    return errors;
  }
  let registryKeys;
  try {
    registryKeys = loadRegistryKeys(srcDirectory);
  } catch (error) {
    errors.push(String(error.message));
    return errors;
  }
  for (const entry of fs.readdirSync(articleDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const file = path.join(articleDir, entry.name, "index.astro");
    if (!fs.existsSync(file)) continue;
    const source = fs.readFileSync(file, "utf8");
    checkArticleSource(
      source,
      path.join(PAGES_GLOB, entry.name, "index.astro").replace(/\\/g, "/"),
      errors,
      registryKeys,
    );
  }
  return errors;
}

if (
  path.resolve(process.argv[1] ?? "") ===
  path.resolve(fileURLToPath(import.meta.url))
) {
  const errors = checkPurchaseLinkConsistency();
  if (errors.length) throw new Error(errors.join("\n"));
  console.log(
    "purchase link consistency ok: all purchase links reference the articlePurchaseLinks registry; block keys match article-end PurchaseCards in every comparison article",
  );
}

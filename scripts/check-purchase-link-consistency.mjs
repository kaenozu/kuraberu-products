import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// 購入リンクのドリフト防止（#272 の手動照合をゲート化）。
//
// 比較記事の結論直後ブロック（NextStepBlock）の購入リンクは、記事末尾の
// 購入カード（PurchaseCard / article-end CTA）と**同じ URL を同じ順序**で
// 指さなければならない。ブロックだけ / カードだけ差し替えて片方が古い
// リンクのままになる「ドリフト」を、記事ソース（Astro）の式レベルで検出する。
//
// レンダリング結果ではなくソースの式を比較する理由:
// - レンダリング済み HTML では、productId を持つ記事は Rakuten API が
//   末尾 CTA を商品ページ（hb.afl item）へ強化するため、両者に正当な
//   差が出る（pigeon-bottle-240 / logicool-zone 等）。式レベルなら常に一致する。
// - 作者が「片方だけ直す」ミスをした瞬間に、ビルドが失敗する。
//
// 対象: src/pages/articles/*/index.astro（比較記事）と、商用記事が共通で使う
// CommercialArticlePage.astro テンプレート（1 回だけ検査）。

const PAGES_GLOB = "pages/articles";
const COMMERCIAL_TEMPLATE = "components/CommercialArticlePage.astro";

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
  const end = pointer;
  while (end < tag.length && !/[,\}]/.test(tag[end])) end += 1;
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

// 1 記事のソースを検査する。エラーを errors に積む。
export function checkArticleSource(source, relative, errors) {
  if (/CommercialArticlePage/.test(source)) return; // テンプレート側で 1 回だけ検査
  const blockHrefs = extractNextStepHrefs(source);
  if (blockHrefs === null) return; // ガイド記事など next-step を持たない
  const cardHrefs = extractPurchaseCardHrefs(source);
  if (blockHrefs.length !== 2 || cardHrefs.length !== 2) {
    errors.push(
      `${relative}: expected 2 next-step links and 2 article-end PurchaseCard hrefs, found block=${blockHrefs.length} cards=${cardHrefs.length}`,
    );
    return;
  }
  for (let index = 0; index < 2; index += 1) {
    if (blockHrefs[index] === cardHrefs[index]) continue;
    if (blockHrefs[index] === null) {
      errors.push(
        `${relative}: next-step purchase link #${index + 1} is missing; give the block the same purchase URL as the article-end PurchaseCard (${cardHrefs[index] ?? "?"})`,
      );
    } else {
      errors.push(
        `${relative}: next-step purchase link #${index + 1} (${blockHrefs[index]}) does not match the article-end PurchaseCard href (${cardHrefs[index]}) — both must point to the same purchase URL in the same order`,
      );
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
  for (const entry of fs.readdirSync(articleDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const file = path.join(articleDir, entry.name, "index.astro");
    if (!fs.existsSync(file)) continue;
    const source = fs.readFileSync(file, "utf8");
    checkArticleSource(
      source,
      path.join(PAGES_GLOB, entry.name, "index.astro").replace(/\\/g, "/"),
      errors,
    );
  }

  // 商用記事の共通テンプレート（ページごとに重複検査しない）
  const templateFile = path.join(srcDirectory, COMMERCIAL_TEMPLATE);
  if (fs.existsSync(templateFile)) {
    const source = fs.readFileSync(templateFile, "utf8");
    checkArticleSource(source, COMMERCIAL_TEMPLATE, errors);
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
    "purchase link consistency ok: next-step links match article-end purchase CTAs in every comparison article",
  );
}

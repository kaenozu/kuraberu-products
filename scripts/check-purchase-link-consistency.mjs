import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { toAffiliateRakutenSearchUrl } from "../config/runtime-env.mjs";

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
//
// Issue #342: 上記に加え、purchaseLinkStatus === "verified" の記事が参照する
// 購入URL（アウトバウンドCTA）の最終遷移先を機械検証する。
//   - 初期ホストが許可リスト外なら、HEAD（失敗時 GET）でリダイレクトを
//     最大 MAX_REDIRECT_HOPS hop まで追従し、最終ホストも許可リスト内であること
//   - ネットワークエラーは fail-closed。環境変数 ALLOW_NETWORK_SKIP=1 のときのみ
//     warn-only（オフライン CI を決定的に通すため）
const PAGES_GLOB = "pages/articles";
const REGISTRY_FILE = "lib/products.ts";
const ARTICLES_FILE = "content/articles.ts";
const MODULAR_ARTICLES_DIR = "content/articles";

// verified CTA の到達先として明示的に許すホスト（楽天アフィリエイト経由地）。
// 実運用ホストはレジストリ purchaseUrl の初期ホスト集合も動的に加える
// （outboundHostAllowlist を参照）。
export const ALLOWED_OUTBOUND_HOSTS = Object.freeze([
  "a.r10.to",
  "hb.afl.rakuten.co.jp",
]);

// リダイレクト追従の上限 hop 数と 1 リクエストあたりのタイムアウト（ms）。
export const MAX_REDIRECT_HOPS = 5;
export const REQUEST_TIMEOUT_MS = 10_000;

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
// HEAD を拒否するサーバー向けに GET で再試行するステータス。
const HEAD_RETRY_STATUSES = new Set([400, 403, 404, 405, 501]);

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
  return new Set(loadRegistryEntries(srcDirectory).keys());
}

/**
 * articlePurchaseLinks を「キー → purchaseUrl」マップで読み込む。
 * purchaseUrl の値は文字列リテラルか `thermosJnlS500.rakutenUrl` のような
 * 商品定数参照の両方があり得るため、商品定数の rakutenUrl を解決する。
 */
export function loadRegistryEntries(srcDirectory) {
  const file = path.join(srcDirectory, REGISTRY_FILE);
  const source = fs.readFileSync(file, "utf8");
  const block =
    /export const articlePurchaseLinks = \{([\s\S]*?)\} as const satisfies/.exec(
      source,
    );
  if (!block)
    throw new Error(`articlePurchaseLinks registry not found in ${file}`);
  // 商品定数（export const xxx: Product = { ... rakutenUrl: "https://..." }）の解決表
  const productUrls = new Map();
  for (const match of source.matchAll(
    /export const (\w+): Product = \{[\s\S]*?\n\};/g,
  )) {
    const url = /(?:^|\n)\s*rakutenUrl:\s*"([^"]+)"/.exec(match[0]);
    if (url) productUrls.set(match[1], url[1]);
  }
  const entries = new Map();
  for (const match of block[1].matchAll(/"([^"]+)":\s*\{/g)) {
    const key = match[1];
    const entryStart = match.index + match[0].length;
    let depth = 1;
    let end = entryStart;
    while (end < block[1].length && depth > 0) {
      if (block[1][end] === "{") depth += 1;
      else if (block[1][end] === "}") depth -= 1;
      end += 1;
    }
    const body = block[1].slice(entryStart, end - 1);
    const literal = /\bpurchaseUrl:\s*"([^"]+)"/.exec(body);
    if (literal) {
      entries.set(key, literal[1]);
      continue;
    }
    const reference = /\bpurchaseUrl:\s*(\w+)\.rakutenUrl/.exec(body);
    if (reference && productUrls.has(reference[1])) {
      entries.set(key, productUrls.get(reference[1]));
    }
    const generated = /\bpurchaseUrl:\s*rakutenAffiliateSearchUrl\(\s*"([^"]+)"\s*,?\s*\)/.exec(
      body,
    );
    if (generated) {
      const url = toAffiliateRakutenSearchUrl(generated[1]);
      if (url) entries.set(key, url);
    }
  }
  return entries;
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

/** purchaseLinkStatus の集計。 */
export function countPurchaseLinkStatuses(srcDirectory = "src") {
  // articles.ts に定義された purchaseLinkStatus を集計
  const articlesFile = path.join(srcDirectory, "content", "articles.ts");
  const content = fs.readFileSync(articlesFile, "utf8");
  const matches = [...content.matchAll(/purchaseLinkStatus:\s*"([^"]+)"/g)];
  const counts = { verified: 0, unverified: 0, unavailable: 0 };
  for (const m of matches) {
    const key = m[1];
    if (key in counts) counts[key] += 1;
  }
  // articles/*.ts のモジュール記事も集計
  const modularDir = path.join(srcDirectory, "content", "articles");
  if (fs.existsSync(modularDir)) {
    for (const entry of fs.readdirSync(modularDir, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith(".ts")) continue;
      const file = path.join(modularDir, entry.name);
      const text = fs.readFileSync(file, "utf8");
      for (const m of text.matchAll(/purchaseLinkStatus:\s*"([^"]+)"/g)) {
        const key = m[1];
        if (key in counts) counts[key] += 1;
      }
    }
  }
  return counts;
}

/**
 * 記事ソース（articles.ts やモジュール記事ファイル）から
 * 「記事 id → purchaseLinkStatus」マップを読み込む。
 * ブロックは `id: "..."` の出現位置で分割する（ネストした id は存在しない）。
 */
export function loadPurchaseLinkStatusesFromSource(content, statuses) {
  const idPattern = /^\s+id:\s*"([^"]+)"/gm;
  const marks = [];
  for (const match of content.matchAll(idPattern)) {
    marks.push({ id: match[1], index: match.index });
  }
  for (let index = 0; index < marks.length; index += 1) {
    const blockEnd =
      index + 1 < marks.length ? marks[index + 1].index : content.length;
    const body = content.slice(marks[index].index, blockEnd);
    const status =
      /\bpurchaseLinkStatus:\s*"(verified|unverified|unavailable)"/.exec(body);
    if (status) statuses.set(marks[index].id, status[1]);
  }
  return statuses;
}

/** 記事レジストリ全体（articles.ts + モジュール記事）から id → status を収集する。 */
export function loadArticleStatuses(srcDirectory = "src") {
  const statuses = new Map();
  const articlesFile = path.join(srcDirectory, ARTICLES_FILE);
  if (fs.existsSync(articlesFile)) {
    loadPurchaseLinkStatusesFromSource(
      fs.readFileSync(articlesFile, "utf8"),
      statuses,
    );
  }
  const modularDir = path.join(srcDirectory, MODULAR_ARTICLES_DIR);
  if (fs.existsSync(modularDir)) {
    for (const entry of fs.readdirSync(modularDir, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith(".ts")) continue;
      loadPurchaseLinkStatusesFromSource(
        fs.readFileSync(path.join(modularDir, entry.name), "utf8"),
        statuses,
      );
    }
  }
  return statuses;
}

/**
 * verified 記事の CTA が参照するアウトバウンド URL 一覧を収集する。
 * 商用テンプレート記事（CommercialArticlePage）はビルド時 API 解決のため対象外。
 * 戻り値: [{ article, key, url }]（URL 重複あり・出現順）
 */
export function collectVerifiedCtaUrls({ srcDirectory = "src" } = {}) {
  const registry = loadRegistryEntries(srcDirectory);
  const statuses = loadArticleStatuses(srcDirectory);
  const articleDir = path.join(srcDirectory, PAGES_GLOB);
  const ctas = [];
  if (!fs.existsSync(articleDir)) return { ctas, statuses };
  for (const entry of fs.readdirSync(articleDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const slug = entry.name;
    const file = path.join(articleDir, slug, "index.astro");
    if (!fs.existsSync(file)) continue;
    if (statuses.get(slug) !== "verified") continue;
    const source = fs.readFileSync(file, "utf8");
    if (/CommercialArticlePage/.test(source)) continue; // API 解決のため対象外
    const exprs = [
      ...(extractNextStepHrefs(source) ?? []),
      ...extractPurchaseCardHrefs(source),
    ];
    const seen = new Set();
    for (const expr of exprs) {
      const key = keyFromRef(expr);
      if (key === null || seen.has(key)) continue;
      seen.add(key);
      const url = registry.get(key);
      if (url) ctas.push({ article: slug, key, url });
    }
  }
  return { ctas, statuses };
}

/** 正規化済みホスト名（小文字・末尾ドット除去）。無効な URL は null。 */
export function hostnameOf(value) {
  try {
    return new URL(value).hostname.toLowerCase().replace(/\.$/, "");
  } catch {
    return null;
  }
}

/**
 * verified CTA の許可リスト。既定の楽天ホスト + レジストリに現れる
 * アウトバウンド URL の初期ホスト集合（将来の正規ホスト追加に自動追随）。
 */
export function outboundHostAllowlist(registryUrls = []) {
  const hosts = new Set(ALLOWED_OUTBOUND_HOSTS);
  for (const url of registryUrls) {
    const host = hostnameOf(url);
    if (host) hosts.add(host);
  }
  return hosts;
}

async function requestWithHeadGetFallback(url, fetchImpl, timeoutMs) {
  for (const method of ["HEAD", "GET"]) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let response;
    try {
      // cookie を送らない（credentials: "omit" + Cookie ヘッダーなし）。
      response = await fetchImpl(url, {
        method,
        redirect: "manual",
        credentials: "omit",
        signal: controller.signal,
      });
    } catch (error) {
      if (method === "GET") {
        const failure = new Error(
          `request failed (${url}): ${error.message} (timeout=${timeoutMs}ms)`,
        );
        failure.code = "ENETWORK";
        throw failure;
      }
      continue; // HEAD 失敗は GET で再試行
    } finally {
      clearTimeout(timer);
    }
    if (HEAD_RETRY_STATUSES.has(response.status) && method === "HEAD") {
      continue; // HEAD を拒否するサーバーは GET で再試行
    }
    return response;
  }
  throw new Error(`unreachable: HTTP fallback loop exited for ${url}`);
}

/**
 * outbound URL の最終遷移先を解決する（リダイレクト手動追従・hop 上限・timeout）。
 * 戻り値: { finalUrl, hops, status }。ネットワーク失敗や hop 超過は throw。
 */
export async function resolveFinalUrl(target, options = {}) {
  const {
    fetchImpl = globalThis.fetch,
    maxHops = MAX_REDIRECT_HOPS,
    timeoutMs = REQUEST_TIMEOUT_MS,
  } = options;
  let current = target;
  for (let hop = 0; hop <= maxHops; hop += 1) {
    const response = await requestWithHeadGetFallback(
      current,
      fetchImpl,
      timeoutMs,
    );
    if (!REDIRECT_STATUSES.has(response.status)) {
      return {
        finalUrl: response.url || current,
        hops: hop,
        status: response.status,
      };
    }
    const location = response.headers.get("location");
    if (!location) {
      return { finalUrl: current, hops: hop, status: response.status };
    }
    current = new URL(location, current).toString();
  }
  const tooMany = new Error(
    `exceeded ${maxHops} redirect hops while resolving ${target}`,
  );
  tooMany.code = "EMAXHOPS";
  throw tooMany;
}

/**
 * verified CTA 全件の最終遷移先を検証する。
 * - 初期ホストが許可リスト内ならネットワークアクセスせず合格
 * - それ以外はリダイレクト追従し、最終ホストが許可リスト内であること
 * - ネットワークエラーは原則 fail-closed。allowNetworkSkip=true のとき warn-only
 * 戻り値: { errors, warnings, checked }
 */
/**
 * verified CTA の最終遷移先を許可ホストへ機械検証する。
 * @param {{
 *   urls: Array<{ article: string; key: string; url: string }>;
 *   allowlist: ReadonlySet<string>;
 *   fetchImpl?: typeof fetch;
 *   maxHops?: number;
 *   timeoutMs?: number;
 *   allowNetworkSkip?: boolean;
 * }} options
 */
export async function auditVerifiedCtaDestinations({
  urls,
  allowlist,
  fetchImpl = globalThis.fetch,
  maxHops = MAX_REDIRECT_HOPS,
  timeoutMs = REQUEST_TIMEOUT_MS,
  allowNetworkSkip = false,
} = {}) {
  const errors = [];
  const warnings = [];
  const checked = [];
  const unique = new Map();
  for (const cta of urls) {
    if (!unique.has(cta.url)) unique.set(cta.url, cta);
  }
  for (const [url, cta] of unique) {
    const initialHost = hostnameOf(url);
    if (initialHost === null) {
      errors.push(
        `${cta.article}: CTA "${cta.key}" has an unparseable URL: ${url}`,
      );
      continue;
    }
    if (allowlist.has(initialHost)) {
      checked.push({
        url,
        article: cta.article,
        result: "allowlisted-initial",
      });
      continue;
    }
    try {
      const { finalUrl, hops } = await resolveFinalUrl(url, {
        fetchImpl,
        maxHops,
        timeoutMs,
      });
      const finalHost = hostnameOf(finalUrl);
      checked.push({
        url,
        article: cta.article,
        result: "resolved",
        finalHost,
        hops,
      });
      if (finalHost === null || !allowlist.has(finalHost)) {
        errors.push(
          `${cta.article}: CTA "${cta.key}" (${url}) ultimately lands on ${finalHost ?? "(unparseable)"}, which is not in the verified CTA allowlist (${[...allowlist].join(", ")})`,
        );
      }
    } catch (error) {
      const message = `${cta.article}: could not verify final destination of CTA "${cta.key}" (${url}): ${error.message}`;
      if (allowNetworkSkip) {
        warnings.push(`ALLOW_NETWORK_SKIP=1 (warn-only): ${message}`);
      } else {
        errors.push(message);
      }
    }
  }
  return { errors, warnings, checked };
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
  const counts = countPurchaseLinkStatuses();
  console.log(`purchase link status audit: ${JSON.stringify(counts)}`);

  const { ctas } = collectVerifiedCtaUrls();
  const allowlist = outboundHostAllowlist(loadRegistryEntries("src").values());
  const audit = await auditVerifiedCtaDestinations({
    urls: ctas,
    allowlist,
    allowNetworkSkip: process.env.ALLOW_NETWORK_SKIP === "1",
  });
  for (const warning of audit.warnings) console.warn(warning);
  const viaNetwork = audit.checked.filter(
    (entry) => entry.result === "resolved",
  ).length;
  console.log(
    `verified CTA destination audit ok: ${audit.checked.length} CTAs checked (${viaNetwork} via network redirect follow, ${audit.checked.length - viaNetwork} skipped by initial-host allowlist)`,
  );
  if (audit.errors.length) throw new Error(audit.errors.join("\n"));
}

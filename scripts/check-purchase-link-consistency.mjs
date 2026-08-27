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

// CTA audit cache: fresh evidence from a past strict (non-skip) audit.
// When ALLOW_NETWORK_SKIP=1, skipped CTAs are NOT counted as audited.
// Instead, coverage requires either network-resolved evidence OR a fresh cache.
export const CTA_CACHE_FILE = "data/cta-audit-cache.json";
export const CTA_CACHE_MAX_AGE_DAYS = 7;

// verified CTA の**最終到達先**ホスト（リダイレクト追従後の最終ホスト）。
// 商品詳細ページ（item.rakuten.co.jp）も確認済みの正規到達先として許可する。
// a.r10.to 等の短縮リンクホストはここに含めない。
// リダイレクト追従は全 CTA に対して必須。
export const ALLOWED_OUTBOUND_HOSTS = Object.freeze([
  "hb.afl.rakuten.co.jp",
  "item.rakuten.co.jp",
  "www.rakuten.co.jp",
  "www.amazon.co.jp",
  "search.rakuten.co.jp",
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
  // ArticleComparisonPage with explicit left/right props containing purchaseHref
  const page = /<ArticleComparisonPage\b/.exec(source);
  if (page) {
    const remaining = source.slice(page.index);
    const selfClose = remaining.indexOf("/>");
    if (selfClose !== -1) {
      const tag = remaining.slice(0, selfClose);
      const out = [];
      for (const key of ["left", "right"]) {
        const literal = expressionAfterKey(tag, key);
        if (literal === null) {
          // articleId mode — no explicit left/right props
          return null;
        }
        const href = /\bpurchaseHref:\s*([^,}]+)/.exec(literal);
        out.push(href ? href[1].trim() : null);
      }
      return out;
    }
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

const DEFAULT_RAKUTEN_AFFILIATE_ID = "34e76967.d5cc3ae1.34e76968.3eade5e6";

function resolveRakutenAffiliateSearchUrl(query) {
  const encodedSearchUrl = encodeURIComponent(
    "https://search.rakuten.co.jp/search/mall/" + encodeURIComponent(query),
  );
  return (
    "https://hb.afl.rakuten.co.jp/hgc/" +
    DEFAULT_RAKUTEN_AFFILIATE_ID +
    "/?pc=" +
    encodedSearchUrl +
    "&link_type=text"
  );
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
    const literal = /\bpurchaseUrl:\s*"([^"]*)"/.exec(body);
    if (literal) {
      entries.set(key, literal[1]);
      continue;
    }
    const reference = /\bpurchaseUrl:\s*(\w+)\.rakutenUrl/.exec(body);
    if (reference && productUrls.has(reference[1])) {
      entries.set(key, productUrls.get(reference[1]));
      continue;
    }
    const search =
      /\brakutenAffiliateSearchUrl\(\s*\"([^\"]*)\"\s*,?\s*\)/s.exec(body);
    if (search) entries.set(key, resolveRakutenAffiliateSearchUrl(search[1]));
  }
  return entries;
}

// 1 記事のソースを検査する。エラーを errors に積む。
export function checkArticleSource(source, relative, errors, registryKeys) {
  if (/CommercialArticlePage/.test(source)) return; // テンプレート側で 1 回だけ検査
  // ArticleComparisonPage with explicit left/right props: the component renders
  // PurchaseCard internally, so no page-level PurchaseCard to compare against.
  // CTA destination is checked separately by auditVerifiedCtaDestinations.
  if (/ArticleComparisonPage/.test(source) && /articleMetadata/.test(source))
    return;

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

    // 1. Direct references (ArticleComparisonV2 / NextStepBlock / PurchaseCard)
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

    // 2. ArticleComparisonPage with articleId: CTA keys are inferred from the
    //    articleId (the component renders PurchaseCard with
    //    articlePurchaseLinks[`${articleId}:left/right`]).
    if (seen.size === 0) {
      const idMatch = /articleId="([^"]+)"/.exec(source);
      if (idMatch) {
        for (const side of ["left", "right"]) {
          const key = `${idMatch[1]}:${side}`;
          if (registry.has(key)) {
            ctas.push({ article: slug, key, url: registry.get(key) });
          }
        }
      }
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
 * verified CTA の**最終到達先**許可リスト。
 * レジストリ URL のホストを自動追加しない。
 * リダイレクト追従後にこのホスト集合に含まれることのみで合格とする。
 */
export function outboundHostAllowlist() {
  return new Set(ALLOWED_OUTBOUND_HOSTS);
}

/**
 * Load cached CTA audit results from disk.
 * Returns { generatedAt, entries: [...] } or null if file is missing/invalid.
 */
export function loadCachedAuditResults(cachePath = CTA_CACHE_FILE) {
  try {
    const raw = JSON.parse(fs.readFileSync(cachePath, "utf8"));
    if (
      raw &&
      typeof raw.generatedAt === "string" &&
      Array.isArray(raw.entries)
    ) {
      return raw;
    }
    return null;
  } catch {
    return null;
  }
}

/** Check if cache was generated within maxAgeDays of now. */
export function isCacheFresh(cache, maxAgeDays = CTA_CACHE_MAX_AGE_DAYS) {
  if (!cache || !cache.generatedAt) return false;
  const generated = new Date(cache.generatedAt).getTime();
  const ageMs = Date.now() - generated;
  return ageMs >= 0 && ageMs <= maxAgeDays * 24 * 60 * 60 * 1000;
}

/** Check if an article page source uses CommercialArticlePage (API-resolved CTAs). */
export function isCommercialArticle(source) {
  return /CommercialArticlePage/.test(source);
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
    if (allowNetworkSkip) {
      // Skip network calls entirely: record as unchecked for coverage reporting
      checked.push({ url, article: cta.article, result: "skipped" });
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

  const { ctas, statuses } = collectVerifiedCtaUrls();
  const allowlist = outboundHostAllowlist();
  const allowNetworkSkip = process.env.ALLOW_NETWORK_SKIP === "1";
  const audit = await auditVerifiedCtaDestinations({
    urls: ctas,
    allowlist,
    allowNetworkSkip,
  });
  for (const warning of audit.warnings) console.warn(warning);
  const viaNetwork = audit.checked.filter(
    (entry) => entry.result === "resolved",
  ).length;
  const skipped = audit.checked.filter(
    (entry) => entry.result === "skipped",
  ).length;
  console.log(
    `verified CTA destination audit: ${audit.checked.length} CTAs (${viaNetwork} resolved, ${skipped} skipped)`,
  );

  // --- Coverage check ---
  // Verified articles must have their CTAs checked. When allowNetworkSkip=1,
  // skipped CTAs do NOT count — coverage requires either:
  //   1. A network-resolved CTA (resolved during this run), OR
  //   2. Fresh cached evidence from a past strict audit.
  // This prevents "45 CTAs skipped → coverage 45/45 → CI PASS" fail-open.
  const verifiedSlugs = [...statuses.entries()]
    .filter(([, status]) => status === "verified")
    .map(([slug]) => slug);
  const checkedArticles = new Set(audit.checked.map((e) => e.article));
  const networkResolvedArticles = new Set(
    audit.checked.filter((e) => e.result === "resolved").map((e) => e.article),
  );

  // Condition 1: Basic coverage — article must appear in audit output at all
  const unchecked = verifiedSlugs.filter((slug) => !checkedArticles.has(slug));
  if (unchecked.length > 0) {
    console.error(
      `Coverage failure: ${unchecked.length} verified article(s) not covered by CTA audit: ${unchecked.join(", ")}`,
    );
    process.exit(1);
  }

  // Condition 2: When allowNetworkSkip=1, require fresh cache evidence for
  // non-commercial verified articles that weren't resolved via network.
  if (allowNetworkSkip) {
    const articleDir = path.join("src", PAGES_GLOB);
    const nonCommercialVerified = verifiedSlugs.filter((slug) => {
      const file = path.join(articleDir, slug, "index.astro");
      if (!fs.existsSync(file)) return true;
      return !isCommercialArticle(fs.readFileSync(file, "utf8"));
    });

    const cache = loadCachedAuditResults();
    const cachedArticles = new Set(
      (cache?.entries ?? []).map((e) => e.article),
    );
    const uncoveredByCache = nonCommercialVerified.filter(
      (slug) => !networkResolvedArticles.has(slug) && !cachedArticles.has(slug),
    );

    if (cache && !isCacheFresh(cache)) {
      // Cache exists but is stale — this is a hard failure. The weekly
      // scheduled workflow should have refreshed it.
      console.error(
        `CTA audit cache is stale (max age: ${CTA_CACHE_MAX_AGE_DAYS}d, generated: ${cache.generatedAt}). Run: pnpm verify:cta-strict`,
      );
      process.exit(1);
    }
    if (!cache) {
      // Cache does not exist yet (first deployment / migration period).
      // Warn but do not fail — the weekly workflow will create it.
      console.warn(
        `CTA audit cache not found. Run 'pnpm verify:cta-strict' to generate it. Until then, skip-mode coverage check is warn-only.`,
      );
    } else if (uncoveredByCache.length > 0) {
      console.error(
        `CTA audit cache coverage failure: ${uncoveredByCache.length} verified article(s) have no network-resolved or cached evidence: ${uncoveredByCache.join(", ")}`,
      );
      process.exit(1);
    } else {
      console.log(
        `CTA audit cache: ${cache.entries.length} entries, generated ${cache.generatedAt}`,
      );
    }
  }

  // Condition 3: Unparseable URLs are always fatal
  if (audit.errors.length) throw new Error(audit.errors.join("\n"));
}

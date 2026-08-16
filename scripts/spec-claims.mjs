/**
 * scripts/spec-claims.mjs
 *
 * 記事の仕様クレーム（寸法・重量・容量・消費電力・運転音・適用畳数など）と、
 * その公式ソースとの突合記録（data/spec-claims.json）を管理する。
 *
 * 目的: 公開記事の仕様表記を「公式ページで確認した日」と紐づけ、次の2つを防ぐ。
 *   1. 仕様クレームが変わったのに再確認記録が残っていない（乖離）
 *   2. 確認から長期間経過したまま放置される（鮮度切れ）
 *
 * モード:
 *   check      (既定) — 記事↔マニフェストの乖離を検出する（CI の PR チェック用）。
 *              仕様クレームのある記事にマニフェスト項目が無い、指紋が一致しない、
 *              存在しない記事を参照している、などがあれば exit 1。
 *   freshness  — checkedAt が閾値（既定 180 日）を超えた記事を報告する
 *              （定期 workflow 用）。1件でもあれば exit 1 で
 *              .acceptance/spec-claims-freshness/report.md を出力。
 *   init       — 仕様クレームのある記事のマニフェスト項目を追加する。
 *              --checked-at 必須（新規項目の確認日）。
 *   update     — 指定記事の指紋を再計算し checkedAt を更新する。
 *              --article-id と --checked-at 必須（再確認後の手続き）。
 *
 * 使い方:
 *   node scripts/spec-claims.mjs check
 *   node scripts/spec-claims.mjs freshness [--threshold-days 180] [--as-of 2026-08-16]
 *   node scripts/spec-claims.mjs init --checked-at 2026-08-16
 *   node scripts/spec-claims.mjs update --article-id babybjorn-cradle --checked-at 2026-08-16
 *
 * 仕様クレームの抽出はメーカー公式ページとの「値の一致」までは検証しない
 * （ページ取得・比較は外部要因に依存するため）。このスクリプトは
 * クレームの内容が変わったことの検出と、確認日の鮮度管理を行う。
 */

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArticles } from "./generate-x-announcements.mjs";

export const MANIFEST_PATH = "data/spec-claims.json";
export const DEFAULT_THRESHOLD_DAYS = 180;
export const SCHEMA_VERSION = 1;
const MS_PER_DAY = 86_400_000;

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** 仕様クレームの検出パターン（監査で公式仕様と突合した項目群）。 */
const SPEC_PATTERNS = [
  {
    key: "dimensions",
    re: /(\d[\d,]*(?:\.\d+)?)\s*[x×]\s*[^x×\n]{0,12}?(\d[\d,]*(?:\.\d+)?)(?:\s*[x×]\s*[^x×\n]{0,12}?(\d[\d,]*(?:\.\d+)?))?\s*(?:mm|cm|センチ)/gi,
  },
  {
    key: "weight",
    re: /(?:重量|質量)[^。\n]{0,40}?(\d[\d,]*(?:\.\d+)?)\s*(?:kg|g)\b/gi,
  },
  {
    key: "capacity",
    re: /(?:容量|タンク容量)[^。\n]{0,40}?(\d[\d,]*(?:\.\d+)?)\s*(?:L|リットル)/gi,
  },
  {
    key: "power",
    re: /(?:消費電力|定格)[^。\n]{0,30}?(\d[\d,]*(?:\.\d+)?)\s*(?:W|ワット)/gi,
  },
  {
    key: "noise",
    re: /(?:運転音|騒音)[^。\n]{0,30}?(\d[\d,]*(?:\.\d+)?)\s*dB/gi,
  },
  {
    key: "tatami",
    re: /(?:適用畳数|木造)[^。\n]{0,30}?(\d[\d,]*(?:\.\d+)?)\s*畳/gi,
  },
  {
    key: "efficiency",
    re: /(?:保温効力|保冷効力)[^。\n]{0,20}?(\d[\d,]*(?:\.\d+)?)℃/gi,
  },
];

/** 公式ソースURL（official 系の識別子に代入された URL リテラル）。 */
const OFFICIAL_URL_RE =
  /\b([A-Za-z_][A-Za-z0-9_]*[Oo]fficial[A-Za-z0-9_]*)\s*=\s*['"](https?:\/\/[^'"]+)['"]/g;

/** 商品マスタ（src/lib/products.ts）の仕様値。 */
const PRODUCTS_SPEC_LINE_RE =
  /\b(weight|dimensions|capacity|officialUrl):\s*["']([^"']+)["']/g;

function parseIsoDate(value) {
  if (!ISO_DATE_RE.test(value)) {
    throw new TypeError(`invalid ISO date: ${value}`);
  }
  const parsed = Date.parse(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed)) {
    throw new TypeError(`invalid ISO date: ${value}`);
  }
  return parsed;
}

export function daysSince(checkedAt, asOf) {
  const days = Math.floor(
    (parseIsoDate(asOf) - parseIsoDate(checkedAt)) / MS_PER_DAY,
  );
  return Math.max(0, days);
}

/** 本文から仕様クレーム文字列を抽出する（重複除去・ソート済み）。 */
export function extractSpecClaims(sourceText) {
  const claims = [];
  for (const pattern of SPEC_PATTERNS) {
    for (const match of sourceText.matchAll(pattern.re)) {
      claims.push(match[0].trim());
    }
  }
  return [...new Set(claims)].sort();
}

/** 本文から公式ソースURLを抽出する（重複除去・ソート済み）。 */
export function extractOfficialUrls(sourceText) {
  const urls = [];
  for (const match of sourceText.matchAll(OFFICIAL_URL_RE)) {
    urls.push(match[2]);
  }
  return [...new Set(urls)].sort();
}

/** 商品マスタに記載された仕様値と公式URL（記事が products.ts を参照する場合に指紋へ含める）。 */
export function readProductsSpecData() {
  const file = "src/lib/products.ts";
  if (!existsSync(file)) {
    return { spec: [], urls: [] };
  }
  const text = readFileSync(file, "utf8");
  const spec = [];
  const urls = [];
  for (const match of text.matchAll(PRODUCTS_SPEC_LINE_RE)) {
    const value = match[2].trim();
    if (match[1] === "officialUrl") {
      urls.push(value);
    } else {
      spec.push(value);
    }
  }
  return {
    spec: [...new Set(spec)].sort(),
    urls: [...new Set(urls)].sort(),
  };
}

/** 1記事分の仕様クレームと公式URLを収集する（products.ts 参照時はマスタ値も含む）。 */
export function collectArticleClaims(articleId) {
  const file = `src/pages/articles/${articleId}/index.astro`;
  const text = readFileSync(file, "utf8");
  let claims = extractSpecClaims(text);
  let officialUrls = extractOfficialUrls(text);
  if (/lib\/products/.test(text)) {
    const products = readProductsSpecData();
    claims = claims.concat(products.spec);
    officialUrls = officialUrls.concat(products.urls);
  }
  return {
    claims: [...new Set(claims)].sort(),
    officialUrls: [...new Set(officialUrls)].sort(),
  };
}

/** 仕様クレーム+公式URLの指紋（内容の同一性判定に使う）。 */
export function computeFingerprint(claims, officialUrls) {
  const canonical = ["spec-claims/v1", ...claims, ...officialUrls].join("\n");
  return `sha256:${createHash("sha256").update(canonical).digest("hex")}`;
}

export function loadManifest() {
  return JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
}

export function emptyManifest() {
  return {
    schemaVersion: SCHEMA_VERSION,
    description:
      "記事の仕様クレームと公式ソースの突合記録。checkedAt は公式ページで確認した日。",
    entries: [],
  };
}

/**
 * 記事↔マニフェストの乖離を検査する。問題の説明を文字列配列で返す。
 * - 仕様クレームがあるのにマニフェスト項目が無い記事
 * - 指紋が一致しない（確認後に内容が変わった）記事
 * - 存在しない記事を参照する項目 / 不正な checkedAt
 */
export function checkCoverage(articles, manifest) {
  const issues = [];
  const entries = manifest.entries ?? [];
  const byId = new Map(entries.map((entry) => [entry.articleId, entry]));
  const articleIds = new Set(articles.map((article) => article.id));

  for (const article of articles) {
    const { claims, officialUrls } = collectArticleClaims(article.id);
    const entry = byId.get(article.id);
    if (claims.length > 0 && !entry) {
      issues.push(
        `仕様クレームがあるのにマニフェスト項目が無い記事: ${article.id}（公式ページで確認し 'node scripts/spec-claims.mjs init --checked-at <確認日>' で登録してください）`,
      );
      continue;
    }
    if (!entry) {
      continue;
    }
    const fingerprint = computeFingerprint(claims, officialUrls);
    if (entry.claimsFingerprint !== fingerprint) {
      issues.push(
        `仕様クレームが確認時から変化した記事: ${article.id}（確認日 ${entry.checkedAt}。公式ページで再確認し 'node scripts/spec-claims.mjs update --article-id ${article.id} --checked-at <確認日>' で更新してください）`,
      );
    }
  }

  for (const entry of entries) {
    if (!articleIds.has(entry.articleId)) {
      issues.push(
        `マニフェストが存在しない記事を参照: ${entry.articleId}（data/spec-claims.json から削除してください）`,
      );
    }
    if (!ISO_DATE_RE.test(entry.checkedAt)) {
      issues.push(
        `不正な checkedAt: ${entry.articleId}（${entry.checkedAt} は YYYY-MM-DD にしてください）`,
      );
    }
  }

  return issues;
}

/** 鮮度切れ（checkedAt が閾値より古い）の項目を返す。 */
export function findStaleEntries(
  entries,
  asOf,
  thresholdDays = DEFAULT_THRESHOLD_DAYS,
) {
  if (!Number.isInteger(thresholdDays) || thresholdDays < 1) {
    throw new TypeError("thresholdDays must be a positive integer");
  }
  return entries.filter(
    (entry) => daysSince(entry.checkedAt, asOf) > thresholdDays,
  );
}

/** マニフェストに足りない項目を追加した新しいマニフェストを返す（ファイルIOなし）。 */
export function addMissingEntries(articles, manifest, checkedAt) {
  const entries = [...manifest.entries];
  const byId = new Map(entries.map((entry) => [entry.articleId, entry]));
  let added = 0;
  for (const article of articles) {
    if (byId.has(article.id)) {
      continue;
    }
    const { claims, officialUrls } = collectArticleClaims(article.id);
    if (claims.length === 0) {
      continue;
    }
    entries.push({
      articleId: article.id,
      checkedAt,
      claimsFingerprint: computeFingerprint(claims, officialUrls),
      officialUrls,
      note: "",
    });
    added += 1;
  }
  return { manifest: { ...manifest, entries }, added };
}

/** 指定記事の指紋を再計算し checkedAt を更新した新しいマニフェストを返す。 */
export function updateEntry(manifest, articleId, checkedAt) {
  const entries = manifest.entries.map((entry) => {
    if (entry.articleId !== articleId) {
      return entry;
    }
    const { claims, officialUrls } = collectArticleClaims(articleId);
    return {
      ...entry,
      checkedAt,
      claimsFingerprint: computeFingerprint(claims, officialUrls),
      officialUrls,
    };
  });
  return { manifest: { ...manifest, entries }, updated: 1 };
}

function renderFreshnessReport(stale, asOf, thresholdDays) {
  const lines = [
    "# 仕様表記の再照合が必要（spec-claims）",
    "",
    `- 確認基準日: ${asOf}`,
    `- 閾値: ${thresholdDays}日`,
    `- 再照合が必要: ${stale.length} 件`,
    "",
  ];
  for (const entry of stale) {
    lines.push(
      `- **${entry.articleId}** — 最終確認 ${entry.checkedAt}（${daysSince(
        entry.checkedAt,
        asOf,
      )}日前）`,
    );
    for (const url of entry.officialUrls ?? []) {
      lines.push(`  - ${url}`);
    }
    if (entry.note) {
      lines.push(`  - メモ: ${entry.note}`);
    }
  }
  if (stale.length === 0) {
    lines.push("鮮度切れの記事はありません。", "");
  }
  lines.push(
    "",
    "手順: 各記事の仕様表記を公式ページで確認し、問題が無ければ",
    "`node scripts/spec-claims.mjs update --article-id <id> --checked-at <今日>`",
    "で確認日を更新してください。",
    "",
  );
  return lines.join("\n");
}

function parseArgs(argv) {
  const options = {};
  const positional = [];
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (flag === "--checked-at" && value) {
      options.checkedAt = value;
      index += 1;
    } else if (flag === "--article-id" && value) {
      options.articleId = value;
      index += 1;
    } else if (flag === "--threshold-days" && value) {
      options.thresholdDays = Number(value);
      index += 1;
    } else if (flag === "--as-of" && value) {
      options.asOf = value;
      index += 1;
    } else if (flag.startsWith("-")) {
      throw new Error(`unknown option: ${flag}`);
    } else {
      positional.push(flag);
    }
  }
  options.mode = positional[0] ?? "check";
  return options;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const articles = parseArticles(
    readFileSync("src/content/articles.ts", "utf8"),
  );

  if (options.mode === "check") {
    const manifest = loadManifest();
    const issues = checkCoverage(articles, manifest);
    if (issues.length > 0) {
      console.error("仕様クレーム・マニフェストの検査に失敗しました:");
      for (const issue of issues) {
        console.error(`- ${issue}`);
      }
      process.exitCode = 1;
      return;
    }
    console.log(
      `spec-claims check OK（記事 ${articles.length} 件 / マニフェスト ${manifest.entries.length} 件）`,
    );
    return;
  }

  if (options.mode === "freshness") {
    const asOf = options.asOf ?? new Date().toISOString().slice(0, 10);
    const thresholdDays = options.thresholdDays ?? DEFAULT_THRESHOLD_DAYS;
    const manifest = loadManifest();
    const stale = findStaleEntries(manifest.entries, asOf, thresholdDays);
    const report = renderFreshnessReport(stale, asOf, thresholdDays);
    const outputDir = ".acceptance/spec-claims-freshness";
    mkdirSync(outputDir, { recursive: true });
    writeFileSync(path.join(outputDir, "report.md"), report, "utf8");
    console.log(report);
    if (stale.length > 0) {
      process.exitCode = 1;
    }
    return;
  }

  if (options.mode === "init") {
    if (!options.checkedAt) {
      console.error("ERROR: init には --checked-at <YYYY-MM-DD> が必要です");
      process.exitCode = 2;
      return;
    }
    let manifest;
    try {
      manifest = loadManifest();
    } catch {
      manifest = emptyManifest();
    }
    const { manifest: next, added } = addMissingEntries(
      articles,
      manifest,
      options.checkedAt,
    );
    mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true });
    writeFileSync(MANIFEST_PATH, `${JSON.stringify(next, null, 2)}\n`, "utf8");
    console.log(
      `init: ${added} 件の項目を追加しました（data/spec-claims.json）`,
    );
    return;
  }

  if (options.mode === "update") {
    if (!options.articleId || !options.checkedAt) {
      console.error(
        "ERROR: update には --article-id <id> と --checked-at <YYYY-MM-DD> が必要です",
      );
      process.exitCode = 2;
      return;
    }
    const manifest = loadManifest();
    if (
      !manifest.entries.some((entry) => entry.articleId === options.articleId)
    ) {
      console.error(
        `ERROR: マニフェストに記事がありません: ${options.articleId}`,
      );
      process.exitCode = 2;
      return;
    }
    const { manifest: next } = updateEntry(
      manifest,
      options.articleId,
      options.checkedAt,
    );
    mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true });
    writeFileSync(MANIFEST_PATH, `${JSON.stringify(next, null, 2)}\n`, "utf8");
    console.log(
      `update: ${options.articleId} の指紋を再計算し checkedAt=${options.checkedAt} に更新しました`,
    );
    return;
  }

  console.error(`ERROR: unknown mode: ${options.mode}`);
  process.exitCode = 2;
}

if (process.argv[1] && path.resolve(process.argv[1]) === import.meta.filename) {
  main();
}

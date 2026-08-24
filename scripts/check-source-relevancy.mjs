/**
 * scripts/check-source-relevancy.mjs（Issue #370）
 *
 * 出典リンクの整合性ゲート: 記事が比較対象としている商品の型番から
 * 正規化トークンを抽出し、出典 URL（officialSources）の slug / path / query
 * に少なくとも 1 つ含まれることを機械検証する。
 * 「全然別の商品ページへ出典が向いている」事故を検出するのが目的で、
 * ホスト名は照合対象外（メーカー公式ドメイン運用は check-official-links 側）。
 *
 * ロールアウト方針（warn-first）:
 *   - 違反は記事ごとにグループ化して報告する
 *   - exit 1 になるのは「違反が存在しかつ STRICT_SOURCE_RELEVANCY=1」のときのみ
 *
 * 使い方:
 *   node scripts/check-source-relevancy.mjs check
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ARTICLES_FILE = "content/articles.ts";

/**
 * 型番候補テキスト群から照合用トークンを抽出する。
 * 正規化: NFKC → 小文字化 → 英数（+内部ハイフン）連片の切り出し。
 * テキストごとに「数字を含む 3 文字以上のトークン」（JNL-S500 → jnl-s500）を
 * 優先し、そのテキストに数字入りトークンが無ければ 4 文字以上の英字トークン
 * （Qrevo Curv → qrevo/curv）にフォールバックする。型番を持たない商品でも
 * 判定できるようにするため。戻り値は全テキスト分の和集合（ソート済み）。
 */
export function extractModelTokens(texts) {
  const normalized = texts
    .filter((text) => typeof text === "string" && text.trim().length > 0)
    .map((text) => text.normalize("NFKC").toLowerCase());
  const selected = new Set();
  for (const text of normalized) {
    const withDigits = new Set();
    const alphaOnly = new Set();
    for (const token of text.matchAll(/[a-z0-9]+(?:-[a-z0-9]+)*/g)) {
      const value = token[0];
      if (/\d/.test(value) && /[a-z]/.test(value)) {
        if (value.length >= 3) withDigits.add(value);
      } else if (!/\d/.test(value) && value.length >= 4) {
        alphaOnly.add(value);
      }
    }
    const preferred = withDigits.size > 0 ? withDigits : alphaOnly;
    for (const value of preferred) selected.add(value);
  }
  return [...selected].sort();
}

/** URL から照合対象（slug + path + query、小文字・デコード済み）を取り出す。 */
export function sourceSearchTarget(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return null;
  }
  let target = `${parsed.pathname}${parsed.search}`;
  try {
    target = decodeURIComponent(target);
  } catch {
    // 不正なエンコードはそのまま使う
  }
  return {
    raw: target.toLowerCase(),
    squashed: target.toLowerCase().replace(/-/g, ""),
  };
}

/** トークンのいずれかが slug/path/query に含まれるか（ハイフン有無両対応）。 */
export function sourceContainsToken(target, token) {
  const squashed = token.replace(/-/g, "");
  return target.raw.includes(token) || target.squashed.includes(squashed);
}

/**
 * articles.ts のソースを記事ブロック（`id: "..."` 区切り）に分割し、
 * 出典 URL と型番候補テキストを収集する。
 * 戻り値: [{ id, sources: [{ label, url }], modelTexts: [string] }]
 */
export function collectArticleSourceRecords(content) {
  const marks = [...content.matchAll(/^\s+id:\s*"([^"]+)"/gm)].map((match) => ({
    id: match[1],
    index: match.index,
  }));
  const records = [];
  for (let index = 0; index < marks.length; index += 1) {
    const start = marks[index].index;
    const end =
      index + 1 < marks.length ? marks[index + 1].index : content.length;
    const body = content.slice(start, end);
    const sources = [...body.matchAll(/url:\s*"(https:\/\/[^"]+)"/g)].map(
      (match) => ({ label: match[1], url: match[1] }),
    );
    const modelTexts = [
      ...[...body.matchAll(/\b(?:left|right)Product:\s*\n?\s*"([^"]+)"/g)].map(
        (match) => match[1],
      ),
      ...[...body.matchAll(/\bline:\s*"([^"]+)"/g)].map((match) => match[1]),
    ];
    const aboutNames = /aboutProductNames:\s*\[([^\]]*)\]/s.exec(body);
    if (aboutNames) {
      for (const match of aboutNames[1].matchAll(/"([^"]+)"/g)) {
        modelTexts.push(match[1]);
      }
    }
    records.push({ id: marks[index].id, sources, modelTexts });
  }
  return records;
}

/**
 * 記事レジストリ全体を出典関連性の観点で検査する。
 * 戻り値: { findings: [{ id, violations: [{ url, tokens }] , unverifiable: number }], checkedSources }
 */
export function findSourceRelevancyFindings(content) {
  const findings = [];
  let checkedSources = 0;
  for (const record of collectArticleSourceRecords(content)) {
    if (record.sources.length === 0) continue;
    const tokens = extractModelTokens(record.modelTexts);
    const violations = [];
    let unverifiable = 0;
    for (const source of record.sources) {
      checkedSources += 1;
      if (tokens.length === 0) {
        unverifiable += 1;
        continue; // 型番候補なし。誤検知より過少検出を避ける
      }
      const target = sourceSearchTarget(source.url);
      if (target === null) {
        violations.push({ url: source.url, tokens });
        continue;
      }
      if (!tokens.some((token) => sourceContainsToken(target, token))) {
        violations.push({ url: source.url, tokens });
      }
    }
    if (violations.length > 0 || unverifiable > 0) {
      findings.push({ id: record.id, violations, unverifiable });
    }
  }
  return { findings, checkedSources };
}

export function checkSourceRelevancy({ srcDirectory = "src" } = {}) {
  const file = path.join(srcDirectory, ARTICLES_FILE);
  if (!fs.existsSync(file)) {
    throw new Error(`article registry not found: ${file}`);
  }
  const content = fs.readFileSync(file, "utf8");
  const { findings, checkedSources } = findSourceRelevancyFindings(content);
  return { findings, checkedSources, file };
}

function formatReport({ findings, checkedSources, file }) {
  const lines = [];
  lines.push(`source relevancy check: ${file}`);
  lines.push(
    `checked ${checkedSources} source URLs across ${findings.length} article(s) with findings`,
  );
  for (const finding of findings) {
    lines.push(`- ${finding.id}:`);
    for (const violation of finding.violations) {
      lines.push(
        `    ✗ none of the model tokens (${violation.tokens.join(", ")}) appear in ${violation.url}`,
      );
    }
    if (finding.unverifiable > 0) {
      lines.push(
        `    ? ${finding.unverifiable} source(s) skipped: no model-number-like token could be derived`,
      );
    }
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
    const { findings, checkedSources, file } = checkSourceRelevancy();
    const totalViolations = findings.reduce(
      (sum, finding) => sum + finding.violations.length,
      0,
    );
    const strict = process.env.STRICT_SOURCE_RELEVANCY === "1";
    const lines = formatReport({ findings, checkedSources, file });
    if (totalViolations > 0) {
      const header = strict
        ? "source relevancy violations (STRICT_SOURCE_RELEVANCY=1):"
        : "source relevancy warnings (set STRICT_SOURCE_RELEVANCY=1 to enforce):";
      console.error(header);
      for (const line of lines) console.error(line);
      process.exitCode = strict ? 1 : 0;
    } else {
      for (const line of lines) console.log(line);
      console.log(
        "source relevancy ok: every source URL matches a compared model token",
      );
    }
  }
}

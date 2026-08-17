/**
 * scripts/validate-sns-ranks.mjs
 *
 * SNS 埋め込みの採用基準ランク（model=型番一致 / series=シリーズ一致 / brand=ブランド一般）を
 * 記事ソースから機械検証する。方針は docs/external-embed-policy.md。
 *
 * ルール:
 *   1. すべての <ExternalEmbed> に match ランク（model / series / brand）が必須
 *   2. <ArticleSocialProof> が埋め込みを持つ場合、bestMatch が必須で、
 *      埋め込みの最上位ランク（model > series > brand）と一致すること
 *   3. C（brand）のみの投稿しか無いセクションは表示してはならない（削除 or 上位投稿を追加）
 *   4. 埋め込みは <ArticleSocialProof> の内側に宣言すること
 *
 * 使い方:
 *   node scripts/validate-sns-ranks.mjs check
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

export const SNS_RANKS = ["model", "series", "brand"];
export const SNS_RANK_ORDER = { model: 3, series: 2, brand: 1 };

const RANK_LABELS = {
  model: "A:型番一致",
  series: "B:シリーズ一致",
  brand: "C:ブランド一般",
};

function lineNumber(text, offset) {
  return text.slice(0, offset).split("\n").length;
}

function attrValue(attrs, name) {
  const match = attrs.match(new RegExp(`\\b${name}="([^"]*)"`));
  return match ? match[1] : null;
}

/** <ExternalEmbed ... /> タグの一覧（{ attrs, index }）。 */
export function findExternalEmbedTags(source) {
  const tags = [];
  for (const match of source.matchAll(/<ExternalEmbed\b([^>]*?)\/>/g)) {
    tags.push({ attrs: match[1], index: match.index });
  }
  return tags;
}

/**
 * <ArticleSocialProof ...>...</ArticleSocialProof>（または自己閉じ）ブロックの一覧。
 * 各ブロックは attrs / children（子要素ソース）/ index / selfClosed を持つ。
 */
export function findArticleSocialProofBlocks(source) {
  const blocks = [];
  const pattern =
    /<ArticleSocialProof\b([^>]*?)(\/>|>([\s\S]*?)<\/ArticleSocialProof\s*>)/g;
  for (const match of source.matchAll(pattern)) {
    blocks.push({
      attrs: match[1],
      selfClosed: match[2] === "/>",
      children: match[2] === "/>" ? "" : (match[3] ?? ""),
      index: match.index,
    });
  }
  return blocks;
}

/** 埋め込みのランク集合から最上位（model > series > brand）を返す。 */
export function bestRank(ranks) {
  if (ranks.length === 0) return null;
  return [...ranks].sort((a, b) => SNS_RANK_ORDER[b] - SNS_RANK_ORDER[a])[0];
}

export function findSnsRankViolations(sources) {
  const violations = [];
  for (const { filePath, source } of sources) {
    const embeds = findExternalEmbedTags(source);
    const blocks = findArticleSocialProofBlocks(source);

    for (const embed of embeds) {
      const rank = attrValue(embed.attrs, "match");
      const line = lineNumber(source, embed.index);
      if (rank === null) {
        violations.push(
          `${filePath}:${line}: ExternalEmbed is missing a match rank (model / series / brand)`,
        );
      } else if (!SNS_RANKS.includes(rank)) {
        violations.push(
          `${filePath}:${line}: invalid match rank "${rank}" (allowed: ${SNS_RANKS.join(
            ", ",
          )})`,
        );
      }
    }

    for (const block of blocks) {
      const line = lineNumber(source, block.index);
      const bestMatch = attrValue(block.attrs, "bestMatch");
      const hasPosts = /hasPosts=\{(true)\}/.test(block.attrs);
      const blockEmbeds = findExternalEmbedTags(block.children);
      const ranks = blockEmbeds
        .map((embed) => attrValue(embed.attrs, "match"))
        .filter((rank) => SNS_RANKS.includes(rank));

      if (blockEmbeds.length === 0) {
        if (bestMatch !== null) {
          violations.push(
            `${filePath}:${line}: ArticleSocialProof declares bestMatch "${bestMatch}" but contains no embeds`,
          );
        }
        continue;
      }

      if (bestMatch === null || !SNS_RANKS.includes(bestMatch)) {
        violations.push(
          `${filePath}:${line}: ArticleSocialProof with embeds must declare bestMatch (model / series / brand)`,
        );
        continue;
      }

      if (ranks.length === 0) {
        // match 未宣言は上の embed ループが報告する。ここでは bestMatch の整合だけ。
        continue;
      }

      const computed = bestRank(ranks);
      if (computed !== bestMatch) {
        violations.push(
          `${filePath}:${line}: bestMatch "${bestMatch}" does not match the embedded posts (best rank is "${computed}", ${RANK_LABELS[computed]})`,
        );
      }
      if (computed === "brand") {
        violations.push(
          `${filePath}:${line}: SNS section must not be rendered when only brand-rank posts exist (${RANK_LABELS.brand}); remove the section or add model/series posts`,
        );
      }
      if (!hasPosts && blockEmbeds.length > 0) {
        violations.push(
          `${filePath}:${line}: ArticleSocialProof has embeds but hasPosts is not true (section would not render)`,
        );
      }
    }

    for (const embed of embeds) {
      const inside = blocks.some(
        (block) =>
          !block.selfClosed &&
          embed.index > block.index &&
          embed.index <
            block.index +
              source.slice(block.index).indexOf("</ArticleSocialProof>") +
              1,
      );
      if (!inside) {
        violations.push(
          `${filePath}:${lineNumber(
            source,
            embed.index,
          )}: ExternalEmbed must be declared inside an ArticleSocialProof section`,
        );
      }
    }
  }
  return violations;
}

function collectAstroFiles(directory) {
  const files = [];
  if (!existsSync(directory)) return files;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const current = path.join(directory, entry.name);
    if (entry.isDirectory())
      collectAstroFiles(current).forEach((f) => files.push(f));
    else if (entry.isFile() && current.endsWith(".astro")) files.push(current);
  }
  return files;
}

export function validateSnsRanksDirectory(directory = "src/pages/articles") {
  const sources = collectAstroFiles(directory).map((filePath) => ({
    filePath,
    source: readFileSync(filePath, "utf8"),
  }));
  return findSnsRankViolations(sources);
}

async function main() {
  const mode = process.argv[2] ?? "check";
  if (mode !== "check") {
    console.error(`ERROR: unknown mode: ${mode}`);
    process.exitCode = 2;
    return;
  }
  const violations = validateSnsRanksDirectory();
  if (violations.length > 0) {
    console.error("SNS match rank 検査に失敗しました:");
    for (const violation of violations) console.error(`- ${violation}`);
    process.exitCode = 1;
    return;
  }
  console.log(
    "sns ranks ok: all embeds declare a match rank and C-only sections are hidden",
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === import.meta.filename) {
  await main();
}

// アフィリエイトCTA検査（#702 で分離）。広告属性・到達先の契約はここ。

import { ARTICLE_PAGE_PATTERN } from "./article-sections.mjs";
import { isVerifiedRakutenPurchaseDestination } from "../../config/runtime-env.mjs";
import { ARTICLE_LAYOUT } from "../../config/article-layout.mjs";

export const AFFILIATE_URL_PATTERN =
  /https:\/\/(?:[^./]+\.)?(?:a\.r10\.to|r10\.to|hb\.afl\.rakuten\.co\.jp)(?:\/|$)/i;

/**
 * 記事ページの購入 CTA を検査する。
 * @param {string} relative dist からの相対パス
 * @param {string} html レンダリング済み HTML
 * @param {number} expectedCount 期待 CTA 総数
 * @param {Record<string, number> | null} [expectedByPlacement] placement 別の期待枚数（指定時は照合）
 */
export function validateArticleCtas(
  relative,
  html,
  expectedCount,
  expectedByPlacement = null,
) {
  if (!ARTICLE_PAGE_PATTERN.test(relative)) return [];
  const ctaPattern = new RegExp(
    `<a\\b[^>]*data-cta-event="${ARTICLE_LAYOUT.ctaEvent}"[^>]*>[\\s\\S]*?<\\/a>`,
    "gi",
  );
  const tags = [...html.matchAll(ctaPattern)].map(([tag]) => tag);
  const errors = [];
  const isUnavailable =
    /<meta name="article:purchase-link-status" content="unavailable">/i.test(
      html,
    );
  const effectiveExpectedCount = isUnavailable ? 0 : expectedCount;
  const effectiveExpectedByPlacement = isUnavailable ? {} : expectedByPlacement;
  if (tags.length !== effectiveExpectedCount) {
    errors.push(
      `${relative}: expected exactly ${effectiveExpectedCount} purchase CTAs (per config/article-layout.mjs and article productCount), found ${tags.length}`,
    );
  }
  if (effectiveExpectedByPlacement) {
    const actual = {};
    for (const tag of tags) {
      const placement = tag.match(/\bdata-placement="([^"]+)"/i)?.[1] ?? null;
      if (placement === null) continue;
      actual[placement] = (actual[placement] ?? 0) + 1;
    }
    for (const [placement, expected] of Object.entries(
      effectiveExpectedByPlacement,
    )) {
      if ((actual[placement] ?? 0) !== expected) {
        errors.push(
          `${relative}: expected ${expected} purchase CTAs with placement "${placement}", found ${actual[placement] ?? 0} (per config/article-layout.mjs)`,
        );
      }
    }
  }
  for (const [index, tag] of tags.entries()) {
    const href = tag.match(/\bhref="([^"]+)"/i)?.[1] ?? "";
    const rel = tag.match(/\brel="([^"]+)"/i)?.[1] ?? "";
    const placement = tag.match(/\bdata-placement="([^"]+)"/i)?.[1] ?? "";
    if (!ARTICLE_LAYOUT.placements.includes(placement)) {
      errors.push(
        `${relative}: CTA ${index + 1} has unrecognized placement${
          placement ? `: ${placement}` : ""
        } (allowed: ${ARTICLE_LAYOUT.placements.join(", ")})`,
      );
    }
    if (/placeholder/i.test(href)) {
      errors.push(
        `${relative}: CTA ${index + 1} must not contain a placeholder URL`,
      );
    }
    if (AFFILIATE_URL_PATTERN.test(href)) {
      // アフィリエイトCTA: スポンサー表記・nofollow・広告表示を必須にし、
      // pc パラメータの最終到達先が商品詳細ページであることを検証する（#436）。
      // 検索結果ページへのリダイレクトは「商品ページを見る」表示でも誤導になるため禁止。
      if (!/\bsponsored\b/i.test(rel) || !/\bnofollow\b/i.test(rel)) {
        errors.push(
          `${relative}: CTA ${index + 1} is missing sponsored/nofollow rel attributes`,
        );
      }
      if (!/広告/.test(tag)) {
        errors.push(
          `${relative}: CTA ${index + 1} is missing advertising disclosure`,
        );
      }
      if (!isVerifiedRakutenPurchaseDestination(href)) {
        errors.push(
          `${relative}: CTA ${index + 1} affiliate URL must point at a confirmed item detail page (pc parameter), not a search page or opaque shortlink`,
        );
      }
    } else {
      // アフィリエイトでないCTA（未差し替え時の楽天検索フォールバック等）は
      // 許可済みの楽天ホストだけを許し、nofollow を必須にする。
      let isRakutenFallback = false;
      let isRakutenItemDetail = false;
      try {
        const url = new URL(href);
        isRakutenItemDetail =
          url.protocol === "https:" &&
          url.hostname === "item.rakuten.co.jp" &&
          /^\/[^/]+\/[^/]+\/?$/.test(url.pathname);
        isRakutenFallback =
          url.protocol === "https:" &&
          (url.hostname === "search.rakuten.co.jp" ||
            (url.hostname.endsWith(".rakuten.co.jp") && !isRakutenItemDetail));
      } catch {
        // The generic validation below reports malformed URLs.
      }
      if (isRakutenItemDetail) {
        continue;
      }
      if (isRakutenFallback) {
        errors.push(
          `${relative}: CTA ${index + 1} must not use a Rakuten search URL; only a confirmed item detail destination is allowed`,
        );
      } else if (!isRakutenItemDetail) {
        errors.push(
          `${relative}: CTA ${index + 1} is not a confirmed Rakuten affiliate URL`,
        );
      }
    }
  }
  return errors;
}

// 記事末尾の「関連する比較記事」のカード件数を数える。
// セクションは RelatedArticles.astro が aria-labelledby="related-heading" で
// 出力するため、その中にある .article-list-card を数える。

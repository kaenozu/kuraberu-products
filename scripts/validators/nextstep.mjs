/**
 * scripts/validators/nextstep.mjs
 *
 * NextStepBlock（結論直後の「次にすること」）のゲート。
 * ブロック抽出の正規表現は従来どおり。
 * （購入CTAの枚数・配置・URLは ctas.mjs が別途照合する）。
 * - 比較記事（article:content-type="comparison"）: 必ず1つ。
 *   診断リンクは診断ページ（/tools/product-finder/…）を指し、詳細仕様（#specs）より前に置く。
 * - 商品ガイド（article:content-type="guide"）: ブロックを出さない。
 * - 旧形式の独立診断CTA（diagnosis-cta）は全記事で禁止（統合済みブロックへ置換済みのため）。
 */
import { ARTICLE_PAGE_PATTERN } from "./sections.mjs";

export function validateArticleNextStep(relative, html) {
  if (!ARTICLE_PAGE_PATTERN.test(relative)) return [];
  const errors = [];
  const contentType =
    html.match(
      /<meta name="article:content-type" content="(guide|comparison)">/i,
    )?.[1] ?? null;
  const purchaseLinkStatus =
    html.match(
      /<meta name="article:purchase-link-status" content="([^"]+)">/i,
    )?.[1] ?? null;
  const hasPurchaseCtas =
    purchaseLinkStatus === "verified" || purchaseLinkStatus === "direct";
  const legacyCtas = [
    ...html.matchAll(
      /<section\b[^>]*class="[^"]*\bdiagnosis-cta\b[^"]*"[^>]*>/gi,
    ),
  ];
  if (legacyCtas.length > 0) {
    errors.push(
      `${relative}: legacy diagnosis CTA (diagnosis-cta) must be replaced by the next-step block, found ${legacyCtas.length}`,
    );
  }
  const blocks = [
    ...html.matchAll(
      /<section\b[^>]*\bnext-step\b[^>]*\bdata-next-step\b[^>]*>/gi,
    ),
  ];

  if (contentType === "guide") {
    if (blocks.length > 0) {
      errors.push(
        `${relative}: guide article must not render a next-step block, found ${blocks.length}`,
      );
    }
    return errors;
  }

  if (blocks.length !== 1) {
    errors.push(
      `${relative}: comparison article must render exactly one next-step block (section.next-step[data-next-step]), found ${blocks.length}`,
    );
    return errors;
  }

  const section =
    html.match(
      /<section\b[^>]*\bnext-step\b[^>]*\bdata-next-step\b[^>]*>[\s\S]*?<\/section>/i,
    )?.[0] ?? "";
  const buyLinks = [
    ...section.matchAll(
      /<a\b[^>]*class="[^"]*\bnext-step__buy\b[^"]*"[^>]*>/gi,
    ),
  ];
  const expectedBuyLinks = hasPurchaseCtas ? 2 : 0;
  if (buyLinks.length !== expectedBuyLinks) {
    errors.push(
      `${relative}: next-step block must render exactly ${expectedBuyLinks} purchase buttons (next-step__buy), found ${buyLinks.length}`,
    );
  } else {
    for (const [index, link] of buyLinks.entries()) {
      const href = link[0].match(/\bhref="([^"]*)"/i)?.[1] ?? "";
      if (!href || /placeholder|undefined/i.test(href)) {
        errors.push(
          `${relative}: next-step purchase button ${index + 1} must have a real purchase URL, found ${JSON.stringify(href)}`,
        );
      }
    }
  }
  const diagnosisHref =
    section.match(
      /<a\b[^>]*class="[^"]*\bnext-step__diagnosis-link\b[^"]*"[^>]*href="([^"]+)"/i,
    )?.[1] ?? null;
  if (diagnosisHref && !diagnosisHref.startsWith("/tools/product-finder/")) {
    errors.push(
      `${relative}: next-step diagnosis link must target /tools/product-finder/…, found ${JSON.stringify(diagnosisHref)}`,
    );
  }

  const specsIndex = html.indexOf('id="specs"');
  const blockIndex = html.indexOf('class="next-step"');
  if (specsIndex !== -1 && (blockIndex === -1 || blockIndex > specsIndex)) {
    errors.push(
      `${relative}: next-step block must appear before the spec section (#specs)`,
    );
  }
  return errors;
}

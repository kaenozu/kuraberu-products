import type { ArticleMetadata } from "../content/articles";

/**
 * 比較記事カードの「型番行」に出す A/B 商品名（型番・シリーズ名）のペア。
 *
 * 優先順:
 * 1. `aboutProductNames`（JSON-LD 用に明示宣言された商品名）
 * 2. headline の「A」と「B」引用ペア
 * 3. title / headline の「A と B、どっち？」・「A と B を比較」パターン
 *
 * 商品ガイド（productCount = 1）やペアを導出できない記事は null を返し、
 * カードは型番行を描画しない。
 */
export type ComparisonSubjects = readonly [string, string];

export function comparisonSubjects(
  article: Pick<
    ArticleMetadata,
    "productCount" | "headline" | "title" | "aboutProductNames"
  >,
): ComparisonSubjects | null {
  if (article.productCount !== 2) return null;

  if (
    article.aboutProductNames !== undefined &&
    article.aboutProductNames.length >= 2
  ) {
    return [article.aboutProductNames[0], article.aboutProductNames[1]];
  }

  // 「A」と「B」を比較（引用符ペア）
  const quoted = article.headline.match(/「([^」]+)」と「([^」]+)」/);
  if (quoted) return [quoted[1], quoted[2]];

  // 「A と B、どっち？」（title 優先・最後の「と」で分割）
  for (const raw of [article.title, article.headline]) {
    const text = raw.replace(/\s*｜くらべる商品メモ\s*$/, "");
    const question = text.match(/(.+)と(.+?)、どっち？/);
    if (question) {
      const left = question[1].trim();
      const right = question[2].trim();
      if (left && right && left !== right) return [left, right];
    }
  }

  // 「A と B を比較」（headline の末尾パターン）
  const compared = article.headline.match(/(.+)と(.+?)[、。\s]*を比較/);
  if (compared) {
    const left = compared[1].trim();
    const right = compared[2].trim();
    if (left && right && left !== right) return [left, right];
  }

  return null;
}

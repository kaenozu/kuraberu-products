export interface ArticleMetadata {
  id: string;
  path: `/articles/${string}/`;
  title: string;
  headline: string;
  description: string;
  category: string;
  summary: string;
  publishedAt: string;
  modifiedAt: string;
  imagePath?: `/${string}`;
}

const isoDate = /^\d{4}-\d{2}-\d{2}$/;

export function defineArticleMetadata(
  metadata: ArticleMetadata,
): ArticleMetadata {
  for (const [label, value] of [
    ["publishedAt", metadata.publishedAt],
    ["modifiedAt", metadata.modifiedAt],
  ] as const) {
    const parsed = new Date(`${value}T00:00:00Z`);
    if (
      !isoDate.test(value) ||
      Number.isNaN(parsed.getTime()) ||
      parsed.toISOString().slice(0, 10) !== value
    ) {
      throw new TypeError(`${label} must be an ISO 8601 calendar date`);
    }
  }
  if (metadata.modifiedAt < metadata.publishedAt) {
    throw new TypeError("modifiedAt must not precede publishedAt");
  }
  if (!metadata.path.endsWith("/") || !metadata.path.startsWith("/articles/")) {
    throw new TypeError("article path must be a canonical /articles/.../ path");
  }
  if (metadata.imagePath && !metadata.imagePath.startsWith("/")) {
    throw new TypeError("imagePath must be root-relative");
  }
  return Object.freeze({ ...metadata });
}

export const pampersNewbornArticle = defineArticleMetadata({
  id: "pampers-newborn",
  path: "/articles/pampers-newborn/",
  title: "パンパースの新生児用、どっち？｜くらべる商品メモ",
  headline:
    "パンパースの新生児用、どっち？「肌へのいちばん」と「さらさらケア」を比較",
  description:
    "パンパース肌へのいちばんとさらさらケアの新生児用テープを、公式の商品機能と確認状況で比較",
  category: "育児用品",
  summary:
    "「肌へのいちばん」と「さらさらケア」を、公式情報・販売ページ・口コミの確認状況に分けて比較します。",
  publishedAt: "2026-07-31",
  modifiedAt: "2026-07-31",
});

export const articleMetadata = Object.freeze([pampersNewbornArticle]);

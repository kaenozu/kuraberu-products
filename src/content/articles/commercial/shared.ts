import { defineArticleMetadata } from "../types";
import type { ArticleMetadata } from "../types";

import { commercialArticleImages } from "./images";

export type CommercialArticleSeed = {
  id: string;
  title: string;
  headline: string;
  description: string;
  category: string;
  tags: readonly string[];
  audiences: readonly string[];
  uses: readonly string[];
  summary: string;
  leftProduct: string;
  rightProduct: string;
  leftPoint: string;
  rightPoint: string;
  productInfoCheckedAt?: string;
  modifiedAt?: string;
  purchaseLinksCheckedAt?: string;
  purchaseLinkStatus?: "verified" | "unverified";
  officialSources?: readonly {
    label: string;
    url: `https://${string}`;
  }[];
  verifiedRows?: readonly {
    label: string;
    left: string;
    right: string;
  }[];
};

export const createCommercialArticle = (
  seed: CommercialArticleSeed,
): ArticleMetadata =>
  defineArticleMetadata({
    id: seed.id,
    productCount: 2,
    path: `/articles/${seed.id}/`,
    title: seed.title,
    headline: seed.headline,
    description: seed.description,
    category: seed.category,
    tags: seed.tags,
    audiences: seed.audiences,
    uses: seed.uses,
    summary: seed.summary,
    publishedAt: "2026-08-17",
    modifiedAt: seed.modifiedAt ?? "2026-08-17",
    productInfoCheckedAt: seed.productInfoCheckedAt,
    purchaseLinksCheckedAt: seed.purchaseLinksCheckedAt,
    purchaseLinkStatus: seed.purchaseLinkStatus ?? "unverified",
    officialSources: seed.officialSources,
    verifiedRows: seed.verifiedRows,
    imagePath:
      commercialArticleImages[seed.id]?.left ??
      commercialArticleImages[seed.id]?.right,
    aboutProductNames: [seed.leftProduct, seed.rightProduct],
    changeLog: [
      {
        date: "2026-08-17",
        summary:
          "売れ筋カテゴリの比較候補として初稿を追加。購入前に公式仕様と販売ページを確認する構成。",
      },
    ],
  });

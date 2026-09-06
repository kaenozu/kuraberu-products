import type { ArticleMetadata } from "../types";
import { defineArticleMetadata } from "../types";
import type { CommercialArticleSeed } from "./types";
import { commercialArticleImages } from "./images";

const createCommercialArticle = (
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
    publishedAt: seed.publishedAt,
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
          "公式仕様の比較表を更新。購入前に公式仕様と販売ページを確認する構成。",
      },
    ],
  });

export { createCommercialArticle };

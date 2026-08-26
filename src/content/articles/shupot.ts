import { defineArticleMetadata } from "./types";

export const shupotArticle = defineArticleMetadata({
  id: "shupot",
  productCount: 2,
  path: "/articles/shupot/",
  title: "ピジョンの鼻吸い器、どっち？｜くらべる商品メモ",
  headline:
    "ピジョンの鼻吸い器、どっち？「電動 シュポット」と「手動 シュポットポンプ＋フィット鼻ノズル」を比較",
  description:
    "ピジョン電動鼻吸い器シュポットと手動鼻吸い器シュポットポンプを、公式情報・電源・お手入れ・価格で比較",
  category: "育児用品",
  tags: ["鼻吸い器", "ピジョン", "シュポット"],
  audiences: ["乳児の保護者", "鼻吸い器の購入を検討中の人"],
  uses: ["鼻水の吸引", "電源・価格で選ぶ"],
  summary:
    "「電動 シュポット」と「手動 シュポットポンプ＋フィット鼻ノズル」を、公式情報・お手入れ・価格・確認状況に分けて比較します。",
  publishedAt: "2026-08-10",
  modifiedAt: "2026-08-17",
  productInfoCheckedAt: "2026-08-10",
  purchaseLinkStatus: "unverified",
  imagePath: "/products/shupot-dendo.jpg",
  changeLog: [
    {
      date: "2026-08-17",
      summary:
        "記事本文を新テンプレートへ短縮（1行結論→比較→違い→どっち向き→詳細→FAQ）。途中CTAを削除し、購入カードは記事末尾に統一。",
    },
    {
      date: "2026-08-14",
      summary:
        "記事末尾に購入カード（article-end）を追加（標準レイアウト適用）",
    },
    {
      date: "2026-08-10",
      summary:
        "初回公開。ピジョン公式ショップの商品情報・安全に関するお知らせを確認。",
    },
  ],
});

import { defineArticleMetadata } from "./types";

export const yamazakiMagnetKitchenShelfArticle = defineArticleMetadata({
  id: "yamazaki-magnet-kitchen-shelf-240005-vs-241830",
  productCount: 2,
  path: "/articles/yamazaki-magnet-kitchen-shelf-240005-vs-241830/",
  title: "山崎実業 マグネットキッチン棚、どっち？｜くらべる商品メモ",
  headline: "山崎実業のマグネットキッチン棚、Sとワイドを比較",
  description:
    "山崎実業 マグネットキッチン棚 タワー Sとワイドを、公式のサイズ・内寸・重量・耐荷重で比較",
  category: "キッチン収納",
  tags: ["山崎実業", "tower", "キッチン収納", "マグネット収納"],
  audiences: ["キッチンの壁面収納を選びたい人", "設置幅と容量を比べたい人"],
  uses: ["キッチン用品を置く", "マグネットで収納する", "設置面を確認する"],
  summary:
    "マグネットキッチン棚 タワー Sとワイドを、山崎実業公式のサイズ・耐荷重・設置条件に分けて比較します。",
  publishedAt: "2026-09-11",
  modifiedAt: "2026-09-11",
  productInfoCheckedAt: "2026-09-11",
  purchaseLinksCheckedAt: "2026-09-11",
  purchaseLinkStatus: "unverified",
  imagePath: "/products/yamazaki-magnet-kitchen-shelf-s.jpg",
  aboutProductNames: [
    "山崎実業 マグネットキッチン棚 タワー S",
    "山崎実業 マグネットキッチン棚 タワー ワイド",
  ],
  changeLog: [
    {
      date: "2026-08-19",
      summary:
        "初回実装。山崎実業公式の商品ページと楽天公式生成画面の短縮URLを確認。",
    },
    {
      date: "2026-09-11",
      summary:
        "公式商品ページ2件の到達性を再確認し、最新mainへ移植。購入リンクは検索ページに遷移する短縮URLだったため fail-closed で未設定とし、確認済み商品詳細ページの用意後に付与する。",
    },
  ],
});

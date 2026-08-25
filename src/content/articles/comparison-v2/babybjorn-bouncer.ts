import { defineComparisonV2 } from './_base';

export const entry = defineComparisonV2("babybjorn-bouncer", {
    left: {
      brand: "ベビービョルン",
      line: "Bliss",
      tagline: "最新モデルでデザインのバリエーションから選びたい人の候補",
      image: "/products/babybjorn-bouncer-bliss.jpg",
      imageAlt: "ベビービョルン Bliss",
      officialHref:
        "https://www.babybjorn.jp/products/baby-bouncers/bouncer-bliss/",
      guidePoints: ["最新モデルでデザインのバリエーションから選びたい人の候補"],
      productId: "babybjorn-bouncer-bliss",
    },
    right: {
      brand: "ベビービョルン",
      line: "バランスソフト",
      tagline: "2トーンの落ち着いたデザインを好む人の候補",
      image: "/products/babybjorn-bouncer-balance.jpg",
      imageAlt: "ベビービョルン バランスソフト",
      officialHref:
        "https://www.babybjorn.jp/products/baby-bouncers/bouncer-balance-soft/sky-blue-white-mesh-light-grey/",
      guidePoints: ["2トーンの落ち着いたデザインを好む人の候補"],
      productId: "babybjorn-bouncer-balance",
    },
    rows: [
      {
        label: "シートの素材とデザイン",
        left: "最新モデル。シートカバーをより柔らかく仕上げたモデル。3Dジャージー（放熱効果）・コットン・Air（メッシュ）・ウーブンの素材展開で20種類以上のバリエーション。",
        right:
          "2トーンの生地が特長。コットン・Air（メッシュ）・ウーブン/ジャージーの素材展開。直近カラーバリエーションが増加中。",
      },
      {
        label: "対象月齢・対象体重",
        left: "生後約1ヶ月〜2才くらい（最大体重13kg）。バウンサーとしての使用は体重9kgまで。",
        right:
          "生後約1ヶ月〜2才くらい（最大体重13kg）。バウンサーとしての使用は体重9kgまで。",
      },
      {
        label: "リクライニング",
        left: "3段階リクライニング。",
        right: "3段階リクライニング。「快適に長く使える」と案内。",
      },
      {
        label: "独自機能",
        left: "セルフバウンシング構造（赤ちゃん自身の動きでゆらゆら揺れる構造）。",
        right: "セルフバウンシング構造。",
      },
      {
        label: "製品サイズ・重量",
        left: "幅約39×奥行約89×高さ46〜58cm。約2.1kg。",
        right: "幅約39×奥行約89×高さ46〜58cm。約2.1kg。",
      },
      {
        label: "安全基準・保証",
        left: "SG認証。ASTM・ENに準拠。2年保証（公式楽天市場店の案内）。",
        right: "SG認証。ASTM・ENに準拠。2年保証（公式楽天市場店の案内）。",
      },
      {
        label: "公式ショップ価格（2026-08-10確認）",
        left: "カラー限定SALE 17,600円〜19,800円（カラー・素材により変動）。",
        right: "カラー限定SALE 17,600円〜19,800円（カラー・素材により変動）。",
      },
    ],
  });

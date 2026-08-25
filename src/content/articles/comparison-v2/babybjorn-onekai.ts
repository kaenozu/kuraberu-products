import { defineComparisonV2 } from "./_base";

export const entry = defineComparisonV2("babybjorn-onekai", {
  left: {
    brand: "ベビービョルン",
    line: "ONE KAI",
    tagline: "新生児から長く使えて4WAYで多彩な抱き方をしたい人の候補",
    image: "/products/babybjorn-onekai.jpg",
    imageAlt: "ベビービョルン ONE KAI",
    officialHref:
      "https://www.babybjorn.jp/products/baby-carriers/baby-carrier-one-air/",
    guidePoints: ["新生児から長く使えて4WAYで多彩な抱き方をしたい人の候補"],
    productId: "babybjorn-onekai",
  },
  right: {
    brand: "ベビービョルン",
    line: "MOVE",
    tagline: "通気性を重視して長めに使いたい人の候補",
    image: "/products/babybjorn-move.jpg",
    imageAlt: "ベビービョルン MOVE",
    officialHref:
      "https://www.babybjorn.jp/products/baby-carriers/baby-carrier-move/navy-blue-3d-mesh/",
    guidePoints: ["通気性を重視して長めに使いたい人の候補"],
    productId: "babybjorn-move",
  },
  rows: [
    {
      label: "対象月齢・対象体重",
      left: "0カ月〜約36ヶ月。体重3.5〜15kg、ヒップ約〜160cm。",
      right: "0カ月〜約15ヶ月。体重3.2〜12kg、ヒップ約〜120cm。",
    },
    {
      label: "抱っこの種類",
      left: "4通り：対面抱っこ（ハイポジション）・対面抱っこ（ローポジション）・前向き抱っこ・おんぶ。",
      right: "2通り。",
    },
    {
      label: "ショルダーとウエストのサポート",
      left: "パッド入りショルダーベルト（スッキリ見え・肩にぴったりフィット）＋幅広ウエストベルト（おんぶ時にもスマート）。",
      right: "ショルダーパッド・ウェストベルトの項目は公式比較表で「ー」。",
    },
    {
      label: "素材",
      left: "メッシュ・コットン。",
      right: "メッシュ（フルメッシュ素材で通気性抜群）。",
    },
    { label: "製品重量", left: "約1000g。", right: "約860g。" },
    { label: "ヘッドサポート", left: "○", right: "○" },
    {
      label: "保証期間",
      left: "2年（正規保証1年＋ユーザー登録1年）。",
      right: "2年（正規保証1年＋ユーザー登録1年）。",
    },
    {
      label: "公式ショップ価格（2026-08-10確認）",
      left: "27,500円。",
      right: "22,000円。",
    },
  ],
});

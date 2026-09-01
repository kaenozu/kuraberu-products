import { defineComparisonV2 } from "./_base";

export const entry = defineComparisonV2("babybjorn", {
  left: {
    brand: "ベビービョルン",
    line: "HARMONY",
    tagline: "新生児から長く使えて多彩な抱き方をしたい人の候補",
    image: "/products/babybjorn-harmony.jpg",
    imageAlt: "ベビービョルン HARMONY",
    officialHref:
      "https://www.babybjorn.jp/products/baby-carriers/baby-carrier-harmony/grey-beige-3d-mesh/",
    guidePoints: ["新生児から長く使えて多彩な抱き方をしたい人の候補"],
    productId: "babybjorn-harmony",
  },
  right: {
    brand: "ベビービョルン",
    line: "MINI",
    tagline: "新生児期の手軽さと価格を優先したい人の候補",
    image: "/products/babybjorn-mini.jpg",
    imageAlt: "ベビービョルン MINI",
    officialHref:
      "https://www.babybjorn.jp/products/baby-carriers/baby-carrier-mini/",
    guidePoints: ["新生児期の手軽さと価格を優先したい人の候補"],
    productId: "babybjorn-mini",
  },
  rows: [
    {
      label: "対象月齢・対象体重",
      left: "0カ月〜約36ヶ月。体重3.2〜15kg、ヒップ約〜160cm。",
      right: "0カ月〜約12ヶ月。体重3.2〜11kg、ヒップ約〜120cm。",
    },
    {
      label: "抱っこの種類",
      left: "4通り：対面抱っこ（ハイポジション）・対面抱っこ（ローポジション）・前向き抱っこ・おんぶ。",
      right: "2通り。対面と前向きを中心としたシンプル設計。",
    },
    {
      label: "肩と腰のサポート",
      left: "幅広なパッド入りショルダーベルト＋エルゴノミックランバーサポート付き幅広ウエストベルト。腰に荷重を分散し肩の負担を軽減。",
      right: "パッド入りショルダーベルト。ウエストベルトなし。",
    },
    { label: "製品重量", left: "約892g。", right: "約500g。" },
    {
      label: "素材",
      left: "メッシュ・3Dジャージー。",
      right: "コットン・メッシュ。",
    },
    {
      label: "保証期間",
      left: "2年（正規保証1年＋ユーザー登録1年）。",
      right: "2年（正規保証1年＋ユーザー登録1年）。",
    },
    {
      label: "公式ショップ価格（2026-08-10確認）",
      left: "27,280円〜。",
      right: "9,680円〜。",
    },
  ],
});

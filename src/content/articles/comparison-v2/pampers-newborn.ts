import { defineComparisonV2 } from "./_base";

export const entry = defineComparisonV2("pampers-newborn", {
  left: {
    brand: "パンパース 新生児用",
    line: "肌へのいちばん",
    tagline: "肌へのやさしさに関する機能を確認したい人の候補",
    image: "/products/pampers-premium-newborn.jpg",
    imageAlt: "パンパース 新生児用 肌へのいちばん",
    officialHref:
      "https://www.jp.pampers.com/products/pampers-premium-line-tape",
    guidePoints: ["肌へのやさしさに関する機能を確認したい人の候補"],
    productId: "pampers-premium-newborn",
  },
  right: {
    brand: "パンパース 新生児用",
    line: "さらさらケア",
    tagline: "モレ・ムレ対策の機能を確認したい人の候補",
    image: "/products/pampers-sarasara-newborn.jpg",
    imageAlt: "パンパース 新生児用 さらさらケア",
    officialHref: "https://www.jp.pampers.com/products/pampers-mainline-tape",
    guidePoints: ["モレ・ムレ対策の機能を確認したい人の候補"],
    productId: "pampers-sarasara-newborn",
  },
  rows: [
    {
      label: "公式が案内する主な機能",
      left: "ゆるうんちを素早く吸収、ワセリン配合シート、ふかふか肌ざわり",
      right: "ゆるうんちモレガード、のびのびフィットテープ、進化した吸収体",
    },
    {
      label: "新生児サイズ",
      left: "5kgまで。小さめ新生児3,000gも掲載",
      right: "5kgまで",
    },
  ],
  diagnosisHref: "/tools/product-finder/diaper/",
});

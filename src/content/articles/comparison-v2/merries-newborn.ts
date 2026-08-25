import { defineComparisonV2 } from './_base';

export const entry = defineComparisonV2("merries-newborn", {
    left: {
      brand: "メリーズ 新生児用",
      line: "ファーストプレミアム",
      tagline: "肌へのやさしさに関する機能を確認したい人の候補",
      image: "/products/merries-fp-newborn.jpg",
      imageAlt: "メリーズ 新生児用 ファーストプレミアム",
      officialHref: "https://www.kao.co.jp/merries/products/fp/",
      guidePoints: ["肌へのやさしさに関する機能を確認したい人の候補"],
      productId: "merries-fp-newborn",
    },
    right: {
      brand: "メリーズ 新生児用",
      line: "ずっと肌さらエアスルー",
      tagline: "ムレ・おしっこ対策の機能を確認したい人の候補",
      image: "/products/merries-airsle-newborn.jpg",
      imageAlt: "メリーズ 新生児用 ずっと肌さらエアスルー",
      officialHref: "https://www.kao.co.jp/merries/products/air/",
      guidePoints: ["ムレ・おしっこ対策の機能を確認したい人の候補"],
      productId: "merries-airsle-newborn",
    },
    rows: [
      {
        label: "公式が案内する主な機能",
        left: "カシミヤタッチの肌ざわり、吸収面を抗菌、アルガンオイル配合（肌に触れるシート）",
        right:
          "シート表面に目に見えない穴が50億個以上（通気）、おしっこロック、縦横の溝で瞬間吸収",
      },
      {
        label: "新生児サイズ",
        left: "3,000gまで・5,000gまでの2展開。S・Mサイズもあり",
        right: "お誕生（5,000gまで）。S・Mサイズもあり",
      },
    ],
    diagnosisHref: "/tools/product-finder/diaper/",
  });

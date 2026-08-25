import { defineComparisonV2 } from './_base';

export const entry = defineComparisonV2("merries-pants", {
    left: {
      brand: "メリーズ パンツタイプ",
      line: "ファーストプレミアム",
      tagline: "肌へのやさしさに関する機能を確認したい人の候補",
      image: "/products/merries-fp-newborn.jpg",
      imageAlt: "メリーズ パンツタイプ ファーストプレミアム",
      officialHref: "https://www.kao.co.jp/merries/products/fp/",
      guidePoints: ["肌へのやさしさに関する機能を確認したい人の候補"],
      productId: "merries-fp-pants",
    },
    right: {
      brand: "メリーズ パンツタイプ",
      line: "ずっと肌さらエアスルー",
      tagline: "ムレ・おしっこ対策の機能を確認したい人の候補",
      image: "/products/merries-airsle-newborn.jpg",
      imageAlt: "メリーズ パンツタイプ ずっと肌さらエアスルー",
      officialHref: "https://www.kao.co.jp/merries/products/air/",
      guidePoints: ["ムレ・おしっこ対策の機能を確認したい人の候補"],
      productId: "merries-airsle-pants",
    },
    rows: [
      {
        label: "公式が案内する主な機能",
        left: "カシミヤタッチの肌ざわり、吸収面を抗菌、アルガンオイル配合（肌に触れるシート）、100%通気素材",
        right:
          "シート表面に目に見えない穴が50億個以上（通気）、おしっこロック、縦横の溝で瞬間吸収",
      },
      {
        label: "パンツタイプのサイズ展開",
        left: "S（4〜8kg）・M（6〜12kg）・L（9〜14kg）・ビッグ（12〜22kg）",
        right: "S（4〜8kg）・M（6〜12kg）・L（9〜14kg）・ビッグ（12〜22kg）",
      },
      {
        label: "機能のサイズ別注記",
        left: "背中モレ安心のフィットギャザーはS・Mサイズで案内（足まわりガイド付き）",
        right:
          "通気穴・瞬間吸収の説明は「テープタイプ全サイズ、パンツタイプS/Mサイズ」の注記",
      },
    ],
    diagnosisHref: "/tools/product-finder/diaper/",
  });

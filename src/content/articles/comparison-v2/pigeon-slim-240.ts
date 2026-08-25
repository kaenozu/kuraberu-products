import { defineComparisonV2 } from './_base';

export const entry = defineComparisonV2("pigeon-slim-240", {
    left: {
      brand: "ピジョン",
      line: "母乳実感 240ml",
      tagline: "広口タイプで調乳しやすさを重視する人",
      image: "/products/pigeon-bottle-ppsu240.jpg",
      imageAlt: "ピジョン 母乳実感 240ml",
      officialHref: "https://products.pigeon.co.jp/item/index-2378.html",
      guidePoints: ["広口タイプで調乳しやすさを重視する人"],
      productId: "pigeon-ppsu-240",
    },
    right: {
      brand: "ピジョン",
      line: "スリムタイプ 240ml",
      tagline: "細身で持ちやすさ・転がりにくさを重視する人",
      image: "/products/pigeon-slim-pp240.jpg",
      imageAlt: "ピジョン スリムタイプ 240ml",
      officialHref: "https://products.pigeon.co.jp/item/index-1774.html",
      guidePoints: ["細身で持ちやすさ・転がりにくさを重視する人"],
      productId: "pigeon-slim-240",
    },
    rows: [
      {
        label: "ボトルの形状",
        left: "広口タイプ（公式「持ちやすい太さと使いやすい広口ボトル」）",
        right: "スリムタイプ（公式「転がりにくく、持ちやすい形」）",
      },
      {
        label: "付属乳首（240ml）",
        left: "Mサイズ・Y字形（3ヵ月頃から）",
        right: "Mサイズ・丸穴（4ヵ月頃〜）",
      },
      {
        label: "乳首のラインナップ",
        left: "6サイズ（SS・S・M・L・LL・3L）",
        right: "4サイズ（S・M・Y・L）",
      },
      {
        label: "乳首の互換性（公式の明記）",
        left: "母乳実感の乳首はスリムタイプ哺乳びんに使用不可と明記",
        right: "スリムタイプの乳首ページには母乳実感への使用可否の明記なし",
      },
    ],
    diagnosisHref: "/tools/product-finder/baby-bottle/",
  });

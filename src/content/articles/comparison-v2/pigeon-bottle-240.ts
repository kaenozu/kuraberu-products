import { defineComparisonV2 } from './_base';

export const entry = defineComparisonV2("pigeon-bottle-240", {
    left: {
      brand: "母乳実感",
      line: "耐熱ガラス製（240ml）",
      tagline: "自宅中心で、汚れの落ちやすさを重視する人",
      image: "/products/pigeon-bottle-glass240.jpg",
      imageAlt: "母乳実感 耐熱ガラス製（240ml）",
      officialHref: "https://products.pigeon.co.jp/item/index-2382.html",
      guidePoints: ["自宅中心で、汚れの落ちやすさを重視する人"],
      productId: "pigeon-glass-240",
    },
    right: {
      brand: "母乳実感",
      line: "プラスチック製（PPSU）（240ml）",
      tagline: "外出時にも使い、軽さ・割れにくさを重視する人",
      image: "/products/pigeon-bottle-ppsu240.jpg",
      imageAlt: "母乳実感 プラスチック製（PPSU）（240ml）",
      officialHref: "https://products.pigeon.co.jp/item/index-2378.html",
      guidePoints: ["外出時にも使い、軽さ・割れにくさを重視する人"],
      productId: "pigeon-ppsu-240",
    },
    rows: [
      {
        label: "びんの素材",
        left: "ほうけい酸ガラス",
        right: "ポリフェニルサルホン（PPSU）",
      },
      {
        label: "公式Q&Aで案内される長所",
        left: "汚れが落ちやすいので清潔",
        right: "軽い、落としても割れにくい",
      },
      {
        label: "公式Q&Aで案内される注意点",
        left: "重い／欠け・割れることがある",
        right: "ガラスに比べてキズがつきやすく、色やにおいなどが吸着しやすい",
      },
    ],
    diagnosisHref: "/tools/product-finder/baby-bottle/",
  });

import { defineComparisonV2 } from './_base';

export const entry = defineComparisonV2("pigeon-bottle-160-240", {
    left: {
      brand: "母乳実感",
      line: "160ml",
      tagline: "新生児期から使う人、まず小容量を用意したい人",
      image: "/products/pigeon-bottle-160-240-160ml.jpg",
      imageAlt: "母乳実感 160ml",
      officialHref: "https://products.pigeon.co.jp/item/index-2377.html",
      guidePoints: ["新生児期から使う人、まず小容量を用意したい人"],
      productId: "pigeon-160",
    },
    right: {
      brand: "母乳実感",
      line: "240ml",
      tagline: "哺乳量が増えてきた人、大きめの容量を用意したい人",
      image: "/products/pigeon-bottle-160-240-240ml.jpg",
      imageAlt: "母乳実感 240ml",
      officialHref: "https://products.pigeon.co.jp/item/index-2378.html",
      guidePoints: ["哺乳量が増えてきた人、大きめの容量を用意したい人"],
      productId: "pigeon-ppsu-240",
    },
    rows: [
      { label: "容量", left: "160ml", right: "240ml" },
      {
        label: "付属の乳首",
        left: "母乳実感 乳首 SSサイズ・吸い穴 丸穴",
        right: "母乳実感 乳首 Mサイズ・吸い穴 Y字形",
      },
      {
        label: "対象月齢の目安",
        left: "0ヵ月から",
        right: "3ヵ月頃から",
      },
    ],
    diagnosisHref: "/tools/product-finder/baby-bottle/",
  });

import { defineComparisonV2 } from './_base';

export const entry = defineComparisonV2("babybjorn-potty", {
    left: {
      brand: "ベビービョルン",
      line: "スマートポッティ",
      tagline: "コンパクトに収納できるおまるを探す人の候補",
      image: "/products/babybjorn-smart-potty.jpg",
      imageAlt: "ベビービョルン スマートポッティ",
      officialHref: "https://www.babybjorn.jp/products/bathroom/smart-potty/",
      guidePoints: ["コンパクトに収納できるおまるを探す人の候補"],
      productId: "babybjorn-smart-potty",
    },
    right: {
      brand: "ベビービョルン",
      line: "ポッティチェア",
      tagline: "長い時間座れるイス型おまるを探す人の候補",
      image: "/products/babybjorn-potty-chair.jpg",
      imageAlt: "ベビービョルン ポッティチェア",
      officialHref: "https://www.babybjorn.jp/products/bathroom/potty-chair/",
      guidePoints: ["長い時間座れるイス型おまるを探す人の候補"],
      productId: "babybjorn-potty-chair",
    },
    rows: [
      {
        label: "形状",
        left: "収納式のコンパクトなポッティ。公式の案内では「スペースの限られたバスルームに必要なデザインと機能をコンパクトにまとめた」と記載。",
        right:
          "イス型オマル。公式の案内では「お子さまが長い時間オマルに座る場合、イス型オマルが最適」と記載。柔らかいフォルムの人間工学デザイン。",
      },
      {
        label: "サイズ",
        left: "幅約25.5×奥行き約32×高さ約17.5cm。",
        right: "幅約32×奥行き約33×高さ約33cm。",
      },
      {
        label: "重量・素材",
        left: "約540g。素材はポリプロピレン。",
        right: "約870g。素材はポリプロピレン。",
      },
      {
        label: "中桶",
        left: "収納式の構造（中桶の有無は公式商品ページで確認）。",
        right: "中桶付き。中桶を取り外してそのまま流せる。",
      },
      {
        label: "公式ショップ価格（2026-08-10確認）",
        left: "3,080円。",
        right: "4,180円。",
      },
    ],
  });

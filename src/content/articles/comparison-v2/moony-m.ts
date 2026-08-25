import { defineComparisonV2 } from './_base';

export const entry = defineComparisonV2("moony-m", {
    left: {
      brand: "ムーニー",
      line: "低刺激であんしん",
      tagline: "うんち水分吸収シートの機能を確認したい人の候補",
      image: "/products/moony-teishigeki-m.jpg",
      imageAlt: "ムーニー 低刺激であんしん",
      officialHref: "https://jp.moony.com/ja/products/nmn1.html",
      guidePoints: ["うんち水分吸収シートの機能を確認したい人の候補"],
      productId: "moony-teishigeki-m",
    },
    right: {
      brand: "ムーニー",
      line: "マシュマロ肌ごこちモレ安心",
      tagline: "無添加弱酸性素材とゆるうんちストッパーを確認したい人の候補",
      image: "/products/moony-mashumaro-m.jpg",
      imageAlt: "ムーニー マシュマロ肌ごこちモレ安心",
      officialHref: "https://jp.moony.com/ja/products/mn.html",
      guidePoints: [
        "無添加弱酸性素材とゆるうんちストッパーを確認したい人の候補",
      ],
      productId: "moony-mashumaro-m",
    },
    rows: [
      {
        label: "うんちへの対策",
        left: "うんち水分吸収シートで、ゆるうんちの水分を下層へ吸収し、肌への付着を抑える設計。おしりガイドも搭載。",
        right: "背中と足回りにゆるうんちストッパーを搭載。",
      },
      {
        label: "無添加の内容",
        left: "Mを含む新生児〜Mは、香料・ラテックス・合成着色料の3成分無添加。",
        right:
          "全サイズで、石油由来油剤・香料・ラテックス・合成着色料の4成分無添加。",
      },
      {
        label: "Mサイズの内容量と主な機能",
        left: "Mは6〜11kg、46枚入り。うんち水分吸収シートとおしりガイドが特徴。",
        right:
          "Mは6〜11kg、54枚入り。無添加弱酸性素材、ゆるうんちストッパー、お知らせサイン、最大12時間吸収が案内されている。",
      },
    ],
    diagnosisHref: "/tools/product-finder/diaper/",
  });

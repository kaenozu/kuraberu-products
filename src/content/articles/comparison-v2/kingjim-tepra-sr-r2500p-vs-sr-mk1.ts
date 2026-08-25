import { defineComparisonV2 } from './_base';

export const entry = defineComparisonV2(
    "kingjim-tepra-sr-r2500p-vs-sr-mk1",
    {
      left: {
        brand: "キングジム テプラ PRO",
        line: "SR-R2500P",
        tagline: "軽さとコンパクトさなら",
        image: "/products/kingjim-sr-r2500p.jpg",
        imageAlt: "キングジム テプラ PRO SR-R2500P",
        officialHref: "https://www.kingjim.co.jp/products/tepra/sr-r2500p.html",
        guidePoints: ["コンパクトさと軽さ、18mmまでのテープ幅で使いたい人向け"],
      },
      right: {
        brand: "キングジム テプラ PRO",
        line: "SR-MK1",
        tagline: "24mm幅とAC電源なら",
        image: "/products/kingjim-sr-mk1.jpg",
        imageAlt: "キングジム テプラ PRO SR-MK1",
        officialHref: "https://www.kingjim.co.jp/products/tepra/sr-mk1.html",
        guidePoints: [
          "24mmまでの幅広いテープとACアダプター対応を使いたい人向け",
        ],
      },
      rows: [
        {
          label: "対応テープ幅",
          left: "4〜18mm",
          right: "4〜24mm",
          highlight: "right",
          highlightNote: "24mmまで",
        },
        {
          label: "質量（電池・テープ除く）",
          left: "約420g",
          right: "約470g",
          highlight: "left",
          highlightNote: "約50g軽い",
        },
        {
          label: "電源",
          left: "単3形電池×6本",
          right: "ACアダプター／単3形電池×6本",
          highlight: "right",
        },
        {
          label: "本体寸法",
          left: "約54×134×145mm",
          right: "約55×133×146mm",
          highlight: null,
        },
        {
          label: "カッター",
          left: "オートカッター",
          right: "オートカッター",
          highlight: null,
        },
      ],
    },
  );

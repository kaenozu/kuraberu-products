import { defineComparisonV2 } from './_base';

export const entry = defineComparisonV2(
    "panasonic-es-lt4b-vs-es-lv7j",
    {
      left: {
        brand: "パナソニック",
        line: "ES-LT4B",
        tagline: "軽さと3枚刃なら",
        image: "/products/panasonic-es-lt4b.jpg",
        imageAlt: "パナソニック ラムダッシュ ES-LT4B",
        officialHref: "https://panasonic.jp/shaver/products/ES-LT4B.html",
        guidePoints: ["軽さと3枚刃、本体のコンパクトさを確認したい人向け"],
      },
      right: {
        brand: "パナソニック",
        line: "ES-LV7J",
        tagline: "5枚刃と洗浄充電器なら",
        image: "/products/panasonic-es-lv7j.jpg",
        imageAlt: "パナソニック ラムダッシュPRO ES-LV7J",
        officialHref: "https://panasonic.jp/shaver/products/ES-LV7J.html",
        guidePoints: ["5枚刃と全自動洗浄充電器を確認したい人向け"],
      },
      rows: [
        { label: "刃数", left: "3枚刃", right: "5枚刃", highlight: "right" },
        {
          label: "本体質量（キャップ除く）",
          left: "約155g",
          right: "約210g",
          highlight: "left",
          highlightNote: "約55g軽い",
        },
        {
          label: "本体寸法（高さ×幅×奥行）",
          left: "15.5×6.4×5.0cm",
          right: "16.7×7.2×5.9cm",
        },
        {
          label: "充電・付属品",
          left: "ACアダプター充電",
          right: "全自動洗浄充電器・ACアダプター充電",
          highlight: "right",
        },
      ],
    },
  );

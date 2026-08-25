import { defineComparisonV2 } from "./_base";

export const entry = defineComparisonV2("panasonic-nt-t501-vs-nt-d700", {
  left: {
    brand: "パナソニック",
    line: "NT-T501",
    tagline: "4枚焼きなら",
    image: "/products/panasonic-nt-t501.jpg",
    imageAlt: "パナソニック オーブントースター NT-T501",
    officialHref: "https://panasonic.jp/toaster/products/NT-T501.html",
    guidePoints: ["4枚焼きと火力5段階を確認して選びたい人向け"],
  },
  right: {
    brand: "パナソニック",
    line: "NT-D700",
    tagline: "温度調節なら",
    image: "/products/panasonic-nt-d700.jpg",
    imageAlt: "パナソニック オーブントースター ビストロ NT-D700",
    officialHref: "https://panasonic.jp/toaster/products/NT-D700.html",
    guidePoints: [
      "自動メニュー・温度調節・インテリジェント制御を確認したい人向け",
    ],
  },
  rows: [
    {
      label: "トースト枚数",
      left: "4枚",
      right: "2枚",
      highlight: "left",
      highlightNote: "2枚多い",
    },
    { label: "消費電力", left: "1200W", right: "1300W" },
    {
      label: "本体寸法",
      left: "幅34.5×奥行32.9×高さ21.9cm",
      right: "幅34.1×奥行32.8×高さ26.9cm",
    },
    {
      label: "火力・温度調節",
      left: "火力5段階",
      right: "120～260℃・8段階",
      highlight: "right",
      highlightNote: "温度調節あり",
    },
    { label: "本体質量", left: "3.5kg", right: "約4.3kg" },
  ],
});

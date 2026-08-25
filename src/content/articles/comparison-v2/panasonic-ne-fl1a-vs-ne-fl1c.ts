import { defineComparisonV2 } from "./_base";

export const entry = defineComparisonV2("panasonic-ne-fl1a-vs-ne-fl1c", {
  left: {
    brand: "パナソニック",
    line: "NE-FL1A",
    tagline: "NE-FL1Aの仕様なら",
    image: "/products/panasonic-ne-fl1a.jpg",
    imageAlt: "パナソニック NE-FL1A",
    officialHref: "https://panasonic.jp/range/products/NE-FL1A.html",
    guidePoints: [
      "NE-FL1Aの公式仕様を確認して選びたい",
      "自動メニュー数2で足りる",
      "庫内幅321mmを確認して置きたい",
    ],
  },
  right: {
    brand: "パナソニック",
    line: "NE-FL1C",
    tagline: "軽さ・庫内幅なら",
    image: "/products/panasonic-ne-fl1c.png",
    imageAlt: "パナソニック NE-FL1C",
    officialHref: "https://panasonic.jp/range/products/NE-FL1C.html",
    guidePoints: [
      "本体を少しでも軽くしたい（8.9kg）",
      "庫内幅332mmを確認して選びたい",
      "自動メニュー数3を使いたい",
    ],
  },
  rows: [
    {
      label: "本体質量",
      left: "9.5kg",
      right: "8.9kg",
      highlight: "right",
      highlightNote: "0.6kg軽い",
      bar: { left: 9.5, right: 8.9 },
    },
    {
      label: "庫内幅",
      left: "321mm",
      right: "332mm",
      highlight: "right",
      highlightNote: "11mm広い",
      bar: { left: 321, right: 332 },
    },
    {
      label: "自動メニュー数",
      left: "自動メニュー数2",
      right: "自動メニュー数3",
      highlight: "right",
      highlightNote: "1つ多い",
      bar: { left: 2, right: 3 },
    },
    {
      label: "総庫内容量",
      left: "22L",
      right: "22L",
    },
  ],
  commonNote:
    "どちらも同じ：総庫内容量22L・フラット庫内・最高出力1000W（最大1分30秒）・外形寸法 幅488mm×奥行380mm×高さ298mm。",
});

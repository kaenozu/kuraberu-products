import { defineComparisonV2 } from "./_base";

export const entry = defineComparisonV2("tiger-mta-j050-guide", {
  left: {
    brand: "タイガー",
    line: "MTA-J050",
    tagline: "0.5L・軽さを優先するなら",
    image: "/products/tiger-mta-j050.jpg",
    imageAlt: "タイガー MTA-J050",
    officialHref:
      "https://www.tiger-corporation.com/ja/jpn/product/vacuum-insulated-products/mta-j/",
    guidePoints: [
      "容量0.5Lで持ち歩きやすい",
      "本体質量約0.26kgで軽い",
      "通勤・通学など日常の持ち歩き向け",
    ],
    productId: "tiger-mta-j050",
  },
  right: {
    brand: "タイガー",
    line: "MTA-J080",
    tagline: "0.8L・容量を優先するなら",
    image:
      "https://www.tiger-corporation.com/wp-content/uploads/2025/07/MTA-J080_750x750-d1adb21a6e79c156ac1d5d974c9b75dd.jpg",
    imageAlt: "タイガー MTA-J080",
    officialHref:
      "https://www.tiger-corporation.com/ja/jpn/product/vacuum-insulated-products/mta-j/",
    guidePoints: [
      "容量0.8Lで多めに入れられる",
      "保冷効力7℃以下の案内",
      "長時間の外出や水分補給向け",
    ],
    productId: "tiger-mta-j080",
  },
  rows: [
    {
      label: "容量",
      left: "0.5L",
      right: "0.8L",
      highlight: "right",
      highlightNote: "大容量",
      bar: { left: 0.5, right: 0.8 },
    },
    {
      label: "本体質量",
      left: "約0.26kg",
      right: "約0.36kg",
      highlight: "left",
      highlightNote: "約100g軽い",
      bar: { left: 0.26, right: 0.36 },
    },
    {
      label: "保冷効力（6時間）",
      left: "8℃以下",
      right: "7℃以下",
      highlight: "right",
      highlightNote: "低い温度を保つ",
      bar: { left: 8, right: 7 },
    },
    {
      label: "保温効力（6時間）",
      left: "68℃以上",
      right: "75℃以上",
      highlight: "right",
      highlightNote: "高い温度を保つ",
      bar: { left: 68, right: 75 },
    },
    {
      label: "本体寸法",
      left: "幅7.5×奥行8.6×高さ23.3cm",
      right: "幅7.5×奥行8.6×高さ31.4cm",
    },
  ],
});

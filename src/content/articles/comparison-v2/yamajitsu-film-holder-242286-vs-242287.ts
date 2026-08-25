import { defineComparisonV2 } from './_base';

export const entry = defineComparisonV2(
    "yamajitsu-film-holder-242286-vs-242287",
    {
      left: {
        brand: "山崎実業 tower",
        line: "フィルムフックまな板ホルダー 242286",
        tagline: "まな板2枚を浮かせて収納するなら",
        image: "/products/yamazaki-film-holder-242286.jpg",
        imageAlt: "山崎実業 フィルムフックまな板ホルダー タワー 242286",
        officialHref: "https://www.yamajitsu.co.jp/products/242286",
        guidePoints: [
          "厚みの異なるまな板を2枚、壁面に浮かせて収納したい人向け",
        ],
      },
      right: {
        brand: "山崎実業 tower",
        line: "フィルムフック鍋蓋ホルダー 242287",
        tagline: "鍋蓋を浮かせて収納するなら",
        image: "/products/yamazaki-film-holder-242287.jpg",
        imageAlt: "山崎実業 フィルムフック鍋蓋ホルダー タワー 242287",
        officialHref: "https://www.yamajitsu.co.jp/products/242287",
        guidePoints: ["直径14〜30cmの鍋蓋を壁面に収納したい人向け"],
      },
      rows: [
        {
          label: "収納するもの",
          left: "まな板2枚",
          right: "鍋蓋1枚",
          highlight: null,
        },
        {
          label: "対応サイズ",
          left: "厚み1.5cm・2.5cm以内を各1枚",
          right: "直径14〜30cm",
          highlight: null,
        },
        {
          label: "商品サイズ",
          left: "W12×D5.7×H12cm",
          right: "W13.5×D6.2×H14cm",
          highlight: null,
        },
        {
          label: "商品重量",
          left: "140g",
          right: "120g",
          highlight: "right",
          highlightNote: "20g軽い",
        },
        { label: "耐荷重", left: "2kg", right: "2kg", highlight: null },
      ],
    },
  );

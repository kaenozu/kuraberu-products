import { defineArticleMetadata } from "./types";

export const combiTheSArticle = defineArticleMetadata({
  id: "combi-the-s-plus-vs-premium",
  productCount: 2,
  path: "/articles/combi-the-s-plus-vs-premium/",
  title: "コンビ THE S plus と THE S premium、どっち？｜くらべる商品メモ",
  headline:
    "コンビのチャイルドシート、どっち？「THE S plus」と「THE S premium」を比較",
  description:
    "コンビ THE S plus と THE S premiumを、公式の対象身長・使用期間・回転・固定方法・重量・価格で比較",
  category: "チャイルドシート",
  tags: ["チャイルドシート", "コンビ", "新生児", "ISOFIX"],
  audiences: ["出産準備中の人", "チャイルドシートを買い替えたい人"],
  uses: ["新生児から使う", "長く使う", "車への乗せ降ろし"],
  summary:
    "THE S plusとTHE S premiumを、公式の対象身長・使用期間・回転・固定方法・重量・価格に分けて比較します。",
  publishedAt: "2026-08-12",
  modifiedAt: "2026-08-29",
  productInfoCheckedAt: "2026-08-12",
  purchaseLinksCheckedAt: "2026-08-29",
  purchaseLinkStatus: "verified",
  imagePath: "/products/the-s-plus.jpg",
  changeLog: [
    {
      date: "2026-08-14",
      summary:
        "記事末尾に購入カード（article-end）を追加（標準レイアウト適用）",
    },
    {
      date: "2026-08-12",
      summary:
        "初回公開。コンビ公式の商品ページで対象身長・使用期間・固定方法・重量・価格を確認。",
    },
  ],
  leftModel: {
    brand: "コンビ",
    line: "THE S plus",
    tagline: "4才頃まで・価格を抑えるなら",
    image: "/products/the-s-plus.jpg",
    imageAlt: "コンビ THE S plus チャイルドシート",
    officialHref: "https://www.combi.co.jp/store/carseat/thesplus/g/g120066/",
    guidePoints: ["4才頃までの基本ユースを重視し、価格を抑えたい人の候補"],
  },
  rightModel: {
    brand: "コンビ",
    line: "THE S premium",
    tagline: "7才頃まで・長く使うなら",
    image: "/products/the-s-premium.jpg",
    imageAlt: "コンビ THE S premium チャイルドシート",
    officialHref:
      "https://www.combi.co.jp/store/carseat/thespremium/g/g118991/",
    guidePoints: ["ジュニアモードまで1台で長く使いたい人の候補"],
  },
  keyDiffRows: [
    {
      label: "使用期間の目安",
      left: "新生児〜4才頃・身長40〜105cm",
      right: "新生児〜7才頃・身長40〜125cm",
      highlight: "right",
      highlightNote: "長く使える",
      bar: { left: 105, right: 125 },
    },
    {
      label: "ジュニアモード",
      left: "公式ページで案内なし",
      right: "前向き・身長100〜125cm",
      highlight: "right",
      highlightNote: "ジュニアまで対応",
    },
    {
      label: "本体重量",
      left: "13.8kg",
      right: "14.1kg",
      highlight: "left",
      highlightNote: "約300g軽い",
      bar: { left: 13.8, right: 14.1 },
      direction: "lower-is-better",
    },
    {
      label: "公式表示価格",
      left: "88,000円",
      right: "95,700円",
      highlight: "left",
      highlightNote: "7,700円安い",
      bar: { left: 88000, right: 95700 },
      direction: "lower-is-better",
    },
    {
      label: "回転・固定",
      left: "360°回転・ISOFIX＋サポートレッグ",
      right: "360°回転・ISOFIX＋サポートレッグ",
    },
  ],
  lead: "コンビのTHE S plusとTHE S premiumは、どちらも新生児から使える回転式チャイルドシートです。公式ページで確認できる使用身長、ジュニアモード、重量、価格、固定方法を分けて整理します。",
  summaryParagraph:
    "どちらも新生児から使えるTHE Sシリーズですが、premiumは身長125cmまでのジュニアモードを備えています。plusは身長105cmまでで、重量と価格はplusの方が小さくなっています。",
  officialDescription:
    "THE S plusは、コンビ公式ストア限定モデルとして、新生児から4才頃・身長40〜105cmまでの使用を案内しています。THE S premiumは、新生児から7才頃・身長40〜125cmまでのロングユースモデルで、ジュニアモードを含む3モードを案内しています。どちらもISOFIX固定とサポートレッグ、360°回転を公式ページで確認できます。",
  socialProofQuery: "コンビ THE S plus THE S premium チャイルドシート",
  faqEntries: [
    {
      question: "THE S plus と THE S premium の違いは？",
      answer:
        "公式ページで確認できる大きな違いは、使用できる身長範囲です。THE S plus は身長40〜105cmまで、THE S premium は身長40〜125cmまで。premiumはジュニアモードを備え、7才頃までの使用を案内しています。重量と価格も異なります。",
    },
    {
      question: "長く使えるのはどっち？",
      answer:
        "コンビ公式の案内では、THE S plusは新生児〜4才頃・身長40〜105cmまで、THE S premiumは新生児〜7才頃・身長40〜125cmまでです。長く使える期間を優先するなら、premiumが候補になります。実際の使用可否は子どもの身長・体重と取扱説明書を確認してください。",
    },
    {
      question: "回転や取り付け方法に違いはある？",
      answer:
        "今回確認した公式商品ページでは、どちらもISOFIX固定とサポートレッグを使い、360度回転するタイプとして案内されています。車種への適合や取り付け位置は、購入前に公式の車種適合表で確認してください。",
    },
    {
      question: "価格はいくら？",
      answer:
        "公式ページの表示価格は、THE S plusが88,000円、THE S premiumが95,700円です。販売店の価格・在庫・ポイント・送料は変動するため、購入時点の販売ページで確認してください。",
    },
  ],
  officialSources: [
    {
      label: "コンビ THE S plus 公式商品ページ",
      url: "https://www.combi.co.jp/store/carseat/thesplus/g/g120066/",
    },
    {
      label: "コンビ THE S premium 公式商品ページ",
      url: "https://www.combi.co.jp/store/carseat/thespremium/g/g118991/",
    },
    {
      label: "コンビ チャイルドシート一覧",
      url: "https://www.combi.co.jp/products/childseat/",
    },
  ],
  purchaseWarning:
    "チャイルドシートは、車種適合、取り付け位置、子どもの身長・体重、前向きへ切り替える条件を必ず公式の取扱説明書と適合表で確認してください。価格や在庫は販売先で変わります。",
  disclaimer:
    "この比較は、コンビ公式の商品ページで確認できる情報を根拠にしています。個人の感想や口コミは比較の根拠にしていません。",
});

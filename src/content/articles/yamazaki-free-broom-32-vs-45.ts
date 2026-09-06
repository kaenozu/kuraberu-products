import { defineArticleMetadata } from "./types";

export const yamazakiFreeBroomArticle = defineArticleMetadata({
  id: "yamazaki-free-broom-32-vs-45",
  productCount: 2,
  path: "/articles/yamazaki-free-broom-32-vs-45/",
  title: "山崎産業 JS自由箒32 と 45、どっち？｜くらべる商品メモ",
  headline: "山崎産業のJS自由箒、32と45を比較",
  description:
    "山崎産業 JS自由箒32と45を、公式の使用サイズ・重量・材質・個装ケースサイズで比較",
  category: "生活雑貨",
  tags: ["山崎産業", "ほうき", "清掃用品"],
  audiences: ["ほうきを選びたい人", "掃く幅と重量を比べたい人"],
  uses: ["床を掃く", "清掃用品を比較する"],
  summary: "JS自由箒32と45を、山崎産業公式の仕様と確認状況に分けて比較します。",
  publishedAt: "2026-08-16",
  modifiedAt: "2026-08-16",
  productInfoCheckedAt: "2026-08-16",
  purchaseLinksCheckedAt: "2026-08-16",
  purchaseLinkStatus: "unverified",
  imagePath: "/products/yamazaki-free-broom-32.jpg",
  changeLog: [
    {
      date: "2026-08-16",
      summary: "初回公開。山崎産業公式の商品ページと楽天公式生成リンクを確認。",
    },
  ],
  leftModel: {
    brand: "山崎産業 JS自由箒",
    line: "32（BR952-032J-MB）",
    tagline: "軽さ・扱いやすさなら",
    image: "/products/yamazaki-free-broom-32.jpg",
    imageAlt: "山崎産業 JS自由箒32 BR952-032J-MB",
    officialHref: "https://product.yamazaki-sangyo.co.jp/product/209613",
    guidePoints: [
      "狭い場所や持ち運びやすさを優先して、幅330mmのほうきを選びたい人向け",
    ],
  },
  rightModel: {
    brand: "山崎産業 JS自由箒",
    line: "45（BR952-045J-MB）",
    tagline: "幅広く掃くなら",
    image: "/products/yamazaki-free-broom-45.jpg",
    imageAlt: "山崎産業 JS自由箒45 BR952-045J-MB",
    officialHref: "https://product.yamazaki-sangyo.co.jp/product/209620",
    guidePoints: ["一度に広い範囲を掃きたい人向け"],
  },
  keyDiffRows: [
    {
      label: "商品名",
      left: "JS自由箒 32",
      right: "JS自由箒 45",
      highlight: null,
    },
    {
      label: "使用サイズ（幅×全長）",
      left: "330×1320mm",
      right: "460×1320mm",
      highlight: "right",
      highlightNote: "幅が広い",
    },
    {
      label: "重量",
      left: "約320g",
      right: "約370g",
      highlight: "left",
      highlightNote: "約50g軽い",
    },
    {
      label: "ハンドル",
      left: "アルミパイプ（φ約22mm）",
      right: "アルミパイプ（φ約22mm）",
      highlight: null,
    },
    {
      label: "毛の材質",
      left: "PP・再生PET・馬毛・除電材",
      right: "PP・再生PET・馬毛・除電材",
      highlight: null,
    },
  ],
  lead: "山崎産業のJS自由箒32と45を、メーカー公式ページで確認できる商品名・サイズ・重量・材質の範囲で比較します。",
  officialDescription:
    "仕様の根拠は、山崎産業公式の商品ページで2026年8月16日に確認しました。両製品とも公式ページに「防災備蓄保管に適した省スペースパッケージで持ち運びにも最適」「ネジ込み式 組立ハンドル」と記載されています。",
  officialSources: [
    {
      label: "山崎産業公式：JS自由箒32 BR952-032J-MB",
      url: "https://product.yamazaki-sangyo.co.jp/product/209613",
    },
    {
      label: "山崎産業公式：JS自由箒45 BR952-045J-MB",
      url: "https://product.yamazaki-sangyo.co.jp/product/209620",
    },
  ],
  socialProofQuery: "山崎産業 JS自由箒 BR952-032J-MB BR952-045J-MB",
  faqEntries: [
    {
      question: "JS自由箒32と45の違いは？",
      answer:
        "山崎産業公式ページで確認できる主な違いは、使用サイズの幅が32は330mm、45は460mmであることと、重量が32は約320g、45は約370gであることです。全長はいずれも1320mmです。",
    },
    {
      question: "軽いのはどちら？",
      answer:
        "公式の重量表記では、JS自由箒32が約320g、JS自由箒45が約370gです。数値上はJS自由箒32が約50g軽いです。",
    },
    {
      question: "毛の材質は違いますか？",
      answer:
        "公式ページの材質表記は、どちらもハンドルがアルミパイプ、甲がPP、毛がPP・再生PET・馬毛・除電材です。",
    },
    {
      question: "楽天市場の価格は掲載していますか？",
      answer:
        "価格・在庫・送料・ポイントは販売先で変わるため、楽天市場の型番検索ページで購入時点の表示を確認してください。",
    },
  ],
});

import { defineArticleMetadata } from "./types";

export const sharpKcS50VsFuS50Article = defineArticleMetadata({
  id: "sharp-kc-s50-vs-fu-s50",
  productCount: 2,
  path: "/articles/sharp-kc-s50-vs-fu-s50/",
  title: "シャープ KC-S50とFU-S50、どっち？｜くらべる商品メモ",
  headline: "シャープの空気清浄機、どっち？「KC-S50」と「FU-S50」を比較",
  description:
    "シャープ KC-S50とFU-S50を、公式の加湿・サイズ・重量・適用畳数・運転音・センサーで比較",
  category: "生活家電",
  tags: ["空気清浄機", "加湿空気清浄機", "シャープ"],
  audiences: ["空気清浄機を選びたい人", "加湿機能の有無で比較したい人"],
  uses: ["リビングで使う", "空気清浄と加湿を比較"],
  summary:
    "KC-S50とFU-S50を、シャープ公式の加湿機能・サイズ・重量・適用畳数・運転音・センサーに分けて比較します。",
  publishedAt: "2026-08-13",
  modifiedAt: "2026-08-14",
  productInfoCheckedAt: "2026-08-13",
  purchaseLinkStatus: "unverified",
  imagePath: "/products/sharp-kc-s50.jpg",
  changeLog: [
    {
      date: "2026-08-14",
      summary:
        "記事末尾に購入カード（article-end）を追加（標準レイアウト適用）",
    },
    {
      date: "2026-08-13",
      summary: "初回公開。シャープ公式の商品ページと仕様ページで仕様を確認。",
    },
  ],
  leftModel: {
    brand: "シャープ",
    line: "KC-S50",
    tagline: "加湿も使うなら",
    image: "/products/sharp-kc-s50.jpg",
    imageAlt: "シャープ 加湿空気清浄機 KC-S50",
    officialHref: "https://jp.sharp/kuusei/products/kcs50/",
    guidePoints: ["加湿機能も使いたく、空気清浄と加湿を1台でまとめたい人向け"],
  },
  rightModel: {
    brand: "シャープ",
    line: "FU-S50",
    tagline: "小型・軽量なら",
    image: "/products/sharp-fu-s50.jpg",
    imageAlt: "シャープ 空気清浄機 FU-S50",
    officialHref: "https://jp.sharp/kuusei/products/fus50/",
    guidePoints: [
      "加湿機能は不要で、より小型・軽量の本体とニオイセンサーを重視する人向け",
    ],
  },
  keyDiffRows: [
    { label: "加湿", left: "あり", right: "なし", highlight: "left" },
    { label: "最大加湿量", left: "500mL/h", right: "—", highlight: "left" },
    {
      label: "外形寸法",
      left: "399×230×613mm",
      right: "383×209×540mm",
      highlight: "right",
    },
    {
      label: "本体重量",
      left: "約7.5kg",
      right: "約4.9kg",
      highlight: "right",
      highlightNote: "約2.6kg軽い",
    },
    { label: "ニオイセンサー", left: "—", right: "あり", highlight: "right" },
  ],
  faqEntries: [
    {
      question: "KC-S50とFU-S50の大きな違いは？",
      answer:
        "KC-S50は加湿機能を搭載し、最大加湿量は500mL/hです。FU-S50は加湿なしで、ニオイセンサーを搭載しています。",
    },
    {
      question: "空気清浄の適用畳数は違う？",
      answer:
        "空気清浄の適用畳数は、どちらも～23畳です。プラズマクラスター適用畳数はKC-S50が約13畳、FU-S50が約14畳です。",
    },
    {
      question: "本体が軽くて小さいのはどちら？",
      answer:
        "FU-S50は外形383×209×540mm、約4.9kgです。KC-S50は399×230×613mm、約7.5kgなので、FU-S50の方が小さく軽量です。",
    },
    {
      question: "楽天市場の価格は比較できる？",
      answer:
        "価格・在庫・ポイント・送料は変動するため、型番検索ページで購入時点の表示を確認してください。",
    },
  ],
  lead: "シャープのKC-S50とFU-S50を、公式ページで確認できる加湿機能・最大加湿量・サイズ・重量・適用畳数・運転音・センサーで比較します。価格は販売先でご確認ください。",
  summaryParagraph:
    "加湿を1台で済ませたいならKC-S50、加湿が不要で本体の小ささ・軽さやニオイセンサーを重視するならFU-S50が候補です。空気清浄の適用畳数はどちらも～23畳です。",
  socialProofQuery: "シャープ KC-S50 FU-S50",
  officialDescription:
    "比較の根拠は、シャープ公式商品ページと各仕様ページで確認した情報です。KC-S50は加湿空気清浄機、FU-S50は空気清浄機として掲載されています。",
  purchaseWarning:
    "加湿の要否、本体サイズ・重量、運転音、センサーなど、設置場所と必要な機能を購入前に確認してください。価格・在庫・ポイント・送料は販売先で変わります。",
  disclaimer:
    "この比較は、シャープ公式の商品ページと仕様ページで確認できる情報を根拠にしています。SNSの感想は比較の根拠にしていません。",
});

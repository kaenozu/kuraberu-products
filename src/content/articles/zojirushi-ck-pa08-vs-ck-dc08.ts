import { defineArticleMetadata } from "./types";

export const zojirushiElectricKettleArticle = defineArticleMetadata({
  id: "zojirushi-ck-pa08-vs-ck-dc08",
  productCount: 2,
  path: "/articles/zojirushi-ck-pa08-vs-ck-dc08/",
  title: "象印 CK-PA08 と CK-DC08、どっち？｜くらべる商品メモ",
  headline: "象印の電気ケトル、どっち？「CK-PA08」と「CK-DC08」を比較",
  description:
    "象印 CK-PA08とCK-DC08を、公式の容量・沸とう時間・安全設計・ほこり対策・手入れ方法で比較",
  category: "キッチン家電",
  tags: ["電気ケトル", "象印", "キッチン家電"],
  audiences: ["電気ケトルを選びたい人", "安全設計や手入れ方法を比べたい人"],
  uses: ["毎日のお湯沸かし", "キッチンで使う", "安全設計を確認する"],
  summary:
    "CK-PA08とCK-DC08を、象印公式の商品ページで確認できる仕様・安全設計・手入れ方法に分けて比較します。",
  publishedAt: "2026-08-13",
  modifiedAt: "2026-09-09",
  productInfoCheckedAt: "2026-09-09",
  purchaseLinksCheckedAt: "2026-08-13",
  purchaseLinkStatus: "unverified",
  imagePath: "/products/zojirushi-ck-pa08.webp",
  changeLog: [
    {
      date: "2026-09-09",
      summary:
        "両モデルの公式ページで再確認し、CK-PA08にも注ぎ口ほこりブロックと6つの安全設計の記載があるため比較表・FAQ・leadを更新。",
    },
    {
      date: "2026-08-14",
      summary:
        "記事末尾に購入カード（article-end）を追加（標準レイアウト適用）",
    },
    {
      date: "2026-08-13",
      summary: "初回公開。象印公式の商品ページでCK-PA08とCK-DC08の仕様を確認。",
    },
  ],
  leftModel: {
    brand: "象印",
    line: "CK-PA08",
    tagline: "ふた・手入れなら",
    image: "/products/zojirushi-ck-pa08.webp",
    imageAlt: "象印 CK-PA08 電気ケトル",
    officialHref:
      "https://www.zojirushi.co.jp/syohin/stan/product/electric_kettle/ck-pa.html",
    guidePoints: [
      "軽くはずせるふたを重視したい",
      "広口内容器で手入れしたい",
      "0.8L・1300Wの基本仕様で選びたい",
    ],
  },
  rightModel: {
    brand: "象印",
    line: "CK-DC08",
    tagline: "軽さ・注ぎやすさなら",
    image: "/products/zojirushi-ck-dc08.png",
    imageAlt: "象印 CK-DC08 電気ケトル",
    officialHref: "https://www.zojirushi.co.jp/syohin/pot_kettle/kettle/ck-dc/",
    guidePoints: [
      "注ぎ口ほこりブロックを確認したい",
      "転倒湯もれ防止など安全設計を重視したい",
      "本体約0.8kgの軽さを優先したい",
    ],
  },
  keyDiffRows: [
    {
      label: "本体の軽さ",
      left: "約0.9kg",
      right: "約0.8kg",
      highlight: "right",
      highlightNote: "約0.1kg軽い",
      bar: { left: 0.9, right: 0.8 },
      direction: "lower-is-better",
    },
    {
      label: "ほこり対策",
      left: "注ぎ口ほこりブロック",
      right: "注ぎ口ほこりブロック",
      highlight: null,
    },
    {
      label: "安全設計",
      left: "6つの安全設計",
      right: "6つの安全設計",
      highlight: null,
    },
    {
      label: "ふた・手入れ",
      left: "軽くはずせるふた・広口内容器",
      right: "軽くはずせるふた",
    },
  ],
  lead: "象印の0.8L電気ケトル「CK-PA08」と「CK-DC08」を比較します。どちらも1300Wで同じ容量・沸とう時間に加え、注ぎ口ほこりブロックや6つの安全設計が公式に案内されています。本体の軽さや広口内容器など、ふたと手入れの情報に違いがあります。",
  socialProofQuery: "象印 CK-PA08 CK-DC08 電気ケトル",
  officialSources: [
    {
      label: "象印 CK-PA08 公式ページ",
      url: "https://www.zojirushi.co.jp/syohin/stan/product/electric_kettle/ck-pa.html",
    },
    {
      label: "象印 CK-DC08 公式ページ",
      url: "https://www.zojirushi.co.jp/syohin/pot_kettle/kettle/ck-dc/",
    },
  ],
  faqEntries: [
    {
      question: "象印 CK-PA08 と CK-DC08 はどっち？",
      answer:
        "どちらも0.8L・1300Wで、カップ1杯約60秒、満水約4分の電気ケトルです。注ぎ口ほこりブロックや転倒湯もれ防止構造など6つの安全設計は両モデルとも公式に案内されています。CK-PA08は広口内容器や選べる2つの注ぎ方、CK-DC08は本体約0.8kgの軽さや見やすい水量窓・なめらか注ぎ口が案内されています。手入れのしやすさを中心に見るか、軽さや注ぎやすさを重視するかで確認する候補が変わります。",
    },
    {
      question: "容量と沸とう時間は違う？",
      answer:
        "今回比較するCK-PA08とCK-DC08はいずれも0.8Lです。公式値では、どちらもカップ1杯約60秒、満水約4分です。測定条件は室温・水温23℃、定格消費電力です。",
    },
    {
      question: "本体が軽いのはどっち？",
      answer:
        "CK-PA08は本体約0.9kg、CK-DC08は本体約0.8kgと、公式記載上はCK-DC08の方が約0.1kg軽いです。電源プレートを含む質量は、CK-PA08が約1.1kg、CK-DC08が約1.0kgです。",
    },
    {
      question: "ほこり対策を重視するならどっち？",
      answer:
        "両モデルとも、公式に「注ぎ口ほこりブロック」が案内されています。ロックボタンと連動して注ぎ口が開閉し、ほこりなどが入りにくい構造です。CK-PA08には広口内容器や軽くはずせるふたも案内されています。",
    },
  ],
});

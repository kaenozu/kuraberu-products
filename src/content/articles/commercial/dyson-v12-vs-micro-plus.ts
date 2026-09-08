import type { CommercialArticleSeed } from "./types";

export const dysonV12VsMicroPlusSeed: CommercialArticleSeed = {
  id: "dyson-v12-vs-micro-plus",
  publishedAt: "2026-09-08",
  title: "ダイソン V12 Detect SlimとMicro Plus、どっち？｜くらべる商品メモ",
  headline:
    "ダイソンのコードレス掃除機、どっち？「V12 Detect Slim」と「Micro Plus」を比較",
  description:
    "ダイソン V12 Detect SlimとMicro Plusを、公式の質量・運転時間・集じん容積・ヘッドで比較",
  category: "生活家電",
  tags: ["コードレス掃除機", "ダイソン", "一人暮らし"],
  audiences: [
    "軽くて手軽な掃除機を探している人",
    "吸引力と運転時間を重視する人",
  ],
  uses: ["毎日の掃除", "フローリング掃除", "狭い部屋の掃除"],
  summary:
    "ダイソン V12 Detect SlimとMicro Plusを、公式ページで確認できる質量・運転時間・集じん容積・ヘッドに分けて比較します。",
  leftProduct: "ダイソン V12 Detect Slim",
  rightProduct: "ダイソン Micro Plus",
  leftPoint: "最長60分の運転と2種ヘッドで家中まとめて掃除したい人向け",
  rightPoint: "本体質量1.54kgの軽さとLEDヘッドを優先する人向け",
  productInfoCheckedAt: "2026-09-07",
  modifiedAt: "2026-09-07",
  purchaseLinkStatus: "unverified",
  officialSources: [
    {
      label: "ダイソン V12 Detect Slim Absolute 公式商品ページ",
      url: "https://www.dyson.co.jp/vacuum-cleaners/cordless/v12/detect-slim-absolute",
    },
    {
      label: "ダイソン Micro Plus 公式商品ページ",
      url: "https://www.dyson.co.jp/vacuum-cleaners/cordless/micro/plus-nickel-iron",
    },
  ],
  verifiedRows: [
    {
      label: "本体質量",
      left: "2.2kg（Fluffy Optic装着時。Motorbar装着時2.40kg）",
      right: "1.54kg",
    },
    {
      label: "最長運転時間",
      left: "60分（エコモード・モーター駆動のないツール使用時）",
      right: "約25分（エコモード・モーター駆動のないツール使用時）",
    },
    {
      label: "集じん容積",
      left: "0.35L",
      right: "0.2L",
    },
    {
      label: "クリーナーヘッド",
      left: "Fluffy Optic・Motorbar",
      right: "Fluffy Optic",
    },
    {
      label: "充電時間",
      left: "3.5時間",
      right: "3.5時間",
    },
  ],
  lead: "ダイソンのコードレス掃除機、V12 Detect SlimとMicro Plusを比較します。本体質量・運転時間・集じん容積・ヘッドはメーカー公式の仕様に記載された条件と合わせて確認します。価格は販売先でご確認ください。",
  faqEntries: [
    {
      question: "どれくらい軽さが違う？",
      answer:
        "公式仕様の本体質量は、V12 Detect Slimが2.2kg、Micro Plusが1.54kgです。ヘッドやバッテリーの条件をそろえて比較してください。",
    },
    {
      question: "運転時間の条件は同じ？",
      answer:
        "どちらもエコモード・モーター駆動のないツール使用時の最長値で、V12 Detect Slimが60分、Micro Plusが約25分です。使用環境により異なる場合があります。",
    },
    {
      question: "ヘッド構成の違いは？",
      answer:
        "V12 Detect SlimはFluffy OpticとMotorbarの2種、Micro PlusはFluffy Opticです。カーペット中心ならMotorbar付きのV12 Detect Slimを確認してください。",
    },
  ],
  decisionGuideSteps: [
    "家中まとめて掃除したいなら最長60分・集じん0.35LのV12 Detect Slimを選ぶ。",
    "軽さを優先するなら本体質量1.54kgのMicro Plusを選ぶ。",
    "カーペット中心ならMotorbar付きのV12 Detect Slimを確認する。",
  ],
};

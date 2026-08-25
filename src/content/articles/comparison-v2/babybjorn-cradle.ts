import { defineComparisonV2 } from './_base';

export const entry = defineComparisonV2("babybjorn-cradle", {
    left: {
      brand: "ベビービョルン",
      line: "クレードル",
      tagline: "新生児期の揺らして寝かしつけを重視する人の候補",
      image: "/products/babybjorn-cradle.jpg",
      imageAlt: "ベビービョルン クレードル",
      officialHref:
        "https://www.babybjorn.jp/products/baby-cradle-and-travel-crib/",
      guidePoints: ["新生児期の揺らして寝かしつけを重視する人の候補"],
      productId: "babybjorn-cradle",
    },
    right: {
      brand: "アップリカ",
      line: "ココネルエアー AB",
      tagline: "長く使えて折りたためるベビーベッドを探す人の候補",
      image: "/products/aprica-coconel-air.jpg",
      imageAlt: "アップリカ ココネルエアー AB",
      officialHref: "https://www.aprica.jp/products/home/bed/coconel_air/",
      guidePoints: ["長く使えて折りたためるベビーベッドを探す人の候補"],
      productId: "aprica-coconel-air",
    },
    rows: [
      {
        label: "使用できる期間",
        left: "新生児〜生後6か月（体重8kgまで）。使用期間は短めのゆりかご型。",
        right:
          "新生児（2.5kg）〜24カ月（13kgまで）。上段・下段の2段階で長く使える。",
      },
      {
        label: "揺れ（ゆりかご機能）",
        left: "両親が手や足で簡単に優しく揺らせることができる。「制御された、やさしい、はずみのある動き」を作り出す構造。",
        right: "公式案内に揺れ機能の記載なし（固定式）。",
      },
      {
        label: "サイズ",
        left: "本体 幅約79×奥行約58×高さ約65cm。マットレス 幅約71×奥行き約36×厚さ約3cm。",
        right:
          "開いた状態 幅約1052×奥行約704×高さ約951mm。閉じた状態 幅約260×奥行約260×高さ約951mm。",
      },
      {
        label: "重量・持ち運び",
        left: "約6kg。「軽量で女性でも簡単に移動させることができます」（公式案内）。",
        right:
          "約14.5kg（収納袋を除く）。キャスター付きで移動できるが、クレードルより大きく重い。",
      },
      {
        label: "折りたたみ・収納",
        left: "公式案内に折りたたみ・収納袋の記載なし（据え置き型）。",
        right:
          "カンタンに折りたたんで持ち運べる。収納袋付き。帰省・旅行にも使える。",
      },
      {
        label: "多用途（サークル兼用など）",
        left: "新生児期のベッド用途のみ。キャノピー（天蓋）は別売り。",
        right:
          "大きくなったらベビーサークルとしても使える。おむつ替えやお掃除のときの一時置きにも。",
      },
      {
        label: "安全基準・価格（2026-08-10確認）",
        left: "49,500円（送料無料）。",
        right:
          "PSCマーク・乳幼児用ベッドSG合格品。29,700円（他店26,000円台〜）。",
      },
    ],
  });

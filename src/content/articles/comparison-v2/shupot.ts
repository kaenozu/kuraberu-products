import { defineComparisonV2 } from "./_base";

export const entry = defineComparisonV2("shupot", {
  left: {
    brand: "ピジョン 電動鼻吸い器 シュポット",
    line: "電動 シュポット",
    tagline: "コンセントのある場所でパワフルに吸引したい人の候補",
    image: "/products/shupot-dendo.jpg",
    imageAlt: "ピジョン 電動鼻吸い器 シュポット 電動 シュポット",
    officialHref: "https://shop.pigeon.co.jp/products/1032018",
    guidePoints: ["コンセントのある場所でパワフルに吸引したい人の候補"],
    productId: "shupot-dendo",
  },
  right: {
    brand: "ピジョン 手動鼻吸い器 シュポットポンプ＋フィット鼻ノズル",
    line: "手動 シュポットポンプ",
    tagline: "電源不要・価格と気軽さを優先したい人の候補",
    image: "/products/shupot-shudo.jpg",
    imageAlt:
      "ピジョン 手動鼻吸い器 シュポットポンプ＋フィット鼻ノズル 手動 シュポットポンプ",
    officialHref: "https://shop.pigeon.co.jp/products/2000638s",
    guidePoints: ["電源不要・価格と気軽さを優先したい人の候補"],
    productId: "shupot-shudo",
  },
  rows: [
    {
      label: "電源と使える場所",
      left: "ACアダプター式で専用ACアダプター付属。コンセントのある水平で安定した場所で使用。",
      right:
        "電源不要。コンパクトサイズ・フード付き・チューブもなく、スッキリ収納・持ち運び便利。",
    },
    {
      label: "吸引力の調整とお手入れ",
      left: "鼻水の状態に合わせてダイヤルで吸引力を調整。鼻水キャッチャーを中心に洗い、電動部本体とACアダプターは水洗い・煮沸・レンジ消毒すべて不可。",
      right:
        "シリコーンポンプとフィット鼻ノズルで適した吸引力を再現。まるごと洗浄OK・消毒/除菌ができる。",
    },
    {
      label: "価格と安全面の注意",
      left: "公式ショップ価格13,585円（2026-08-10確認）。定格15分・1回片鼻5秒以内・弱い位置から段階的に調整を公式が案内。安全に関する重要なお知らせあり。",
      right:
        "公式ショップ価格3,762円（2026-08-10確認）。電源不要で大きな音がでない。",
    },
  ],
  diagnosisHref: "/tools/product-finder/diaper/",
});

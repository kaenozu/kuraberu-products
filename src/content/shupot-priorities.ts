import type {
  PriorityOption,
  StandardPriorityConclusion,
} from "../lib/priority-conclusion";

export const shupotCandidateLabels = {
  left: "電動鼻吸い器 シュポット",
  right: "手動鼻吸い器 シュポットポンプ＋フィット鼻ノズル",
} as const;

export const shupotStandardConclusion: StandardPriorityConclusion = {
  heading: "標準の結論",
  summary:
    "ピジョン公式では、電動鼻吸い器 シュポットはACアダプター式でコンセントのある場所で使う製品として、手動鼻吸い器 シュポットポンプ＋フィット鼻ノズルは電源不要で片手で使える製品として案内されています。公式ショップ価格（2026-08-10確認）は電動が13,585円、手動が3,762円です。電気でパワフルに吸引したい場合は電動、価格と気軽さ・持ち運びやすさを優先する場合は手動が候補になりますが、どちらの吸いやすさがよいかは公式情報だけでは判断できません。",
  caution:
    "電動鼻吸い器 シュポットには公式の安全に関する重要なお知らせがあります。誤った取り扱いでは非常に強い吸引がかかり、窒息・ケガのおそれがあるため、取扱説明書と公式の注意事項を確認してから使う必要があります。また定格時間15分を超える連続運転は禁止されています。",
  evidenceHref: "#comparison-details",
};

export const shupotPriorityOptions: readonly PriorityOption[] = [
  {
    id: "power",
    label: "電源と使える場所",
    left: {
      score: 1,
      status: "official",
      reason:
        "ACアダプター式で専用ACアダプターが付属。コンセントのある水平で安定した場所で使用するよう公式に案内",
    },
    right: {
      score: 2,
      status: "official",
      reason:
        "電源不要で、コンパクトサイズ・フード付き・チューブもなく、公式に「スッキリ収納・持ち運び便利」と案内",
    },
    caution:
      "使用場所の自由度を優先するなら手動、コンセントを使える場所で使う前提なら電動という分け方ができます。",
    evidenceHref: "#comparison-details",
  },
  {
    id: "adjust-care",
    label: "吸引力の調整とお手入れ",
    left: {
      score: 1,
      status: "official",
      reason:
        "鼻水の状態に合わせてダイヤルで吸引力を調整できる。お手入れは鼻水キャッチャーを中心に洗い、電動部本体とACアダプターは水洗い・煮沸・レンジ消毒すべて不可",
    },
    right: {
      score: 1,
      status: "official",
      reason:
        "シリコーンポンプとフィット鼻ノズルで鼻水吸引に適した吸引力を再現。公式に「まるごと洗浄OK」「消毒・除菌ができる」と案内",
    },
    caution:
      "電動はフィット鼻ノズルS・鼻水キャッチャー・シリコーンチューブが120℃煮沸/スチーム消毒可（レンジ不可）ですが、電動部本体は洗えません。",
    evidenceHref: "#comparison-details",
  },
  {
    id: "price-safety",
    label: "価格と安全面の注意",
    left: {
      score: 1,
      status: "official",
      reason:
        "公式ショップ価格13,585円（2026-08-10確認）。安全上のルールとして定格15分・1回片鼻5秒以内・弱い位置から段階的に調整を公式が案内。安全に関する重要なお知らせあり",
    },
    right: {
      score: 1,
      status: "official",
      reason:
        "公式ショップ価格3,762円（2026-08-10確認）。電源不要で大きな音がでないと公式に案内",
    },
    caution:
      "価格は2026-08-10時点のピジョン公式ショップ表示価格です。楽天市場など他のショップでは価格・セット内容が異なる場合があります。",
    evidenceHref: "#comparison-details",
  },
];

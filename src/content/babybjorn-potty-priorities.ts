import type {
  PriorityOption,
  StandardPriorityConclusion,
} from "../lib/priority-conclusion";

export const pottyCandidateLabels = {
  left: "スマートポッティ",
  right: "ポッティチェア",
} as const;

export const pottyStandardConclusion: StandardPriorityConclusion = {
  heading: "標準の結論",
  summary:
    "ベビービョルン公式の案内によると、スマートポッティはスペースの限られたバスルームにも置けるコンパクトな収納式ポッティ（幅約25.5×奥行き約32×高さ約17.5cm・約520g・ポリプロピレン）で、ポッティチェアは「お子さまが長い時間オマルに座る場合に最適」とされるイス型オマル（幅約32×奥行き約33×高さ約33cm・約870g・中桶付き）です。どちらもベビービョルンのトイレトレーニング製品で、製品形状と収納方法が主な違いです。スマートポッティは小さめサイズで足裏がしっかり床につく設計、ポッティチェアは長く座れるイス型で中桶が取り外せます。2026-08-10時点の公式楽天市場店では、スマートポッティが3,080円、ポッティチェアが4,180円でした。実際の使いやすさは、公式情報だけでは判断できません。",
  caution:
    "対象年齢・仕様は公式の商品ページの案内です。お子さまの成長は個人差が大きいため、購入前に対象範囲を公式ページで確認してください。",
  evidenceHref: "#comparison-details",
};

export const pottyPriorityOptions: readonly PriorityOption[] = [
  {
    id: "shape",
    label: "形状（収納式 vs イス型）",
    left: {
      score: 1,
      status: "official",
      reason:
        "公式の案内で「スペースの限られたバスルームに必要なデザインと機能をコンパクトにまとめた」と記載。収納式のコンパクトなポッティ。",
    },
    right: {
      score: 2,
      status: "official",
      reason:
        "公式の案内で「お子さまが長い時間オマルに座る場合、イス型オマルが最適」と記載。柔らかいフォルムの人間工学デザインのイス型。",
    },
    caution:
      "使わない時にコンパクトに収納したい場合はスマートポッティ、長く座らせたい場合はポッティチェアが候補です。",
    evidenceHref: "#comparison-details",
  },
  {
    id: "size-weight",
    label: "サイズ・重量",
    left: {
      score: 1,
      status: "official",
      reason:
        "幅約25.5×奥行き約32×高さ約17.5cm・約520g。小さめサイズで足裏がしっかり床につく設計（公式商品ページ）。",
    },
    right: {
      score: 1,
      status: "official",
      reason:
        "幅約32×奥行き約33×高さ約33cm・約870g。イス型でやや大きめ・重め（公式商品ページ）。",
    },
    caution:
      "サイズと重量は公式の商品ページの案内です。置き場所の広さに合わせて選ぶのがおすすめです。",
    evidenceHref: "#comparison-details",
  },
  {
    id: "bucket",
    label: "中桶（取り外し）",
    left: {
      score: 1,
      status: "official",
      reason:
        "収納式のため、使用後にコンパクトに畳める構造（公式商品ページ）。",
    },
    right: {
      score: 2,
      status: "official",
      reason:
        "公式の案内で「中桶付き」と記載。中桶を取り外してそのまま流せる。",
    },
    caution: "中桶の有無・取り外し方法は公式の商品ページで確認してください。",
    evidenceHref: "#comparison-details",
  },
  {
    id: "price",
    label: "公式ショップの価格（2026-08-10確認）",
    left: {
      score: 2,
      status: "official",
      reason: "ベビービョルン公式楽天市場店で 3,080円。低価格で試しやすい。",
    },
    right: {
      score: 1,
      status: "official",
      reason: "ベビービョルン公式楽天市場店で 4,180円。イス型でやや高め。",
    },
    caution:
      "価格は購入時点の販売ページで確認してください。公式ショップはキャンペーンで変動することがあります。",
    evidenceHref: "#comparison-details",
  },
];

import { pampersNewbornArticle } from "./pampers-newborn";
import { merriesNewbornArticle } from "./merries-newborn";
import { pigeonBottle240Article } from "./pigeon-bottle240";
import { pigeonSlim240Article } from "./pigeon-slim240";
import { moonyMArticle } from "./moony-m";
import { merriesPantsArticle } from "./merries-pants";
import { shupotArticle } from "./shupot";
import { babybjornArticle } from "./babybjorn";
import { babybjornOnekaiArticle } from "./babybjorn-onekai";
import { babybjornBouncerArticle } from "./babybjorn-bouncer";
import { cradleArticle } from "./cradle";
import { pottyArticle } from "./potty";
import { pigeonBottleSizeArticle } from "./pigeon-bottle-size";
import { combiTheSArticle } from "./combi-the-s";
import { tigerRiceArticle } from "./tiger-rice";
import { tigerPctA120VsPctA150Article } from "./tiger-pct-a120-vs-pct-a150";
import { zojirushiCoffeeArticle } from "./zojirushi-coffee";
import { panasonicVacuumArticle } from "./panasonic-vacuum";
import { panasonicHairDryerArticle } from "./panasonic-hair-dryer";
import { tefalKettleArticle } from "./tefal-kettle";
import { sharpKcS50VsFuS50Article } from "./sharp-kc-s50-vs-fu-s50";
import { panasonicNeFl1aVsNeFl1cArticle } from "./panasonic-ne-fl1a-vs-ne-fl1c";
import { thermosTigerBottleArticle } from "./thermos-tiger-bottle";
import { yamazakiTowerDeskPanelArticle } from "./yamazaki-tower-desk-panel";
import { yamazakiCondorWagonArticle } from "./yamazaki-condor-wagon";
import { yamazakiFreeBroomArticle } from "./yamazaki-free-broom";
import { yamazakiDustWagonArticle } from "./yamazaki-dust-wagon";
import { zojirushiElectricKettleArticle } from "./zojirushi-electric-kettle";
import { tefalGarmentSteamerArticle } from "./tefal-garment-steamer";
import { kingjimTepraArticle } from "./kingjim-tepra";
import { panasonicFyhvx120VsFyhvx90Article } from "./panasonic-fyhvx120-vs-fyhvx90";
import { panasonicBabyMonitorArticle } from "./panasonic-baby-monitor";
import { panasonicEhNa9mGuideArticle } from "./panasonic-eh-na9m-guide";
import { thermosKfm020VsKfi020Article } from "./thermos-kfm020-vs-kfi020";
import { tigerMtaJ050GuideArticle } from "./tiger-mta-j050-guide";
import { panasonicEhNa9mVsEhNa7mArticle } from "./panasonic-eh-na9m-vs-eh-na7m";
import { tigerKettlePcjVsPcmArticle } from "./tiger-kettle-pcj-vs-pcm";

import { logicoolCommercialArticleSeeds } from "./commercial/logicool-seeds";
import { officialSpecCommercialArticleSeeds } from "./commercial/official-spec-seeds";
import {
  createCommercialArticle,
  type CommercialArticleSeed,
} from "./commercial/shared";

export { commercialArticleImages } from "./commercial/images";

const commercialArticleSeeds: readonly CommercialArticleSeed[] = [
  {
    id: "roborock-qrevo-curv-vs-dreame-x50",
    title:
      "ロボロック Qrevo CurvとDreame X50 Ultra、どっち？｜くらべる商品メモ",
    headline: "ロボット掃除機の人気モデルを比較。段差・モップ・自動化で選ぶ",
    description:
      "ロボット掃除機を、公式仕様で確認できる掃除方式・モップ・段差対応・ステーション機能から比較します。",
    category: "生活家電",
    tags: ["ロボット掃除機", "時短家電", "掃除"],
    audiences: ["掃除の手間を減らしたい人", "購入前に機能差を整理したい人"],
    uses: ["床掃除", "共働きの家事効率化", "ロボット掃除機選び"],
    summary:
      "ロボット掃除機の候補を、床掃除・モップ・段差・自動化の確認項目に分けて比べます。",
    leftProduct: "Roborock Qrevo Curv",
    rightProduct: "Dreame X50 Ultra",
    leftPoint: "モップ洗浄・乾燥や障害物回避の仕様を確認したい人向け",
    rightPoint: "段差対応や清掃ステーションの仕様を確認したい人向け",
  },
  {
    id: "makita-cl107-vs-cl286",
    title: "マキタ CL107FDSHWとCL286FD、どっち？｜くらべる商品メモ",
    headline: "マキタのコードレス掃除機を比較。軽さ・吸引・紙パックで選ぶ",
    description:
      "マキタのコードレス掃除機を、重量・電源・集じん方式・使い方で比較します。",
    category: "生活家電",
    tags: ["コードレス掃除機", "マキタ", "一人暮らし"],
    audiences: ["軽い掃除機を探している人", "マキタの型番を比較したい人"],
    uses: ["毎日の掃除", "階段掃除", "狭い部屋の掃除"],
    summary:
      "軽量モデルと上位モデルを、重量・バッテリー・集じん方式などの確認項目で整理します。",
    leftProduct: "マキタ CL107FDSHW",
    rightProduct: "マキタ CL286FD",
    leftPoint: "軽さと手軽さを優先する人向け",
    rightPoint: "吸引力や運転時間の選択肢を確認したい人向け",
  },
  {
    id: "iris-airfryer-fvx-d3-vs-tefal-ey201",
    title:
      "アイリスオーヤマ FVX-D3とティファール EY201、どっち？｜くらべる商品メモ",
    headline: "ノンフライヤーを比較。容量・温度設定・調理のしやすさで選ぶ",
    description:
      "ノンフライヤーの候補を、容量・温度設定・タイマー・お手入れの確認項目で比較します。",
    category: "キッチン家電",
    tags: ["ノンフライヤー", "時短調理", "キッチン家電"],
    audiences: ["揚げ物を手軽に作りたい人", "キッチン家電の容量を比べたい人"],
    uses: ["揚げ物調理", "冷凍食品の調理", "平日の時短"],
    summary:
      "ノンフライヤーを、容量・温度・タイマー・洗いやすさの確認項目に分けて比べます。",
    leftProduct: "アイリスオーヤマ FVX-D3",
    rightProduct: "ティファール EY201",
    leftPoint: "容量と操作方法を確認して選びたい人向け",
    rightPoint: "調理モードやブランドの使い勝手を確認したい人向け",
  },
  {
    id: "recolte-automatic-cooker-vs-panasonic-nf-pc400",
    title:
      "レコルト自動調理ポットとパナソニック NF-PC400、どっち？｜くらべる商品メモ",
    headline: "自動調理鍋を比較。容量・メニュー・洗いやすさで選ぶ",
    description:
      "自動調理家電を、容量・調理モード・予約・お手入れの確認項目で比較します。",
    category: "キッチン家電",
    tags: ["自動調理", "電気鍋", "時短家電"],
    audiences: ["料理の手間を減らしたい人", "家族分の容量を確認したい人"],
    uses: ["スープ作り", "煮込み料理", "平日の作り置き"],
    summary:
      "自動調理家電の候補を、容量・メニュー・予約機能・洗浄性で整理します。",
    leftProduct: "レコルト 自動調理ポット RSY-2",
    rightProduct: "パナソニック NF-PC400",
    leftPoint: "少量調理と置き場所を優先する人向け",
    rightPoint: "家族分の調理容量と多機能さを確認したい人向け",
    productInfoCheckedAt: "2026-08-21",
    officialSources: [
      {
        label: "récolte 自動調理ポット 公式",
        url: "https://recolte-jp.com/products/auto-cooking-pot/",
      },
      {
        label: "パナソニック NF-PC400 公式",
        url: "https://panasonic.jp/cook/products/NF-PC400.html",
      },
      {
        label: "パナソニック NF-PC400 サポート",
        url: "https://panasonic.jp/cook/products/NF-PC400/support.html",
      },
    ],
    verifiedRows: [
      { label: "容量", left: "約600ml", right: "調理容量2.6L・最大6人分" },
      {
        label: "消費電力",
        left: "600W（JUICE&CLEANは55W）",
        right: "公式ページ本文で確認できず",
      },
      {
        label: "サイズ",
        left: "約幅16.5×奥行12.0×高さ23.3cm",
        right: "公式ページ本文で確認できず",
      },
      {
        label: "温度",
        left: "WARM：約75℃前後",
        right: "数値は公式ページで確認できず",
      },
      {
        label: "調理モード",
        left: "5種類（SOYMILKなど）",
        right: "20種類の自動メニュー。圧力・無水・低温・蒸し・煮込み",
      },
      {
        label: "予約",
        left: "公式ページで確認できず",
        right: "3〜15時間後（一部自動調理のみ）",
      },
      {
        label: "手入れ",
        left: "JUICE&CLEAN約3分。本体外側・電源コードは水洗い不可",
        right: "ふた・内ふた・内なべの3点。蒸し板使用時は蒸し板も洗浄",
      },
    ],
  },
  {
    id: "brita-marella-vs-zero-water",
    title: "ブリタ マレーラとゼロウォーター、どっち？｜くらべる商品メモ",
    headline: "ポット型浄水器を比較。容量・カートリッジ・交換コストで選ぶ",
    description:
      "ポット型浄水器を、容量・ろ過方式・交換目安・注水方法で比較します。",
    category: "キッチン用品",
    tags: ["浄水器", "ブリタ", "水"],
    audiences: ["水道水を手軽に使いたい人", "カートリッジを比較したい人"],
    uses: ["飲み水", "料理", "冷蔵庫での保管"],
    summary: "ポット型浄水器を、容量・ろ過・交換・冷蔵庫収納の観点で比べます。",
    leftProduct: "ブリタ マレーラ",
    rightProduct: "ゼロウォーター 10カップ",
    leftPoint: "入手しやすい交換カートリッジを重視する人向け",
    rightPoint: "ろ過性能の確認を優先したい人向け",
  },
  {
    id: "tiger-jpv-l100-vs-zojirushi-nw-fc10",
    title: "タイガー JPV-L100と象印 NW-FC10、どっち？｜くらべる商品メモ",
    headline: "5.5合炊き炊飯器を比較。炊飯方式・メニュー・手入れで選ぶ",
    description:
      "5.5合炊き炊飯器を、炊飯方式・メニュー・内釜・お手入れで比較します。",
    category: "キッチン家電",
    tags: ["炊飯器", "5.5合", "家電"],
    audiences: ["毎日ごはんを炊く人", "炊飯器の上位モデルを比べたい人"],
    uses: ["家族のごはん", "冷凍ごはん", "炊き込みごはん"],
    summary:
      "人気の5.5合炊き候補を、炊飯方式・メニュー・内釜・清掃性で整理します。",
    leftProduct: "タイガー JPV-L100",
    rightProduct: "象印 NW-FC10",
    leftPoint: "土鍋系の炊き上がりと操作を確認したい人向け",
    rightPoint: "圧力・メニュー数と保温仕様を確認したい人向け",
  },
  {
    id: "sharp-kc-s50-vs-panasonic-f-vxw55",
    title: "シャープ KC-S50とパナソニック F-VXW55、どっち？｜くらべる商品メモ",
    headline: "加湿空気清浄機を比較。適用床面積・加湿・フィルターで選ぶ",
    description:
      "加湿空気清浄機を、適用床面積・加湿量・フィルター・お手入れで比較します。",
    category: "生活家電",
    tags: ["空気清浄機", "加湿器", "花粉対策"],
    audiences: [
      "空気清浄と加湿を一台で行いたい人",
      "フィルター交換を確認したい人",
    ],
    uses: ["リビング", "寝室", "乾燥対策"],
    summary:
      "加湿空気清浄機を、部屋の広さ・加湿・フィルター・給水の観点で比べます。",
    leftProduct: "シャープ KC-S50",
    rightProduct: "パナソニック F-VXW55",
    leftPoint: "プラズマクラスターと基本性能を確認したい人向け",
    rightPoint: "ナノイーや加湿運転の仕様を確認したい人向け",
  },
  {
    id: "anker-soundcore-liberty-4-nc-vs-sony-wf-c710n",
    title:
      "Soundcore Liberty 4 NCとソニー WF-C710N、どっち？｜くらべる商品メモ",
    headline: "ノイズキャンセリングイヤホンを比較。機能・電池・装着感で選ぶ",
    description:
      "完全ワイヤレスイヤホンを、ノイズキャンセリング・連続再生・防水・アプリで比較します。",
    category: "オーディオ",
    tags: ["ワイヤレスイヤホン", "ノイズキャンセリング", "通勤"],
    audiences: ["通勤中に音楽を聴く人", "1万円前後のイヤホンを比べたい人"],
    uses: ["通勤・通学", "オンライン会議", "動画視聴"],
    summary:
      "人気の完全ワイヤレス候補を、ANC・再生時間・防水・アプリ機能で整理します。",
    leftProduct: "Soundcore Liberty 4 NC",
    rightProduct: "ソニー WF-C710N",
    leftPoint: "機能数と長時間再生を確認したい人向け",
    rightPoint: "軽さとソニーの音質・装着設計を確認したい人向け",
  },
  {
    id: "xiaomi-redmi-watch-5-vs-huawei-band-10",
    title: "Redmi Watch 5とHUAWEI Band 10、どっち？｜くらべる商品メモ",
    headline: "スマートウォッチ・活動量計を比較。画面・電池・健康記録で選ぶ",
    description:
      "手頃なウェアラブル端末を、画面・バッテリー・通知・健康記録で比較します。",
    category: "スマート機器",
    tags: ["スマートウォッチ", "活動量計", "健康管理"],
    audiences: ["初めてスマート機器を買う人", "電池持ちを重視する人"],
    uses: ["歩数管理", "睡眠記録", "スマホ通知"],
    summary:
      "手頃なウェアラブル候補を、画面サイズ・電池・通知・記録機能で比べます。",
    leftProduct: "Xiaomi Redmi Watch 5",
    rightProduct: "HUAWEI Band 10",
    leftPoint: "大きな画面と時計らしい操作を優先する人向け",
    rightPoint: "軽さとバンド型の装着感を優先する人向け",
  },
  {
    id: "panasonic-eh-na9m-vs-refa-beautech",
    title: "パナソニック EH-NA9MとReFa BEAUTECH、どっち？｜くらべる商品メモ",
    headline: "高機能ドライヤーを比較。ケア機能・風量・重さで選ぶ",
    description:
      "高機能ドライヤーを、搭載モード・風量・重量・収納性の公式情報で比較します。",
    category: "美容家電",
    tags: ["ドライヤー", "ヘアケア", "美容家電"],
    audiences: [
      "毎日のヘアケアを見直したい人",
      "高機能ドライヤーを比較したい人",
    ],
    uses: ["髪を乾かす", "ヘアケア", "旅行以外の毎日使い"],
    summary:
      "高機能ドライヤーを、ケアモード・風量・重量・収納性の確認項目で比べます。",
    leftProduct: "パナソニック ナノケア EH-NA9M",
    rightProduct: "ReFa BEAUTECH DRYER",
    leftPoint: "複数のケアモードと風量を確認したい人向け",
    rightPoint: "温度管理やサロン系の仕上がりを確認したい人向け",
  },
  {
    id: "philips-s9000-vs-braun-series9pro",
    title:
      "フィリップス S9000とブラウン Series 9 Pro、どっち？｜くらべる商品メモ",
    headline: "電動シェーバーを比較。刃の方式・防水・充電で選ぶ",
    description:
      "電動シェーバーを、刃の方式・洗浄・防水・電池・替刃の確認項目で比較します。",
    category: "美容家電",
    tags: ["電動シェーバー", "メンズ美容", "身だしなみ"],
    audiences: [
      "毎朝のひげ剃りを効率化したい人",
      "上位シェーバーを比較したい人",
    ],
    uses: ["ひげ剃り", "出張", "お風呂剃り"],
    summary:
      "上位電動シェーバーを、刃の方式・洗浄・防水・充電の違いで整理します。",
    leftProduct: "フィリップス S9000",
    rightProduct: "ブラウン Series 9 Pro",
    leftPoint: "回転式の肌当たりと操作を確認したい人向け",
    rightPoint: "往復式の深剃りと洗浄システムを確認したい人向け",
  },
  {
    id: "anessa-perfect-uv-vs-biore-aqua-rich",
    title:
      "アネッサ パーフェクトUVとビオレUV アクアリッチ、どっち？｜くらべる商品メモ",
    headline: "日焼け止めを比較。SPF・落とし方・使用感の確認ポイント",
    description:
      "日焼け止めを、表示・耐水性・落とし方・塗り直しのしやすさで比較します。",
    category: "日用品",
    tags: ["日焼け止め", "UV対策", "スキンケア"],
    audiences: [
      "日常用の日焼け止めを探している人",
      "用途別にUV対策を選びたい人",
    ],
    uses: ["通勤・通学", "レジャー", "顔・からだのUV対策"],
    summary: "日焼け止めを、表示・耐水性・落とし方・塗り直しの観点で比べます。",
    leftProduct: "アネッサ パーフェクトUV",
    rightProduct: "ビオレUV アクアリッチ",
    leftPoint: "屋外レジャー向けの耐久性を確認したい人向け",
    rightPoint: "日常使いの軽い使用感と塗りやすさを重視する人向け",
  },
  {
    id: "tempur-original-vs-nishikawa-air-pillow",
    title: "テンピュール オリジナルと西川 AiR枕、どっち？｜くらべる商品メモ",
    headline: "人気の枕を比較。素材・高さ調整・手入れで選ぶ",
    description:
      "枕の候補を、素材・高さ・寝姿勢・カバーのお手入れで比較します。",
    category: "寝具",
    tags: ["枕", "睡眠", "寝具"],
    audiences: ["枕を買い替えたい人", "寝姿勢に合う高さを探したい人"],
    uses: ["睡眠", "首まわりの寝具選び", "来客用寝具"],
    summary: "人気の枕を、素材・高さ・寝姿勢・お手入れの確認項目で整理します。",
    leftProduct: "テンピュール オリジナルピロー",
    rightProduct: "西川 AiR 3Dピロー",
    leftPoint: "低反発素材の沈み込みと支えを確認したい人向け",
    rightPoint: "高さ調整や通気性を確認したい人向け",
  },
  {
    id: "samsonite-c-lite-vs-proteca-maxpass",
    title:
      "サムソナイト C-Liteとプロテカ マックスパス、どっち？｜くらべる商品メモ",
    headline: "人気スーツケースを比較。軽さ・容量・機内持ち込みで選ぶ",
    description:
      "スーツケースを、サイズ・重量・容量・キャスター・保証の公式情報で比較します。",
    category: "旅行用品",
    tags: ["スーツケース", "旅行", "機内持ち込み"],
    audiences: ["出張や旅行のケースを探している人", "軽量モデルを比較したい人"],
    uses: ["国内旅行", "海外旅行", "出張"],
    summary:
      "人気スーツケースを、重量・容量・収納・走行性・保証の観点で比べます。",
    leftProduct: "サムソナイト C-Lite",
    rightProduct: "プロテカ マックスパス",
    leftPoint: "軽さと大容量を優先する人向け",
    rightPoint: "国内移動と機内持ち込みの使いやすさを確認したい人向け",
  },
  {
    id: "montbell-tri-pack-vs-anello-backpack",
    title: "モンベル トライパックとanelloリュック、どっち？｜くらべる商品メモ",
    headline: "通勤・通学リュックを比較。容量・PC収納・背負いやすさで選ぶ",
    description:
      "通勤通学リュックを、容量・PC収納・ポケット・重量・背負い方で比較します。",
    category: "バッグ",
    tags: ["リュック", "通勤", "通学"],
    audiences: ["毎日使うリュックを探している人", "PCを持ち運ぶ人"],
    uses: ["通勤", "通学", "ノートPCの持ち運び"],
    summary:
      "通勤・通学用リュックを、容量・PC収納・ポケット・重量で整理します。",
    leftProduct: "モンベル トライパック 30",
    rightProduct: "anello 多機能リュック",
    leftPoint: "アウトドア由来の背負い心地と容量を確認したい人向け",
    rightPoint: "日常の収納ポケットと取り出しやすさを重視する人向け",
  },
  {
    id: "thermos-jdp-501-vs-zojirushi-sm-za48",
    title: "サーモス JDP-501と象印 SM-ZA48、どっち？｜くらべる商品メモ",
    headline: "保温保冷マグを比較。容量・飲み口・洗いやすさで選ぶ",
    description:
      "携帯マグを、容量・保温保冷・飲み口・パーツ・洗いやすさで比較します。",
    category: "キッチン用品",
    tags: ["水筒", "マグボトル", "保温"],
    audiences: ["毎日持ち歩くボトルを探している人", "洗いやすさを重視する人"],
    uses: ["通勤・通学", "オフィス", "外出"],
    summary: "人気の携帯マグを、容量・保温保冷・飲み口・お手入れで比べます。",
    leftProduct: "サーモス JDP-501",
    rightProduct: "象印 SM-ZA48",
    leftPoint: "スリムさと片手での使いやすさを確認したい人向け",
    rightPoint: "軽さとせん構造・洗いやすさを確認したい人向け",
  },
  {
    id: "panasonic-washer-na-lx129c-vs-hitachi-bd-sx130k",
    title: "パナソニック NA-LX129Cと日立 BD-SX130K、どっち？｜くらべる商品メモ",
    headline: "ドラム式洗濯乾燥機を比較。容量・乾燥・自動投入で選ぶ",
    description:
      "ドラム式洗濯乾燥機を、洗濯乾燥容量・乾燥方式・自動投入・設置寸法で比較します。",
    category: "生活家電",
    tags: ["ドラム式洗濯乾燥機", "洗濯", "家事時短"],
    audiences: ["洗濯乾燥を一台で済ませたい人", "設置前に寸法を確認したい人"],
    uses: ["毎日の洗濯", "乾燥までの時短", "家族の洗濯"],
    summary:
      "ドラム式洗濯乾燥機を、容量・乾燥・自動投入・設置条件で整理します。",
    leftProduct: "パナソニック NA-LX129C",
    rightProduct: "日立 BD-SX130K",
    leftPoint: "洗剤自動投入と省手間機能を確認したい人向け",
    rightPoint: "乾燥方式と洗濯コースを確認したい人向け",
  },
  {
    id: "sharp-heater-hv-r55-vs-iris-uhk500",
    title:
      "シャープ HV-R55とアイリスオーヤマ UHK-500、どっち？｜くらべる商品メモ",
    headline: "加湿器を比較。加湿方式・適用床面積・給水で選ぶ",
    description:
      "加湿器を、加湿方式・適用床面積・タンク容量・お手入れで比較します。",
    category: "生活家電",
    tags: ["加湿器", "乾燥対策", "冬家電"],
    audiences: ["部屋の乾燥対策をしたい人", "加湿方式を比べたい人"],
    uses: ["寝室", "リビング", "冬の乾燥対策"],
    summary: "加湿器を、方式・適用床面積・給水・手入れの確認項目で比べます。",
    leftProduct: "シャープ HV-R55",
    rightProduct: "アイリスオーヤマ UHK-500",
    leftPoint: "気化式の省エネ性と清潔機能を確認したい人向け",
    rightPoint: "ハイブリッド式の加湿量と操作を確認したい人向け",
  },
  {
    id: "dyson-v12-detect-slim-vs-shark-evo-power",
    title:
      "ダイソン V12 Detect SlimとShark EVOPOWER、どっち？｜くらべる商品メモ",
    headline: "コードレス掃除機を比較。吸引・軽さ・ゴミ捨てで選ぶ",
    description:
      "コードレス掃除機を、重量・運転時間・ヘッド・ゴミ捨て・収納で比較します。",
    category: "生活家電",
    tags: ["コードレス掃除機", "ダイソン", "シャーク"],
    audiences: ["掃除機を買い替えたい人", "吸引力と軽さを比べたい人"],
    uses: ["フローリング掃除", "ペットの毛", "部分掃除"],
    summary:
      "人気のコードレス掃除機を、吸引・重量・ヘッド・ゴミ捨てで整理します。",
    leftProduct: "Dyson V12 Detect Slim",
    rightProduct: "Shark EVOPOWER SYSTEM",
    leftPoint: "微細なゴミの可視化と吸引性能を確認したい人向け",
    rightPoint: "自走ヘッドとハンディ化の使い勝手を確認したい人向け",
  },
  {
    id: "t-fal-ko5901jp-vs-zoujirushi-ck-pa08",
    title: "ティファール KO5901JPと象印 CK-PA08、どっち？｜くらべる商品メモ",
    headline: "電気ケトルを比較。容量・沸騰時間・安全機能で選ぶ",
    description:
      "電気ケトルを、容量・沸騰・保温・安全機能・手入れの確認項目で比較します。",
    category: "キッチン家電",
    tags: ["電気ケトル", "時短", "キッチン"],
    audiences: ["毎朝お湯を沸かす人", "電気ケトルを買い替えたい人"],
    uses: ["コーヒー", "インスタント食品", "赤ちゃんのミルク作り"],
    summary: "電気ケトルを、容量・沸騰時間・安全性・注ぎやすさで比べます。",
    leftProduct: "ティファール KO5901JP",
    rightProduct: "象印 CK-PA08",
    leftPoint: "必要な分だけ素早く沸かしたい人向け",
    rightPoint: "蒸気対策や安全機能を確認したい人向け",
  },
  {
    id: "re-fa-straight-iron-vs-panasonic-eh-hs0e",
    title:
      "ReFaストレートアイロンとパナソニック EH-HS0E、どっち？｜くらべる商品メモ",
    headline: "ストレートアイロンを比較。温度・プレート・立ち上がりで選ぶ",
    description:
      "ストレートアイロンを、温度設定・プレート・立ち上がり・海外対応で比較します。",
    category: "美容家電",
    tags: ["ヘアアイロン", "ストレートアイロン", "美容"],
    audiences: ["毎朝スタイリングする人", "ヘアアイロンを買い替えたい人"],
    uses: ["寝ぐせ直し", "ストレートヘア", "旅行"],
    summary:
      "ストレートアイロンを、温度・プレート・立ち上がり・携帯性で整理します。",
    leftProduct: "ReFa ストレートアイロン プロ",
    rightProduct: "パナソニック EH-HS0E",
    leftPoint: "プレート設計と仕上がりを確認したい人向け",
    rightPoint: "立ち上がりと使いやすい温度設定を重視する人向け",
  },
  {
    id: "nitori-n-sleep-vs-nishikawa-air-mattress",
    title: "ニトリ Nスリープと西川 AiRマットレス、どっち？｜くらべる商品メモ",
    headline: "人気マットレスを比較。硬さ・構造・サイズ・手入れで選ぶ",
    description:
      "マットレスの候補を、構造・硬さ・サイズ・カバー・お手入れで比較します。",
    category: "寝具",
    tags: ["マットレス", "睡眠", "家具"],
    audiences: ["寝具を買い替えたい人", "体格や寝姿勢で選びたい人"],
    uses: ["毎日の睡眠", "引っ越し", "ベッド選び"],
    summary:
      "人気マットレスを、構造・硬さ・サイズ・手入れの確認項目で比べます。",
    leftProduct: "ニトリ Nスリープ",
    rightProduct: "西川 AiRマットレス",
    leftPoint: "価格とポケットコイル構造を確認したい人向け",
    rightPoint: "体圧分散と素材構造を確認したい人向け",
  },
  {
    id: "apple-watch-se-vs-xiaomi-redmi-watch-5",
    title: "Apple Watch SEとRedmi Watch 5、どっち？｜くらべる商品メモ",
    headline: "スマートウォッチを比較。対応スマホ・通知・健康記録で選ぶ",
    description:
      "スマートウォッチを、対応OS・通知・健康記録・電池・決済機能で比較します。",
    category: "スマート機器",
    tags: ["スマートウォッチ", "Apple Watch", "健康管理"],
    audiences: [
      "スマートウォッチを初めて買う人",
      "iPhoneとAndroidで選びたい人",
    ],
    uses: ["通知確認", "運動記録", "日常の健康管理"],
    summary:
      "スマートウォッチを、対応スマホ・通知・健康記録・電池で整理します。",
    leftProduct: "Apple Watch SE",
    rightProduct: "Xiaomi Redmi Watch 5",
    leftPoint: "iPhone連携とアプリ・決済を確認したい人向け",
    rightPoint: "長い電池持ちと大画面を確認したい人向け",
  },
  {
    id: "sony-bravia-55-xr80-vs-regza-55z870n",
    title: "ソニー BRAVIA 55型とREGZA 55Z870N、どっち？｜くらべる商品メモ",
    headline: "55型テレビを比較。映像・録画・ゲーム機能で選ぶ",
    description:
      "55型テレビを、パネル・映像処理・録画・音声・ゲーム機能で比較します。",
    category: "テレビ・映像",
    tags: ["テレビ", "55型", "ゲーム"],
    audiences: [
      "リビングのテレビを買い替えたい人",
      "ゲームもテレビも楽しみたい人",
    ],
    uses: ["テレビ視聴", "動画配信", "家庭用ゲーム"],
    summary: "55型テレビを、映像・録画・音声・ゲーム機能の確認項目で比べます。",
    leftProduct: "ソニー BRAVIA 55型 XR80",
    rightProduct: "REGZA 55Z870N",
    leftPoint: "映像処理とGoogle TVの連携を確認したい人向け",
    rightPoint: "録画機能とゲーム向け設定を確認したい人向け",
  },
  ...officialSpecCommercialArticleSeeds,
  ...logicoolCommercialArticleSeeds,
];

export const additionalCommercialArticles = Object.freeze(
  commercialArticleSeeds.map(createCommercialArticle),
);

export const additionalCommercialArticleSeeds = commercialArticleSeeds;

export const articleMetadata = Object.freeze([
  pampersNewbornArticle,
  merriesNewbornArticle,
  merriesPantsArticle,
  pigeonBottle240Article,
  pigeonSlim240Article,
  moonyMArticle,
  shupotArticle,
  babybjornArticle,
  babybjornOnekaiArticle,
  babybjornBouncerArticle,
  cradleArticle,
  pottyArticle,
  pigeonBottleSizeArticle,
  combiTheSArticle,
  tigerRiceArticle,
  tigerPctA120VsPctA150Article,
  zojirushiCoffeeArticle,
  panasonicVacuumArticle,
  panasonicHairDryerArticle,
  tefalKettleArticle,
  panasonicNeFl1aVsNeFl1cArticle,
  sharpKcS50VsFuS50Article,
  thermosTigerBottleArticle,
  yamazakiTowerDeskPanelArticle,
  yamazakiCondorWagonArticle,
  yamazakiFreeBroomArticle,
  yamazakiDustWagonArticle,
  zojirushiElectricKettleArticle,
  tefalGarmentSteamerArticle,
  kingjimTepraArticle,
  panasonicFyhvx120VsFyhvx90Article,
  panasonicBabyMonitorArticle,
  panasonicEhNa9mGuideArticle,
  thermosKfm020VsKfi020Article,
  tigerMtaJ050GuideArticle,
  panasonicEhNa9mVsEhNa7mArticle,
  tigerKettlePcjVsPcmArticle,
  ...additionalCommercialArticles,
]);

const commercialArticleIds = new Set(
  additionalCommercialArticleSeeds.map((article) => article.id),
);

// 初稿の共通テンプレート記事は、商品情報の確認日が入るまで公開対象から外す。
export const publicArticleMetadata = Object.freeze(
  articleMetadata.filter(
    (article) =>
      !commercialArticleIds.has(article.id) ||
      Boolean(article.productInfoCheckedAt),
  ),
);

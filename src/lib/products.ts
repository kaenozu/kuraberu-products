/**
 * 商品マスタ（共通データ）
 *
 * 比較記事で繰り返し参照される商品の一次データ（容量・重量・寸法・公式URL・
 * 楽天URL・画像パスなど）を1箇所に集約する。数値の根拠はメーカー公式情報のみで、
 * 確認日と参照先は各記事の metadata（productInfoCheckedAt 等）で管理する。
 */

export interface ProductSpec {
  /** 容量（例: 0.5L） */
  capacity: string;
  /** 保温効力（6時間） */
  warmEfficiency: string;
  /** 保冷効力（6時間） */
  coldEfficiency: string;
  /** 本体重量 */
  weight: string;
  /** 本体寸法（幅×奥行×高さ） */
  dimensions: string;
  /** 口径 */
  mouthDiameter: string;
  /** カラー数 */
  colors: string;
  /** 飲み口タイプ */
  mouthType: string;
  /** お手入れ方法 */
  care: string;
  /** ハンドル */
  handle: string;
}

export interface Product {
  /** 記事・画像パスで使うスラグ（例: thermos-jnl-s500） */
  id: string;
  /** ブランド表示名 */
  brand: string;
  /** 型番（例: JNL-S500） */
  model: string;
  /** 商品フルネーム（例: サーモス 真空断熱ケータイマグ JNL-S500） */
  fullName: string;
  /** 公式ページのシリーズ名（情報源リンクの表示に使う） */
  seriesName: string;
  /** 共通仕様 */
  spec: ProductSpec;
  /** メーカー公式ページ */
  officialUrl: string;
  /** 楽天商品ページ（アフィリエイト直リンク） */
  rakutenUrl: string;
  /** 楽天検索URL */
  rakutenSearchUrl: string;
  /** 商品画像パス（public/products/ 配下） */
  imagePath: string;
}

/** サーモス 真空断熱ケータイマグ JNL-S500（0.5L） */
export const thermosJnlS500: Product = {
  id: "thermos-jnl-s500",
  brand: "サーモス",
  model: "JNL-S500",
  fullName: "サーモス 真空断熱ケータイマグ JNL-S500",
  seriesName: "真空断熱ケータイマグ JNL-S350･S500･S600･S750･S1000",
  spec: {
    capacity: "0.5L",
    warmEfficiency: "68℃以上",
    coldEfficiency: "10℃以下",
    weight: "約0.2kg",
    dimensions: "6.5×8.0×22.0cm",
    mouthDiameter: "約4.0cm",
    colors: "12色",
    mouthType: "ワンタッチオープン",
    care: "全パーツ食洗機対応",
    handle: "なし",
  },
  officialUrl: "https://www.thermos.jp/product/series/jnl-s00.html",
  rakutenUrl: "https://a.r10.to/hPl2PS",
  rakutenSearchUrl:
    "https://search.rakuten.co.jp/search/mall/%E3%82%B5%E3%83%BC%E3%83%A2%E3%82%B9%20JNL-S500",
  imagePath: "/products/thermos-jnl-s500.jpg",
};

/** タイガー 真空断熱ボトル MTA-J050（0.5L） */
export const tigerMtaJ050: Product = {
  id: "tiger-mta-j050",
  brand: "タイガー",
  model: "MTA-J050",
  fullName: "タイガー 真空断熱ボトル MTA-J050",
  seriesName: "真空断熱ボトル MTA-J050/J080",
  spec: {
    capacity: "0.5L",
    warmEfficiency: "68℃以上",
    coldEfficiency: "8℃以下",
    weight: "約0.26kg",
    dimensions: "7.5×8.6×23.3cm",
    mouthDiameter: "約4.8cm",
    colors: "4色",
    mouthType: "ワンプッシュ",
    care: "らくらくキャップ（パッキン一体型）",
    handle: "あり（スラントハンドル）",
  },
  officialUrl:
    "https://www.tiger-corporation.com/ja/jpn/product/vacuum-insulated-products/mta-j/",
  rakutenUrl: "https://a.r10.to/hHdLbn",
  rakutenSearchUrl:
    "https://search.rakuten.co.jp/search/mall/%E3%82%BF%E3%82%A4%E3%82%AC%E3%83%BC%20MTA-J050",
  imagePath: "/products/tiger-mta-j050.jpg",
};

/** 記事で比較する商品ペアをまとめて参照できるようにする */
export const thermosTigerBottlePair = {
  left: thermosJnlS500,
  right: tigerMtaJ050,
} as const;

/**
 * 記事別の購入（アフィリエイト）URL レジストリ（単一情報源）
 *
 * キーは「<記事スラグ>:<left|right|card>」。購入URLは、記事ページの
 * NextStepBlock（次にすることブロック）・記事末尾の PurchaseCard・
 * 本文中の購入リンクすべてがここを参照する。
 * 更新はこの1ファイルだけで、スクリプト scripts/check-purchase-link-consistency.mjs が
 * 「ブロックと末尾カードが同一キーを参照していること」を CI で検証する。
 */
export interface ArticlePurchaseLink {
  /** 表示名（例: ムーニー 低刺激であんしん） */
  name: string;
  /** 購入（アフィリエイト）URL */
  purchaseUrl: string;
}

export const articlePurchaseLinks = {
  "babybjorn-bouncer:left": {
    name: "ベビービョルン Bliss",
    purchaseUrl:
      "https://hb.afl.rakuten.co.jp/ichiba/56e37453.8885bd8a.56e37454.e8853422/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fbabybjorn%2Fbouncer-bliss%2F&link_type=picttext",
  },
  "babybjorn-bouncer:right": {
    name: "ベビービョルン バランスソフト",
    purchaseUrl:
      "https://hb.afl.rakuten.co.jp/ichiba/56e37453.8885bd8a.56e37454.e8853422/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fbabybjorn%2Fbouncer-balance-soft%2F&link_type=picttext",
  },
  "babybjorn-cradle:left": {
    name: "ベビービョルン クレードル",
    purchaseUrl:
      "https://hb.afl.rakuten.co.jp/ichiba/56e37453.8885bd8a.56e37454.e8853422/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fbabybjorn%2Fbaby-cradle%2F&link_type=picttext",
  },
  "babybjorn-cradle:right": {
    name: "アップリカ ココネルエアー AB",
    purchaseUrl:
      "https://hb.afl.rakuten.co.jp/ichiba/56e58e32.3ad2a371.56e58e34.66665b3b/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Faprica-shop%2Fapr2594%2F&link_type=picttext",
  },
  "babybjorn-onekai:left": {
    name: "ベビービョルン ONE KAI",
    purchaseUrl:
      "https://hb.afl.rakuten.co.jp/hgc/56e37453.8885bd8a.56e37454.e8853422/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fbabybjorn%2Fbabycarrier-one-kai-air%2F&link_type=text",
  },
  "babybjorn-onekai:right": {
    name: "ベビービョルン MOVE",
    purchaseUrl:
      "https://hb.afl.rakuten.co.jp/hgc/56e37453.8885bd8a.56e37454.e8853422/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fbabybjorn%2Fbabycarrier-move%2F&link_type=text",
  },
  "babybjorn-potty:left": {
    name: "ベビービョルン スマートポッティ",
    purchaseUrl:
      "https://hb.afl.rakuten.co.jp/ichiba/56e37453.8885bd8a.56e37454.e8853422/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fbabybjorn%2Fsmart-potty%2F&link_type=text",
  },
  "babybjorn-potty:right": {
    name: "ベビービョルン ポッティチェア",
    purchaseUrl:
      "https://hb.afl.rakuten.co.jp/ichiba/56e37453.8885bd8a.56e37454.e8853422/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fbabybjorn%2Fpotty-chair%2F&link_type=text",
  },
  "babybjorn:left": {
    name: "ベビービョルン HARMONY",
    purchaseUrl: "https://a.r10.to/hgxfw5",
  },
  "babybjorn:right": {
    name: "ベビービョルン MINI",
    purchaseUrl: "https://a.r10.to/hY6U8Q",
  },
  "combi-the-s-plus-vs-premium:left": {
    name: "コンビ THE S plus",
    purchaseUrl: "https://a.r10.to/hgk4Rg",
  },
  "combi-the-s-plus-vs-premium:right": {
    name: "コンビ THE S premium",
    purchaseUrl: "https://a.r10.to/hPmZEE",
  },
  "hitachi-bd-sx130k-vs-bd-stx130k:left": {
    name: "日立 BD-SX130K",
    purchaseUrl: "https://a.r10.to/hgXjdE",
  },
  "hitachi-bd-sx130k-vs-bd-stx130k:right": {
    name: "日立 BD-STX130K",
    purchaseUrl: "https://a.r10.to/hRIzoN",
  },
  "kingjim-tepra-sr-r2500p-vs-sr-mk1:left": {
    name: "キングジム テプラ PRO SR-R2500P",
    purchaseUrl: "https://a.r10.to/h9jN67",
  },
  "kingjim-tepra-sr-r2500p-vs-sr-mk1:right": {
    name: "キングジム テプラ PRO SR-MK1",
    purchaseUrl: "https://a.r10.to/hPnFPC",
  },
  "merries-newborn:left": {
    name: "メリーズ 新生児用 ファーストプレミアム",
    purchaseUrl: "https://a.r10.to/h5xcuC",
  },
  "merries-newborn:right": {
    name: "メリーズ 新生児用 ずっと肌さらエアスルー",
    purchaseUrl: "https://a.r10.to/h8gCjo",
  },
  "merries-pants:left": {
    name: "メリーズ パンツタイプ ファーストプレミアム",
    purchaseUrl: "https://a.r10.to/hPx3cE",
  },
  "merries-pants:right": {
    name: "メリーズ パンツタイプ ずっと肌さらエアスルー",
    purchaseUrl: "https://a.r10.to/h5LbWy",
  },
  "moony-m:left": {
    name: "ムーニー 低刺激であんしん",
    purchaseUrl: "https://a.r10.to/h58jf3",
  },
  "moony-m:right": {
    name: "ムーニー マシュマロ肌ごこちモレ安心",
    purchaseUrl: "https://a.r10.to/h5ZjVa",
  },
  "pampers-newborn:left": {
    name: "パンパース 新生児用 肌へのいちばん",
    purchaseUrl: "https://a.r10.to/hPtZZE",
  },
  "pampers-newborn:right": {
    name: "パンパース 新生児用 さらさらケア",
    purchaseUrl: "https://a.r10.to/h5Jh9V",
  },
  "panasonic-baby-monitor-kx-hc705:card": {
    name: "パナソニック ベビーモニター KX-HC705",
    purchaseUrl:
      "https://hb.afl.rakuten.co.jp/hgc/56e37453.8885bd8a.56e37454.e8853422/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fksdenki%2F4549980233351%2F&link_type=text",
  },
  "panasonic-eh-na9m-guide:card": {
    name: "パナソニック ナノケア EH-NA9M",
    purchaseUrl:
      "https://hb.afl.rakuten.co.jp/hgc/56e37453.8885bd8a.56e37454.e8853422/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fpanasonic-store%2Feh-na9m-h%2F&link_type=text",
  },
  "panasonic-eh-na9m-vs-eh-na7m:left": {
    name: "パナソニック ナノケア EH-NA9M",
    purchaseUrl:
      "https://hb.afl.rakuten.co.jp/hgc/56e37453.8885bd8a.56e37454.e8853422/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fpanasonic-store%2Feh-na9m-h%2F&link_type=text",
  },
  "panasonic-eh-na9m-vs-eh-na7m:right": {
    name: "パナソニック ナノケア EH-NA7M",
    purchaseUrl:
      "https://hb.afl.rakuten.co.jp/hgc/56e37453.8885bd8a.56e37454.e8853422/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fpanasonic-store%2Feh-na7m-h%2F&link_type=text",
  },
  "panasonic-eh-ne7m-vs-eh-ne5m:left": {
    name: "パナソニック EH-NE7M",
    purchaseUrl: "https://a.r10.to/h8tr3m",
  },
  "panasonic-eh-ne7m-vs-eh-ne5m:right": {
    name: "パナソニック EH-NE5M",
    purchaseUrl: "https://a.r10.to/hPEiKo",
  },
  "panasonic-mc-nx810km-vs-mc-nx700k:left": {
    name: "パナソニック MC-NX810KM",
    purchaseUrl: "https://a.r10.to/hPxF2V",
  },
  "panasonic-mc-nx810km-vs-mc-nx700k:right": {
    name: "パナソニック MC-NX700K",
    purchaseUrl: "https://a.r10.to/hgb52S",
  },
  "panasonic-f-yhvx120-vs-f-yhvx90:left": {
    name: "パナソニック F-YHVX120",
    purchaseUrl: "https://a.r10.to/hkSSwB",
  },
  "panasonic-f-yhvx120-vs-f-yhvx90:right": {
    name: "パナソニック F-YHVX90",
    purchaseUrl: "https://a.r10.to/hghANA",
  },
  "panasonic-mc-sb55k-vs-mc-sb35k:left": {
    name: "パナソニック MC-SB55K",
    purchaseUrl: "https://a.r10.to/hPgPTZ",
  },
  "panasonic-mc-sb55k-vs-mc-sb35k:right": {
    name: "パナソニック MC-SB35K",
    purchaseUrl: "https://a.r10.to/hgxWYi",
  },
  "panasonic-ne-fl1a-vs-ne-fl1c:left": {
    name: "パナソニック NE-FL1A",
    purchaseUrl: "https://a.r10.to/hFqCMV",
  },
  "panasonic-ne-fl1a-vs-ne-fl1c:right": {
    name: "パナソニック NE-FL1C",
    purchaseUrl: "https://a.r10.to/hPJAxE",
  },
  "pigeon-bottle-160-240:left": {
    name: "母乳実感 160ml",
    purchaseUrl: "https://a.r10.to/h4SQzW",
  },
  "pigeon-bottle-160-240:right": {
    name: "母乳実感 240ml",
    purchaseUrl: "https://a.r10.to/hk5u4n",
  },
  "pigeon-bottle-240:left": {
    name: "母乳実感 耐熱ガラス製（240ml）",
    purchaseUrl: "https://a.r10.to/hR4mwU",
  },
  "pigeon-bottle-240:right": {
    name: "母乳実感 プラスチック製（PPSU）（240ml）",
    purchaseUrl: "https://a.r10.to/hk5urF",
  },
  "pigeon-slim-240:left": {
    name: "ピジョン 母乳実感 240ml",
    purchaseUrl: "https://a.r10.to/hgLggX",
  },
  "pigeon-slim-240:right": {
    name: "ピジョン スリムタイプ 240ml",
    purchaseUrl: "https://a.r10.to/h586fn",
  },
  "sharp-kc-s50-vs-fu-s50:left": {
    name: "シャープ KC-S50",
    purchaseUrl: "https://a.r10.to/hgZ0mc",
  },
  "sharp-kc-s50-vs-fu-s50:right": {
    name: "シャープ FU-S50",
    purchaseUrl: "https://a.r10.to/hPyHPd",
  },
  "panasonic-f-px60c-vs-f-px70c:left": {
    name: "パナソニック F-PX60C",
    purchaseUrl: "https://a.r10.to/h8GBq2",
  },
  "panasonic-f-px60c-vs-f-px70c:right": {
    name: "パナソニック F-PX70C",
    purchaseUrl: "https://a.r10.to/h5bABV",
  },
  "panasonic-es-lt4b-vs-es-lv7j:left": {
    name: "パナソニック ES-LT4B",
    purchaseUrl: "https://a.r10.to/heFGiH",
  },
  "panasonic-es-lt4b-vs-es-lv7j:right": {
    name: "パナソニック ES-LV7J",
    purchaseUrl: "https://a.r10.to/hg2U2Z",
  },
  "shupot:left": {
    name: "ピジョン 電動鼻吸い器 シュポット 電動 シュポット",
    purchaseUrl: "https://a.r10.to/hglrVW",
  },
  "shupot:right": {
    name: "ピジョン 手動鼻吸い器 シュポットポンプ＋フィット鼻ノズル 手動 シュポットポンプ",
    purchaseUrl: "https://a.r10.to/hP1cll",
  },
  "tefal-dv4030j0-vs-dv8070j0:left": {
    name: "ティファール DV4030J0",
    purchaseUrl: "https://a.r10.to/hPgKfj",
  },
  "tefal-dv4030j0-vs-dv8070j0:right": {
    name: "ティファール DV8070J0",
    purchaseUrl: "https://a.r10.to/hgIiiI",
  },
  "tefal-ko5901jp-vs-ko8601j0:left": {
    name: "ティファール KO5901JP",
    purchaseUrl: "https://a.r10.to/hk5Hnn",
  },
  "tefal-ko5901jp-vs-ko8601j0:right": {
    name: "ティファール KO8601J0",
    purchaseUrl: "https://a.r10.to/h5Qe2o",
  },
  "thermos-kfm-020-vs-kfi-020:left": {
    name: "サーモス KFM-020",
    purchaseUrl: "https://a.r10.to/h5dcek",
  },
  "thermos-kfm-020-vs-kfi-020:right": {
    name: "サーモス KFI-020",
    purchaseUrl: "https://a.r10.to/h90Ny1",
  },
  "thermos-tiger-bottle:left": {
    name: "サーモス JNL-S500",
    purchaseUrl: thermosJnlS500.rakutenUrl,
  },
  "thermos-tiger-bottle:right": {
    name: "タイガー MTA-J050",
    purchaseUrl: tigerMtaJ050.rakutenUrl,
  },
  "tiger-jpv-l100-vs-jpv-m100:left": {
    name: "タイガー JPV-L100",
    purchaseUrl: "https://a.r10.to/hYk0zA",
  },
  "tiger-jpv-l100-vs-jpv-m100:right": {
    name: "タイガー JPV-M100",
    purchaseUrl: "https://a.r10.to/hPCd5O",
  },
  "tiger-mta-j050-guide:left": {
    name: "タイガー MTA-J050",
    purchaseUrl:
      "https://hb.afl.rakuten.co.jp/hgc/56e37453.8885bd8a.56e37454.e8853422/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Ftiger-official-store%2Fmta-j%2F&link_type=text",
  },
  "tiger-mta-j050-guide:right": {
    name: "タイガー MTA-J080",
    purchaseUrl:
      "https://hb.afl.rakuten.co.jp/hgc/56e37453.8885bd8a.56e37454.e8853422/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Ftiger-official-store%2Fmta-j%2F&link_type=text",
  },
  "tiger-pcj-a080-vs-pcm-a080:left": {
    name: "タイガー 電気ケトル PCJ-A080",
    purchaseUrl: "https://a.r10.to/h51Rfo",
  },
  "tiger-pcj-a080-vs-pcm-a080:right": {
    name: "タイガー 電気ケトル PCM-A080",
    purchaseUrl: "https://a.r10.to/hklMDi",
  },
  "tiger-pct-a120-vs-pct-a150:left": {
    name: "タイガー PCT-A120",
    purchaseUrl: "https://a.r10.to/hRBUg4",
  },
  "tiger-pct-a120-vs-pct-a150:right": {
    name: "タイガー PCT-A150",
    purchaseUrl: "https://a.r10.to/hPWaUo",
  },
  "yamazaki-condor-wagon-vs-self-wagon:left": {
    name: "山崎産業 コンドル FU943-000X-MB",
    purchaseUrl: "https://a.r10.to/heE5GH",
  },
  "yamazaki-condor-wagon-vs-self-wagon:right": {
    name: "山崎産業 コンドル FU944-000X-MB",
    purchaseUrl: "https://a.r10.to/hgTHoJ",
  },
  "yamazaki-dust-wagon-45l-2division-vs-3division:left": {
    name: "山崎実業 45L 2分別",
    purchaseUrl: "https://a.r10.to/h5XDqK",
  },
  "yamazaki-dust-wagon-45l-2division-vs-3division:right": {
    name: "山崎実業 45L 3分別",
    purchaseUrl: "https://a.r10.to/hPN3m0",
  },
  "yamazaki-laundry-wire-basket-m-vs-l:left": {
    name: "山崎実業 ランドリーワイヤーバスケット タワー スリム M（240001）",
    purchaseUrl: "https://a.r10.to/hgb9Ho",
  },
  "yamazaki-laundry-wire-basket-m-vs-l:right": {
    name: "山崎実業 ランドリーワイヤーバスケット タワー スリム L（240002）",
    purchaseUrl: "https://a.r10.to/hPyefh",
  },
  "yamazaki-ofuda-stand-rin-vs-single:left": {
    name: "山崎実業 神札スタンド リン（6141・6142）",
    purchaseUrl: "https://a.r10.to/hP8BTD",
  },
  "yamazaki-ofuda-stand-rin-vs-single:right": {
    name: "山崎実業 神札スタンド リン シングル（6144）",
    purchaseUrl: "https://a.r10.to/h59nMJ",
  },
  "yamazaki-dishwasher-rack-241925-vs-241926:left": {
    name: "山崎実業 食洗機ラック タワー ロータイプ（241925）",
    purchaseUrl: "https://a.r10.to/T3hEWa",
  },
  "yamazaki-dishwasher-rack-241925-vs-241926:right": {
    name: "山崎実業 食洗機ラック タワー ハイタイプ（241926）",
    purchaseUrl: "https://a.r10.to/hg9gYo",
  },
  "yamazaki-free-broom-32-vs-45:left": {
    name: "山崎産業 JS自由箒 32（BR952-032J-MB）",
    purchaseUrl: "https://a.r10.to/hP00rN",
  },
  "yamazaki-free-broom-32-vs-45:right": {
    name: "山崎産業 JS自由箒 45（BR952-045J-MB）",
    purchaseUrl: "https://a.r10.to/hYYwcU",
  },
  "yamazaki-tower-desk-panel-vs-pen-stand:left": {
    name: "山崎実業 tower デスク横トレー付きスチールパネル（10066 / 10067）",
    purchaseUrl: "https://a.r10.to/hPRhhu",
  },
  "yamazaki-tower-desk-panel-vs-pen-stand:right": {
    name: "山崎実業 tower マグネットペンスタンド（10096 / 10097）",
    purchaseUrl: "https://a.r10.to/hkdB9e",
  },
  "panasonic-nt-t501-vs-nt-d700:left": {
    name: "パナソニック NT-T501",
    purchaseUrl: "https://a.r10.to/hF1vxG",
  },
  "panasonic-nt-t501-vs-nt-d700:right": {
    name: "パナソニック NT-D700",
    purchaseUrl: "https://a.r10.to/hg4iM4",
  },
  "zojirushi-ck-pa08-vs-ck-dc08:left": {
    name: "象印 CK-PA08",
    purchaseUrl: "https://a.r10.to/hPwhA2",
  },
  "zojirushi-ck-pa08-vs-ck-dc08:right": {
    name: "象印 CK-DC08",
    purchaseUrl: "https://a.r10.to/hPdpn7",
  },
  "zojirushi-ec-kv50-vs-ec-ma60:left": {
    name: "象印 EC-KV50",
    purchaseUrl: "https://a.r10.to/h5QPUy",
  },
  "zojirushi-ec-kv50-vs-ec-ma60:right": {
    name: "象印 EC-MA60",
    purchaseUrl: "https://a.r10.to/h5Ob79",
  },
  "yamajitsu-film-holder-242286-vs-242287:left": {
    name: "山崎実業 フィルムフックまな板ホルダー タワー 242286",
    purchaseUrl: "https://a.r10.to/h5iqky",
  },
  "yamajitsu-film-holder-242286-vs-242287:right": {
    name: "山崎実業 フィルムフック鍋蓋ホルダー タワー 242287",
    purchaseUrl: "https://a.r10.to/hgDVKy",
  },
  "zojirushi-eq-sb22-vs-eq-ah22:left": {
    name: "象印 EQ-SB22",
    purchaseUrl: "https://a.r10.to/hkSuEP",
  },
  "zojirushi-eq-sb22-vs-eq-ah22:right": {
    name: "象印 EQ-AH22",
    purchaseUrl: "https://a.r10.to/h5VdYE",
  },
  "zojirushi-eq-aa22-vs-eq-sa22:left": {
    name: "象印 EQ-AA22",
    purchaseUrl: "https://a.r10.to/hFR6ju",
  },
  "zojirushi-eq-aa22-vs-eq-sa22:right": {
    name: "象印 EQ-SA22",
    purchaseUrl: "https://a.r10.to/h5DVzd",
  },
  "sony-wh-1000xm6-vs-wh-1000xm5:left": {
    name: "ソニー WH-1000XM6",
    purchaseUrl: "https://a.r10.to/hgj0yu",
  },
  "sony-wh-1000xm6-vs-wh-1000xm5:right": {
    name: "ソニー WH-1000XM5",
    purchaseUrl: "https://a.r10.to/hPygQu",
  },
} as const satisfies Record<string, ArticlePurchaseLink>;

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
  rakutenUrl: "https://item.rakuten.co.jp/rakuten24/405671/",
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
  rakutenUrl: "https://item.rakuten.co.jp/irodorich/22410151/",
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
  "panasonic-ne-ms4c-vs-ne-bs5c:left": {
    name: "パナソニック オーブンレンジ NE-MS4C",
    purchaseUrl: "https://item.rakuten.co.jp/akibamac/2133067121413/",
  },
  "panasonic-ne-ms4c-vs-ne-bs5c:right": {
    name: "パナソニック オーブンレンジ NE-BS5C",
    purchaseUrl: "https://item.rakuten.co.jp/akindo/ne-bs5c-w/",
  },
  "panasonic-es-pv6a-vs-es-pv3a:left": {
    name: "パナソニック ラムダッシュ パームイン ES-PV6A",
    purchaseUrl: "https://item.rakuten.co.jp/shopch-r/4000777578/",
  },
  "panasonic-es-pv6a-vs-es-pv3a:right": {
    name: "パナソニック ラムダッシュ パームイン ES-PV3A",
    purchaseUrl: "https://item.rakuten.co.jp/hows01/4549980711996/",
  },
  "panasonic-mc-jp860k-vs-mc-sb70km:left": {
    name: "パナソニック MC-JP860K-W",
    purchaseUrl: "https://item.rakuten.co.jp/world-free-store/4549980740361/",
  },
  "panasonic-mc-jp860k-vs-mc-sb70km:right": {
    name: "パナソニック MC-SB70KM-W",
    purchaseUrl: "https://item.rakuten.co.jp/panasonic-store/mc-sb70km-w/",
  },
  "panasonic-eh-nc80-vs-eh-nc50:left": {
    name: "パナソニック ナノケア EH-NC80",
    purchaseUrl: "https://item.rakuten.co.jp/biccamera/4549980767948/",
  },
  "panasonic-eh-nc80-vs-eh-nc50:right": {
    name: "パナソニック ナノケア EH-NC50",
    purchaseUrl: "https://item.rakuten.co.jp/biccamera/4549980767931/",
  },
  "panasonic-eh-na9m-vs-refa-beautech:left": {
    name: "パナソニック ナノケア EH-NA9M-H",
    purchaseUrl: "https://item.rakuten.co.jp/panasonic-store/eh-na9m-h/",
  },
  "panasonic-eh-na9m-vs-refa-beautech:right": {
    name: "ReFa BEAUTECH DRYER",
    purchaseUrl: "https://item.rakuten.co.jp/mtgec-beauty/2009320101/",
  },
  "panasonic-eh-na0k-vs-eh-ne9n:left": {
    name: "パナソニック ナノケア EH-NA0K",
    purchaseUrl: "https://item.rakuten.co.jp/biccamera/4549980975022/",
  },
  "panasonic-eh-na0k-vs-eh-ne9n:right": {
    name: "パナソニック EH-NE9N",
    purchaseUrl: "https://item.rakuten.co.jp/emedama/4549980973998/",
  },
  "recolte-automatic-cooker-vs-panasonic-nf-pc400:left": {
    name: "レコルト 自動調理ポット RSY-2",
    purchaseUrl: "https://item.rakuten.co.jp/plywood/20149238/",
  },
  "recolte-automatic-cooker-vs-panasonic-nf-pc400:right": {
    name: "パナソニック NF-PC400",
    purchaseUrl: "https://item.rakuten.co.jp/yamada-denki/6612234017/",
  },
  "panasonic-es-wp9b-vs-es-wg0b:left": {
    name: "パナソニック スムースエピ ES-WP9B",
    purchaseUrl: "https://item.rakuten.co.jp/biccamera/4549980882580/",
  },
  "panasonic-es-wp9b-vs-es-wg0b:right": {
    name: "パナソニック スムースエピ ES-WG0B",
    purchaseUrl: "https://item.rakuten.co.jp/biccamera/4549980872321/",
  },
  "makita-cl107-vs-cl286:left": {
    name: "マキタ CL107FDSHW",
    purchaseUrl: "https://item.rakuten.co.jp/biccamera/0088381346009/",
  },
  "makita-cl107-vs-cl286:right": {
    name: "マキタ CL286FD",
    purchaseUrl: "https://item.rakuten.co.jp/biccamera/0088381781572/",
  },
  "anker-soundcore-liberty-4-nc-vs-sony-wf-c710n:left": {
    name: "Soundcore Liberty 4 NC",
    purchaseUrl: "https://a.r10.to/hF7iGR",
  },
  "anker-soundcore-liberty-4-nc-vs-sony-wf-c710n:right": {
    name: "ソニー WF-C710N",
    purchaseUrl: "https://a.r10.to/hgcZzy",
  },
  "logicool-mx-master-3s-vs-m650:left": {
    name: "Logicool MX Master 3S",
    purchaseUrl:
      "https://hb.afl.rakuten.co.jp/ichiba/56ec17c0.0a9efc51.56ec17c1.98a500d4/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Flogicool%2Fmx2300cr%2F&link_type=picttext",
  },
  "logicool-mx-master-3s-vs-m650:right": {
    name: "Logicool Signature M650",
    purchaseUrl:
      "https://hb.afl.rakuten.co.jp/ichiba/56ec17c0.0a9efc51.56ec17c1.98a500d4/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Flogicool%2Fm650mgr%2F&link_type=picttext",
  },
  "logicool-k650-vs-k580:left": {
    name: "Logicool K650 Signature Wireless Keyboard",
    purchaseUrl:
      "https://hb.afl.rakuten.co.jp/ichiba/56ec17c0.0a9efc51.56ec17c1.98a500d4/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Flogicool%2Fk650gr%2F&link_type=picttext",
  },
  "logicool-k650-vs-k580:right": {
    name: "Logicool K580",
    purchaseUrl:
      "https://hb.afl.rakuten.co.jp/ichiba/56ec17c0.0a9efc51.56ec17c1.98a500d4/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Flogicool%2Fk580gr%2F&link_type=picttext",
  },
  "logicool-lift-vs-m550:left": {
    name: "Logicool LIFT Vertical Ergonomic Mouse",
    purchaseUrl:
      "https://hb.afl.rakuten.co.jp/ichiba/56ec17c0.0a9efc51.56ec17c1.98a500d4/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Flogicool%2Fm800gr%2F&link_type=picttext",
  },
  "logicool-lift-vs-m550:right": {
    name: "Logicool Signature M550",
    purchaseUrl:
      "https://hb.afl.rakuten.co.jp/ichiba/56ec17c0.0a9efc51.56ec17c1.98a500d4/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Flogicool%2Fm550mgr%2F&link_type=picttext",
  },
  "logicool-zone-vibe-100-vs-zone-300:left": {
    name: "Logicool Zone Vibe 100 Wireless (Zonev100GR)",
    purchaseUrl: "https://item.rakuten.co.jp/logicool/zonev100gr/",
  },
  "logicool-zone-vibe-100-vs-zone-300:right": {
    name: "Logicool Zone 300 Wireless (Zone300MBK)",
    purchaseUrl: "https://item.rakuten.co.jp/logicool/zone300mbk/",
  },
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
    purchaseUrl:
      "https://hb.afl.rakuten.co.jp/ichiba/56e37453.8885bd8a.56e37454.e8853422/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fbabybjorn%2Fbaby-carrier-harmony%2F&link_type=text",
  },
  "babybjorn:right": {
    name: "ベビービョルン MINI",
    purchaseUrl:
      "https://hb.afl.rakuten.co.jp/ichiba/56e37453.8885bd8a.56e37454.e8853422/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fbabybjorn%2Fbaby-carrier-mini-3d%2F&link_type=text",
  },
  "combi-the-s-plus-vs-premium:left": {
    name: "コンビ THE S plus",
    purchaseUrl:
      "https://hb.afl.rakuten.co.jp/ichiba/56e77b3a.3527f7d5.56e77b3b.a37819ca/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fcombi%2F4972990195010%2F&link_type=picttext",
  },
  "combi-the-s-plus-vs-premium:right": {
    name: "コンビ THE S premium",
    purchaseUrl:
      "https://hb.afl.rakuten.co.jp/ichiba/56e77b3a.3527f7d5.56e77b3b.a37819ca/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fcombi%2Fthes-premium-r129-va%2F&link_type=picttext",
  },
  "hitachi-bd-sx130k-vs-bd-stx130k:left": {
    name: "日立 BD-SX130K",
    purchaseUrl:
      "https://hb.afl.rakuten.co.jp/ichiba/56e827a8.6d705129.56e827a9.d5f820cf/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Frisaikurushopr-1%2Fe6602r-1%2F&link_type=picttext",
  },
  "hitachi-bd-sx130k-vs-bd-stx130k:right": {
    name: "日立 BD-STX130K",
    purchaseUrl:
      "https://hb.afl.rakuten.co.jp/ichiba/56e827c9.3ddf94e9.56e827ca.fba0ee75/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fden-ki-ya2%2Fbd-stx130kl-w%2F&link_type=picttext",
  },
  "kingjim-tepra-sr-r2500p-vs-sr-mk1:left": {
    name: "キングジム テプラ PRO SR-R2500P",
    purchaseUrl:
      "https://hb.afl.rakuten.co.jp/ichiba/56e8aeb8.699b0598.56e8aeb9.8561f4a2/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fyamada-denki%2F525788018%2F&link_type=picttext",
  },
  "kingjim-tepra-sr-r2500p-vs-sr-mk1:right": {
    name: "キングジム テプラ PRO SR-MK1",
    purchaseUrl:
      "https://hb.afl.rakuten.co.jp/ichiba/56e8b069.e9228dbc.56e8b06a.9ca23c34/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fonesmart%2F4971660776429%2F&link_type=picttext",
  },
  "merries-newborn:left": {
    name: "メリーズ 新生児用 ファーストプレミアム",
    purchaseUrl:
      "https://hb.afl.rakuten.co.jp/ichiba/56e93b53.ec7144bb.56e93b54.78dff077/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fnetbaby%2F404201%2F&link_type=picttext",
  },
  "merries-newborn:right": {
    name: "メリーズ 新生児用 ずっと肌さらエアスルー",
    purchaseUrl:
      "https://hb.afl.rakuten.co.jp/ichiba/56e93b96.676553d5.56e93b97.c08dff4b/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fjandcbaby%2Fkao-tnb96%2F&link_type=picttext",
  },
  "merries-pants:left": {
    name: "メリーズ パンツタイプ ファーストプレミアム",
    purchaseUrl:
      "https://hb.afl.rakuten.co.jp/ichiba/56e93b53.ec7144bb.56e93b54.78dff077/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fnetbaby%2F404698%2F&link_type=picttext",
  },
  "merries-pants:right": {
    name: "メリーズ パンツタイプ ずっと肌さらエアスルー",
    purchaseUrl:
      "https://hb.afl.rakuten.co.jp/ichiba/56ea557f.e01de687.56ea5580.6eb3aa89/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fjandcshop%2Fahkaopm58%2F&link_type=picttext",
  },
  "moony-m:left": {
    name: "ムーニー 低刺激であんしん",
    purchaseUrl:
      "https://hb.afl.rakuten.co.jp/ichiba/56eb110b.d12f383c.56eb110c.df99efd3/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Frakuten24%2F4903111241439%2F&link_type=picttext",
  },
  "moony-m:right": {
    name: "ムーニー マシュマロ肌ごこちモレ安心",
    purchaseUrl:
      "https://hb.afl.rakuten.co.jp/ichiba/56eb1351.8b5bcbf5.56eb1352.65c70c66/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Funicharm%2F101302%2F&link_type=picttext",
  },
  "pampers-newborn:left": {
    name: "パンパース 新生児用 肌へのいちばん",
    purchaseUrl: "https://a.r10.to/hPtZZE",
  },
  "pampers-newborn:right": {
    name: "パンパース 新生児用 さらさらケア",
    purchaseUrl: "https://a.r10.to/h5Jh9V",
  },
  "panasonic-ne-bs9c-vs-ne-ubs10c:left": {
    name: "パナソニック ビストロ NE-BS9C",
    purchaseUrl: "https://item.rakuten.co.jp/outl/rc_itn265br5z9x_lta0/",
  },
  "panasonic-ne-bs9c-vs-ne-ubs10c:right": {
    name: "パナソニック ビストロ NE-UBS10C",
    purchaseUrl: "https://item.rakuten.co.jp/e-cutestyle/p000000870297/",
  },
  "panasonic-baby-monitor-kx-hc705:card": {
    name: "パナソニック ベビーモニター KX-HC705",
    purchaseUrl:
      "https://hb.afl.rakuten.co.jp/hgc/56e37453.8885bd8a.56e37454.e8853422/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fksdenki%2F4549980233351%2F&link_type=text",
  },
  "panasonic-eh-na9m-guide:card": {
    name: "パナソニック ナノケア EH-NA9M",
    purchaseUrl: "https://item.rakuten.co.jp/panasonic-store/eh-na9m-h/",
  },
  "panasonic-eh-na9m-vs-eh-na7m:left": {
    name: "パナソニック ナノケア EH-NA9M",
    purchaseUrl: "https://item.rakuten.co.jp/panasonic-store/eh-na9m-h/",
  },
  "panasonic-eh-na9m-vs-eh-na7m:right": {
    name: "パナソニック ナノケア EH-NA7M",
    purchaseUrl: "https://item.rakuten.co.jp/panasonic-store/eh-na7m-h/",
  },
  "panasonic-eh-ne7m-vs-eh-ne5m:left": {
    name: "パナソニック EH-NE7M",
    purchaseUrl: "https://item.rakuten.co.jp/panasonic-store/eh-ne7m-w/",
  },
  "panasonic-eh-ne7m-vs-eh-ne5m:right": {
    name: "パナソニック EH-NE5M",
    purchaseUrl: "https://item.rakuten.co.jp/panasonic-store/eh-ne5m-w/",
  },
  "panasonic-mc-nx810km-vs-mc-nx700k:left": {
    name: "パナソニック MC-NX810KM",
    purchaseUrl: "https://item.rakuten.co.jp/akindo/mc-nx810km-w/",
  },
  "panasonic-mc-nx810km-vs-mc-nx700k:right": {
    name: "パナソニック MC-NX700K",
    purchaseUrl: "https://item.rakuten.co.jp/akindo/mc-nx700k-w/",
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
    purchaseUrl: "https://item.rakuten.co.jp/panasonic-store/mc-sb55k-a/",
  },
  "panasonic-mc-sb55k-vs-mc-sb35k:right": {
    name: "パナソニック MC-SB35K",
    purchaseUrl: "https://item.rakuten.co.jp/panasonic-store/mc-sb35k-c/",
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
    purchaseUrl: "https://item.rakuten.co.jp/premoa/4902508024501/",
  },
  "pigeon-bottle-160-240:right": {
    name: "母乳実感 240ml",
    purchaseUrl: "https://item.rakuten.co.jp/premoa/4902508024518/",
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
    purchaseUrl: "https://item.rakuten.co.jp/biccamera/4974019761503/",
  },
  "sharp-kc-s50-vs-fu-s50:right": {
    name: "シャープ FU-S50",
    purchaseUrl: "https://item.rakuten.co.jp/a-price/2980000205750/",
  },
  "sharp-kc-s50-vs-panasonic-f-vxw55:left": {
    name: "シャープ KC-S50",
    purchaseUrl: "https://item.rakuten.co.jp/biccamera/4974019761503/",
  },
  "sharp-kc-s50-vs-panasonic-f-vxw55:right": {
    name: "パナソニック F-VXW55",
    purchaseUrl: "https://item.rakuten.co.jp/panasonic-store/f-vxw55-w/",
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
    purchaseUrl: "https://a.r10.to/hgJSgN",
  },
  "tefal-ko5901jp-vs-ko8601j0:right": {
    name: "ティファール KO8601J0",
    purchaseUrl: "https://a.r10.to/hPYDq2",
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
    purchaseUrl: "https://item.rakuten.co.jp/rakuten24/405671/",
  },
  "thermos-tiger-bottle:right": {
    name: "タイガー MTA-J050",
    purchaseUrl: "https://item.rakuten.co.jp/irodorich/22410151/",
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
    purchaseUrl: "https://a.r10.to/hFYUbM",
  },
  "tiger-pct-a120-vs-pct-a150:right": {
    name: "タイガー PCT-A150",
    purchaseUrl: "https://a.r10.to/h57s1i",
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
    purchaseUrl: "https://a.r10.to/h5gRSW",
  },
  "yamazaki-ofuda-stand-rin-vs-single:right": {
    name: "山崎実業 神札スタンド リン シングル（6144）",
    purchaseUrl: "https://a.r10.to/hPCi3h",
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
    purchaseUrl: "https://a.r10.to/hg1Lco",
  },
  "zojirushi-ec-kv50-vs-ec-ma60:right": {
    name: "象印 EC-MA60",
    purchaseUrl: "https://a.r10.to/h5tron",
  },
  "yamajitsu-film-holder-242286-vs-242287:left": {
    name: "山崎実業 フィルムフックまな板ホルダー タワー 242286",
    purchaseUrl: "https://item.rakuten.co.jp/roomy/ymz23mar17h04/",
  },
  "yamajitsu-film-holder-242286-vs-242287:right": {
    name: "山崎実業 フィルムフック鍋蓋ホルダー タワー 242287",
    purchaseUrl: "https://item.rakuten.co.jp/roomy/ymz23feb07h02/",
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
    purchaseUrl:
      "https://hb.afl.rakuten.co.jp/ichiba/56efb198.78b56db2.56efb199.4a5fe96d/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fa-price%2F4548736162600%2F&link_type=picttext",
  },
  "sony-wh-1000xm6-vs-wh-1000xm5:right": {
    name: "ソニー WH-1000XM5",
    purchaseUrl:
      "https://hb.afl.rakuten.co.jp/ichiba/56efb198.78b56db2.56efb199.4a5fe96d/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fa-price%2F4548736132566%2F&link_type=picttext",
  },
  "logicool-mx-keys-s-vs-mx-keys-mini:left": {
    name: "Logicool MX Keys S",
    purchaseUrl:
      "https://hb.afl.rakuten.co.jp/ichiba/56ec17c0.0a9efc51.56ec17c1.98a500d4/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Flogicool%2Fkx800sgr%2F&link_type=picttext",
  },
  "logicool-mx-keys-s-vs-mx-keys-mini:right": {
    name: "Logicool MX Keys Mini",
    purchaseUrl:
      "https://hb.afl.rakuten.co.jp/ichiba/56ec17c0.0a9efc51.56ec17c1.98a500d4/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Flogicool%2Fkx700gr%2F&link_type=picttext",
  },
  "logicool-mx-keys-s-for-mac-vs-k780:left": {
    name: "Logicool MX Keys S for Mac",
    purchaseUrl:
      "https://hb.afl.rakuten.co.jp/ichiba/56ec17c0.0a9efc51.56ec17c1.98a500d4/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Flogicool%2Fkx800smsg%2F&link_type=picttext",
  },
  "logicool-mx-keys-s-for-mac-vs-k780:right": {
    name: "Logicool K780",
    purchaseUrl:
      "https://hb.afl.rakuten.co.jp/ichiba/56ec17c0.0a9efc51.56ec17c1.98a500d4/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Flogicool%2Fk780%2F&link_type=picttext",
  },
  "panasonic-eh-na0j-vs-eh-na0g:left": {
    name: "パナソニック ナノケア EH-NA0J",
    purchaseUrl: "https://item.rakuten.co.jp/jtus/652954/",
  },
  "panasonic-eh-na0j-vs-eh-na0g:right": {
    name: "パナソニック ナノケア EH-NA0G",
    purchaseUrl: "https://item.rakuten.co.jp/ekosuta/eh20819/",
  },
  "panasonic-ne-bs6e-vs-ne-bs5e:left": {
    name: "パナソニック NE-BS6E",
    purchaseUrl: "https://item.rakuten.co.jp/panasonic-store/ne-bs6e-k/",
  },
  "panasonic-ne-bs6e-vs-ne-bs5e:right": {
    name: "パナソニック NE-BS5E",
    purchaseUrl: "https://item.rakuten.co.jp/panasonic-store/ne-bs5e-k/",
  },
  "yamazaki-refrigerator-rack-240057-vs-240059:left": {
    name: "山崎実業 冷蔵庫中棚下高さ調節ラック タワー S",
    purchaseUrl: "https://item.rakuten.co.jp/butsueido/r240057/",
  },
  "yamazaki-refrigerator-rack-240057-vs-240059:right": {
    name: "山崎実業 冷蔵庫中棚下高さ調節ラック タワー L",
    purchaseUrl: "https://item.rakuten.co.jp/butsueido/r240059/",
  },
} as const satisfies Record<string, ArticlePurchaseLink>;

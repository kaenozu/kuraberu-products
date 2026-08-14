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

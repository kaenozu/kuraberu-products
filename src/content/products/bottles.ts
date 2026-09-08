import type { Product } from "./types";

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

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

export interface ArticlePurchaseLink {
  /** 表示名（例: ムーニー 低刺激であんしん） */
  name: string;
  /** 購入（アフィリエイト）URL */
  purchaseUrl: string;
}

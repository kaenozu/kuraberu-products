import {
  ARTICLE_LAYOUT,
  contentTypeFor,
} from "../../config/article-layout.mjs";

// 記事カード（トップページ・比較記事一覧）に表示するコンテンツタイプの
// ラベル文言。コンテンツタイプ（guide / comparison）と表示ラベル
// （商品ガイド / 比較記事）は config/article-layout.mjs の contentTypes が
// 唯一の情報源で、実ビルドテスト（tests/top-page.test.ts）がカードの
// data-content-type 属性と突き合わせる。
export function contentTypeLabel(productCount: number): string {
  return ARTICLE_LAYOUT.contentTypes[contentTypeFor(productCount)].label;
}

# レンダリング済み HTML ゲートの許可リスト

`scripts/check-rendered-html.mjs` の品質ゲートを全生成記事ページへ拡大
（Issue #343）した結果、旧テンプレート期の手書き比較記事に既存違反が見つかった。
ゲート自体は緩和せず、以下の表に記載された例外のみ機械的に除外する
（スクリプトがこの表をパースして適用する。行を削除すれば即時にゲートへ復帰する）。

## 運用ルール

- 1 行 = 1 例外。`path`（dist 相対パス）× `rule`（`[required-section:<id>]` /
  `[template-token]` タグ）単位で照合し、それ以外の違反は従来どおり fail-closed。
- 新規違反・未記載のページは許可されない。行を追加するときは理由と解消条件を必ず書く。
- 欠落セクションの追加入れ替え（仕様表・FAQ・更新履歴の執筆）はコンテンツ更新タスクで
  解消し、解消後に該当行を削除する。

| path | rule | reason |
| ---- | ---- | ------ |

<!-- 2026-09-08 全件再監査中: 旧テンプレート期の例外行を一旦全除去し、CIで有効分を特定する。CIが赤の行は有効な例外として復活させる。進捗は #343 で管理。 -->

## 系統的な例外（コード側で変種対応済み・行データではない）

- **商用テンプレート（CommercialArticlePage）の `trust-line` ↔ `next-step` の相対順序**:
  公式ソース（officialSources）を持つ変種では TrustLine も NextStepBlock も
  ArticleComparisonV2 内部にレンダリングされ、内部順序は next-step → trust-line になる。
  一方ソースを持たない変種は TrustLine → 独立 NextStepBlock の順になる。
  このため commercialPage のこのペアに限り順序照合を行わない
  （`validateArticleSectionOrder` 内のコメント参照）。
  両セクションの「存在」は required ゲートが fail-closed で保証する。

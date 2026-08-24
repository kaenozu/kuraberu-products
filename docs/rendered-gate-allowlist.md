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

| path                                                         | rule                              | reason                                                                                                                                                          |
| ------------------------------------------------------------ | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `articles/babybjorn/index.html`                              | `required-section:specs`          | 旧手書き比較記事。詳細仕様（details#specs）セクション未実装。公式仕様の確認と執筆が必要なため安易な空セクション追加はしない（コンテンツ更新タスクで解消予定）。 |
| `articles/babybjorn-bouncer/index.html`                      | `required-section:specs`          | 旧手書き比較記事。詳細仕様セクション未実装（上記と同じ解消条件）。                                                                                              |
| `articles/babybjorn-cradle/index.html`                       | `required-section:specs`          | 旧手書き比較記事。詳細仕様セクション未実装（上記と同じ解消条件）。                                                                                              |
| `articles/babybjorn-onekai/index.html`                       | `required-section:specs`          | 旧手書き比較記事。詳細仕様セクション未実装（上記と同じ解消条件）。                                                                                              |
| `articles/babybjorn-potty/index.html`                        | `required-section:specs`          | 旧手書き比較記事。詳細仕様セクション未実装（上記と同じ解消条件）。                                                                                              |
| `articles/moony-m/index.html`                                | `required-section:specs`          | 旧手書き比較記事。詳細仕様セクション未実装（上記と同じ解消条件）。                                                                                              |
| `articles/shupot/index.html`                                 | `required-section:specs`          | 旧手書き比較記事。詳細仕様セクション未実装（上記と同じ解消条件）。                                                                                              |
| `articles/tiger-mta-j050-guide/index.html`                   | `required-section:specs`          | 旧形式の商品ガイド併設ページ。詳細仕様セクション未実装（上記と同じ解消条件）。                                                                                  |
| `articles/hitachi-bd-sx130k-vs-bd-stx130k/index.html`        | `required-section:faq`            | 旧手書き1行比較記事。FAQ セクション未実装。記事本文の再構成（v2 テンプレートへの統合）時に解消予定。                                                            |
| `articles/hitachi-bd-sx130k-vs-bd-stx130k/index.html`        | `required-section:purchase-cards` | 同ページに購入カード領域（div.purchase-cards）がない。CTA 自体は NextStepBlock 経由で存在するため表示面の問題はないが、構成統一は別タスク。                     |
| `articles/hitachi-bd-sx130k-vs-bd-stx130k/index.html`        | `required-section:change-log`     | 更新履歴（ol.change-log）未実装。初回公開のみの歴史のため。追筆時に解消。                                                                                       |
| `articles/panasonic-ne-fl1a-vs-ne-fl1c/index.html`           | `required-section:faq`            | 旧手書き1行比較記事。FAQ セクション未実装（hitachi と同じ解消条件）。                                                                                           |
| `articles/panasonic-ne-fl1a-vs-ne-fl1c/index.html`           | `required-section:purchase-cards` | 購入カード領域なし。CTA は NextStepBlock 経由で存在。構成統一是非を含め別タスクで判断。                                                                         |
| `articles/panasonic-ne-fl1a-vs-ne-fl1c/index.html`           | `required-section:change-log`     | 更新履歴未実装。初回公開のみのため。追筆時に解消。                                                                                                              |
| `articles/panasonic-ne-fl1a-vs-ne-fl1c/index.html`           | `required-section:source-list`    | 情報源一覧（ul.source-list）の代わりに officialLinks 経由で出典リンクを描画している旧構成。テンプレート統合時に解消予定。                                       |
| `articles/panasonic-nt-t501-vs-nt-d700/index.html`           | `required-section:change-log`     | 更新履歴未実装。初回公開のみのため。追筆時に解消。                                                                                                              |
| `articles/yamajitsu-film-holder-242286-vs-242287/index.html` | `required-section:jump-nav`       | ページ内ジャンプ（nav.jump-nav）未実装の旧手書き構成。短編のため UX 影響は小さいが、テンプレート統合時に解消予定。                                              |

## 系統的な例外（コード側で変種対応済み・行データではない）

- **商用テンプレート（CommercialArticlePage）の `trust-line` ↔ `next-step` の相対順序**:
  公式ソース（officialSources）を持つ変種では TrustLine も NextStepBlock も
  ArticleComparisonV2 内部にレンダリングされ、内部順序は next-step → trust-line になる。
  一方ソースを持たない変種は TrustLine → 独立 NextStepBlock の順になる。
  このため commercialPage のこのペアに限り順序照合を行わない
  （`validateArticleSectionOrder` 内のコメント参照）。
  両セクションの「存在」は required ゲートが fail-closed で保証する。

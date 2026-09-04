# 2026-09-01 全ソース静的レビュー記録

## 対象

- base: `main` @ `7be5705` (Merge PR #529)
- 範囲: `src/`, `tests/`, `scripts/`, `functions/`, `config/` 計 371 ファイル / 約 39,655 行
- 方法: code-review スキルの Standards 軸 + Fowler smell ベースライン（Spec 軸は固定点となる Issue/PRD がないため省略）

## 結論

- **修正を要する Standards 違反: 0 件**
- 前回提示した「改善候補」5 件は再検証の結果、すべて撤回または範囲外と判断。
- 本ドキュメントは誤検知の再発防止（セルフチェック手順）を残すことを目的とする。

## 再評価（撤回した5件）

| #   | 当初指摘                                                                                | 再検証結果                                                                                                                                  | 判定                                                     |
| --- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| 1   | `scripts/check-purchase-link-consistency.mjs` の正規表現パースが壊れやすい → テスト補強 | `tests/check-purchase-link-consistency.test.ts` は 684 行・48 ケースで抽出関数の各経路（prop 形式・順序・欠落・商用テンプレート）を網羅済み | **撤回**。テスト追加不要                                 |
| 2   | `wrangler.jsonc` の `ratelimits.namespace_id` の一意性                                  | 既にコメントで「アカウント内で一意な正の整数文字列であれば任意」と明記。値は Cloudflare アカウント側の情報でありソースだけでは検証不能      | **範囲外**。別 Issue/PR ではなくデプロイ時の検証に委ねる |
| 3   | `src/lib/external-embeds.ts` の TikTok / Pinterest が Speculative Generality            | `grep` で `ExternalEmbed.astro` 内の実使用を確認（type union L96, 240-266, 717 / ランタイム L96, 266）                                      | **誤判定を撤回**。Speculative ではない                   |
| 4   | `src/lib/memo-app.ts` の localStorage サイレント処理                                    | `try/catch` で `status.textContent` によるユーザー向け文言表示が実装済み（L200付近）                                                        | **撤回**。追加の JSDoc は任意                            |
| 5   | Fowler smell の残り                                                                     | 該当なし                                                                                                                                    | **撤回**                                                 |

## 肯定的に評価した設計

- `config/article-layout.mjs` がセクション順序・CTA 枚数・関連選定ルールの唯一の情報源（Single Source of Truth）
- `src/lib/products.ts` の `articlePurchaseLinks` レジストリ + `scripts/check-purchase-link-consistency.mjs` の fail-closed ゲート
- `functions/api/shared.ts` の `readBodyTextWithLimit`（チャンク単位サイズ制限）、`isSameSiteOrigin`（Origin 完全一致）、`clientIp`（XFF 右端採用）
- `src/lib/rakuten.ts` の三層検証（`isAllowedRakutenUrl` / `isRakutenProductDetailUrl` / `isAffiliateRakutenUrl`）
- `tsconfig.json: astro/tsconfigs/strict` + `as const satisfies` 活用、`@ts-expect-error` / `@ts-ignore` 実質ゼロ
- `vitest.config.ts` の閾値（statements 78 / branches 70 / functions 80 / lines 80）を「少し下」に置く設計
- `CONTRIBUTING.md` / `AGENTS.md` による二段ゲート（`pnpm verify` + `pnpm test:e2e`）の明文化

## 検証（本レビュー内で実行）

- `PUBLIC_BUILD_SHA=$(git rev-parse HEAD) pnpm verify:build` → 65/65 passed（88 articles, external link syntax 472 URLs, factual integrity 94 articles）
- `pnpm test` → 822 passed（58 files）
- `src/lib/products.ts` 内の `search.rakuten.co.jp` URLs → **0 件**（Issue #436 の検索 URL 置換は現状達成）
- `src/content/articles` 内の `purchaseLinkStatus` 集計 → verified 30 / unverified 35 / direct 9（計 74 ids）
- `pnpm verify:build` で生成された `dist/` の購入リンク状態は上記と一致（88 pages）

## セルフチェック手順（再発防止）

過剰な改善提案を抑えるため、レビュー報告前に次を必ず実施する：

1. 指摘が「既存テストでカバーされていないこと」を `grep` / `tests/*.test.ts` の行数・ケース数で確認する
2. 指摘が「ソースだけで検証可能」かを `wrangler.jsonc` のように外部依存（Cloudflare アカウント等）を含まないか確認する
3. `grep -rn` で Speculative Generality 候補の実使用（type / runtime / Astro template）を3箇所確認する
4. AGENTS.md の「無関係な目的を混在させない」「大規模 refactor を混在させない」に照らし、1 PR にまとめるべきか別 Issue 化すべきかを判断する
5. 修正ゼロで終わる場合でも、PR を無理に作らず「修正不要の記録」として本ドキュメントのようなレビュー記録を残す

## 関連

- Issue #436: [P1][affiliate] 楽天検索結果リンクを確認済みの商品詳細ページへ置き換える（OPEN 継続）
- 本レビューは Issue #436 の再開条件整理（別コメント）と併せて実施

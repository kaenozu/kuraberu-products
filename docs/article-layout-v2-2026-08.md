# Article Layout v2 — 標準記事構成（2026-08-12）

> **注意: このレイアウトは v3 に置き換えられました（`docs/article-layout-v3-2026-08.md`）。**
> v3 では購入カードは「末尾 1 セット」が原則で、途中 CTA（after-decision）は
> 長文記事（`midArticleCta: true`）だけに許容されましたが、宣言記事がゼロのまま
> **2026-08-18 に経路ごと削除**されました。本ファイルは v2 時代の記録です。

全比較記事に適用する標準骨格。UI/UX 仕様書（`docs/ui-ux-spec-2026-08.md`）の S-1〜S-3 と、
Issue #52（比較/CTA UX改善）の受入判断（2026-08-12・chatgpt.com 相談）を統合したもの。

## 方針

- **冒頭には結論 UI を 1 つだけ置く**（HeroComparison を標準化するのではなく「1つだけ」が標準）
- **CTA は「判断後 + 記事末尾」の 2 タイミングに限定**
- **PurchaseCard が全記事の標準購入カード**（`src/components/PurchaseCard.astro`）
  - 商品画像 / 商品名 / 「こんな人向け」/ 「楽天市場で商品を見る」CTA / 価格・在庫の注意書き
  - 価格をカード内で主張せず、楽天市場の商品ページへ委譲
  - CTA 表現は「楽天市場で商品を見る」に統一（AffiliateButton の subLabel も同文言）
- **共通仕様より差分を先に出す**
- **長い全仕様・履歴・情報源は後方へ送る**（`<details>` 折りたたみ）

## 標準骨格（全記事デフォルト）

1. タイトル + 短い導入
2. **単一の 30秒比較 / 結論 UI**
3. **主要差分**（共通仕様より先）
4. **PurchaseCard × 2（判断後）** — placement="after-decision"
5. 詳細比較（差分が少ない記事はそのまま表示 / 全仕様が長い記事は `<details>` 折りたたみ）
6. 公式情報・根拠
7. FAQ
8. SNS 等の任意補足（比較根拠から明確に分離した参考情報）
9. **最終 PurchaseCard × 2（記事末尾）** — placement="article-end"
10. 更新履歴・情報源・免責

## PurchaseCard 仕様

| prop        | 必須 | 内容                                              |
| ----------- | ---- | ------------------------------------------------- |
| `name`      | ✓    | 商品名（例: サーモス JNL-S500）                   |
| `audience`  | ✓    | 「○○を優先する人向け」の 1 文                     |
| `href`      | ✓    | 楽天市場の商品 URL（アフィリエイト）              |
| `imagePath` | -    | 商品画像パス                                      |
| `productId` | -    | アフィリエイト URL 検証用 ID                      |
| `placement` | -    | "after-decision"（判断後）/ "article-end"（末尾） |
| `note`      | -    | 価格・在庫の注意書き                              |

- CTA ラベルは「楽天市場で商品を見る」固定
- 各配置には**紹介する商品 1 つにつき 1 枚**のカードを置く（比較記事 = 各配置 2 枚、単一商品記事 = 各配置 1 枚）
- **期待 CTA 総数は記事ごとに機械的に導出される**:
  - 記事メタデータ（`src/content/articles.ts`）の `productCount` が商品数（比較記事 = 2、単一商品記事 = 1）
  - 記事ページは `<meta name="article:product-count" content="N">` を出力し、品質ゲートがこれを読む
  - 期待総数 = `config/article-layout.mjs` の `ctaSets`（各配置の `cardsPerProduct`）× `productCount`
  - 比較記事 = 4 枚、単一商品記事 = 2 枚
- **CTA の枚数・配置の機械的契約は `config/article-layout.mjs` が唯一の定義**。品質ゲート（`scripts/check-rendered-html.mjs`）は config と記事の `productCount` から期待枚数を記事ごとに導出するため、レイアウト変更時は config だけを直す
- 単一商品記事を新規作成するときは `productCount: 1` を宣言し、各配置にカードを 1 枚だけ置く（2 枚置くとゲートが検出する）
- 現行の公開記事はすべて 2 商品比較（`productCount: 2`）で「判断後 × 2 + 記事末尾 × 2」を実装済み

## 水筒記事スコープのままの UI（評価後に統合）

以下の実験 UI は現時点では水筒記事固有とし、全記事へ展開しない。

- HeroComparison（30秒比較の A/B カード）
- VisualKeyDifferences（差分バー/強調表示）
- DecisionGuide（条件別の結論ガイド）
- 上記 3 つの連続配置（結論 UI の多重化リスクがあるため）
- 水筒記事固有の common-specs 帯
- SNS 埋め込みの具体構成（4件・2列・autoload/compact）
- 数値比較主体のビジュアル表現

将来は ThirtySecondComparison を強化し、これらの有効部分を吸収する方向で評価する。

## 記事ごとの判断ルール

- **差分が 5〜6 項目以下** → 詳細比較を折りたたまずそのまま表示
- **全仕様が長い**（7 項目以上 or 数値表が大きい）→ `<details>` 折りたたみ
- **SNS** → 参考情報として残すが、件数・レイアウト・掲載可否は記事ごとに判断

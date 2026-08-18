# Article Layout v3 — 標準記事構成（2026-08-17）

v2（`docs/article-layout-v2-2026-08.md`）の後継。サイト監査（2026-08-17）の P0-3・P1-4 指摘
（「同じ商品カードが記事内で 2 回出る」「新旧テンプレート混在」）への回答として、
購入カードの配置を一本化する。

## v2 からの変更点

| 項目                       | v2                               | v3                                       |
| -------------------------- | -------------------------------- | ---------------------------------------- |
| 購入カードの配置           | **判断後 + 記事末尾**の 2 セット | **末尾 1 セットが原則**                  |
| 途中 CTA（after-decision） | 全記事に配置                     | ~~長文記事のみ~~ → **2026-08-18 に削除** |
| 期待 CTA 総数              | 比較記事 4 / 単一 2              | 比較記事 2 / 単一 1                      |
| `defaultPlacement`         | `after-decision`                 | `article-end`                            |

## 方針

- **購入カードは記事末尾に 1 セットだけ置く**（紹介する商品 1 つにつき 1 枚）。
  冒頭〜詳細の途中に広告カードを挟まず、本文を読んでから最後に購入先へ誘導する。
- **途中 CTA（`placement="after-decision"`）は廃止**。v3 短縮後、`midArticleCta: true` を
  宣言する記事がゼロのまま放置されていた死に経路だったため、2026-08-18 に
  config・ゲート・メタデータ・テストごと削除した。今後も復活させない（必要なら
  NextStepBlock の拡張で対応する）。
- 新旧テンプレートの混在を解消し、全記事を同じ骨格へ統一する。

## 標準骨格（全記事デフォルト）

1. タイトル + 1 行結論（リード）
2. **結局どっち？**（HeroComparison + DecisionGuide を統合した 1 ブロック。
   A/B カード = 画像 + 型番 + 「こんな人に」1 行 + ✓おすすめポイント。
   2026-08-18 更新で 30秒比較と条件別結論を 1 つに統合）
3. **主な違い（3〜5 個）** — VisualKeyDifferences。記事の主役として結論直後に置く
4. **「次にすること」1 ブロック**（NextStepBlock: A/B 購入 + 30秒診断）
5. 詳細比較（全仕様が長い記事は `<details>` 折りたたみ）
6. 公式情報・根拠
7. FAQ
8. SNS 等の任意補足（比較根拠から明確に分離した参考情報）
9. **最終 PurchaseCard × 商品数（記事末尾）** — placement="article-end"
10. 更新履歴・情報源・免責

> 2026-08-18: サイト監査（「結局どっち？を最速で解決する」方針）への回答として、
> 冒頭の「30秒比較（A/B カード）」と「どっち向き？（おすすめポイント）」を
> **1 つの「結局どっち？」ブロックへ統合**した。同時に、比較テンプレート直後の
> 「まとめ：…」段落（結論の重複）を全 13 記事から削除し、ページ内ジャンプの
> ラベルを「結局どっち？」へ統一した。`#decision-guide` アンカーは統合ブロックが
> 引き継ぐ（`HeroComparison` の `anchorId` / `heading` / `leftPoints` / `rightPoints`）。

## 機械的契約（config / ゲート）

- **唯一の情報源は `config/article-layout.mjs`**:
  - `ctaSets = [{ placement: "article-end", cardsPerProduct: 1 }, { placement: "next-step", cardsPerProduct: 1, comparisonOnly: true }]` — 末尾セット（全記事）+ 次にすることブロック（比較記事のみ）
  - `defaultPlacement = "article-end"`
  - `placements = ["article-end", "next-step"]`（v2 の `after-decision` は 2026-08-18 に削除）
- **途中 CTA は存在しない**: 長文フラグ（`midArticleCta`）・`article:mid-cta` meta・
  `readArticleMidCta` ゲートはすべて削除済み。期待枚数は productCount だけで決まる。
- 期待枚数:
  - 比較記事: 末尾 2 + next-step 2 = 4
  - 単一商品記事: 末尾 1 = 1（next-step は比較記事のみ）
- レイアウト変更時は `config/article-layout.mjs` だけを直す（ゲートは自動追随する）。

## 記事冒頭の信頼表示（TrustLine）

記事冒頭の「商品情報確認日・購入リンク最終確認日・広告表示」は、**1 行**に圧縮する:

```
✓ 公式確認済み（2026-07-31）・広告を含みます
```

- 実装は共通コンポーネント `src/components/TrustLine.astro`。
  `checkedAt`（= `productInfoCheckedAt`）を受け取り、未宣言なら日付を省略する。
- 呼び出し元は 2 系統（ハンドライトの比較記事 `ArticleComparisonV2`、
  商用記事 `CommercialArticlePage`）。旧形式（「公式情報確認済み · 日付」のヒーロー行・
  「広告表示：…」の notice）は廃止。
- 商用記事（`createCommercialArticle`）は確認日未宣言の場合 `2026-08-17`（初稿公開日）を
  既定値とする。
- 品質ゲート（`validateArticleTrustLine`）が、全記事で信頼行がちょうど 1 つ・
  `YYYY-MM-DD` 付きであることと、旧形式の残存を fail-closed で検出する。

## 結論直後の「次にすること」1ブロック（NextStepBlock）

比較記事の結論直後（「どっち向き？」の判定直後）に、**A/B 購入 + 30秒診断を
1 つのブロック**として置く。それまで別々の箱だった「購入CTA」と「診断誘導」を
1 つのコンテナへ統合し、記事のビジュアルリズムを整える:

```
次にすること
迷ったら、ここから決める

[ Aを見る（販売ページ） ]  [ Bを見る（販売ページ） ]
────────────────────────────
まだ迷っている？  30秒で診断する →
```

- 実装は共通コンポーネント `src/components/NextStepBlock.astro`。
  `left` / `right` に商品名と購入（アフィリエイト）URL を渡す。
  購入 URL は `toAffiliateRakutenUrl` で正規化され、`search.rakuten.co.jp` は
  `hb.afl` のリダイレクトへ変換される。ボタンは `data-cta-event="purchase"` +
  `data-placement="next-step"` を持ち、クリック計測に参加する。
- 購入ボタンの枚数・配置は `config/article-layout.mjs` の `ctaSets`
  （`next-step` set、比較記事のみ `comparisonOnly`）が唯一の定義で、
  末尾の購入カード（`article-end`）とは別カウント。
- **診断カテゴリが存在する記事** は該当カテゴリへ直接つなぐ:
  - 哺乳瓶記事 → `/tools/product-finder/baby-bottle/`（`pigeon-*`）
  - おむつ記事 → `/tools/product-finder/diaper/`（`moony-m`・`merries-*`・`pampers-newborn`・`shupot`）
  - 水筒記事 → `/tools/product-finder/water-bottle/`（`thermos-tiger-bottle`）
  - ドライヤー記事 → `/tools/product-finder/hair-dryer/`（`panasonic-eh-na9m-vs-eh-na7m`）
  - 炊飯器記事 → `/tools/product-finder/rice-cooker/`（`tiger-jpv-l100-vs-jpv-m100`）
  - それ以外（診断カテゴリ未整備の記事）→ 診断一覧へ
- 配置はテンプレートごとに共通化している:
  - `ArticleComparisonV2`（比較記事の標準テンプレート。2026-08-18 に旧ヒーロー記事
    `ComparisonHero` を統合し、比較記事は全てこの 1 系統になった）が
    「結局どっち？」の直後に `NextStepBlock` を描画する。`left.purchaseHref` /
    `right.purchaseHref`（+ 任意の `productId`）と `diagnosisHref` prop で上書きできる。
  - 商用記事（`CommercialArticlePage`）は判定セクション直後に置く。
  - **商品ガイド**（`article:content-type="guide"`）は対象外（現行ガイドは `ArticleComparisonV2` を使わない）。
- 品質ゲート（`validateArticleNextStep`）が、比較記事ではブロックがちょうど 1 つ・
  購入ボタンが 2 つ・診断リンクが `/tools/product-finder/` を指す・`#specs` より前に
  置かれることを、ガイドではブロックが描画されないことを、旧形式の独立診断 CTA
  （`diagnosis-cta`）が残っていないことを fail-closed で検証する。
- **購入URLの単一情報源**（`src/lib/products.ts` の `articlePurchaseLinks`）:
  全購入（アフィリエイト）URL はレジストリのみに存在する。記事ページのブロック
  （`left/right.purchaseHref` / `NextStepBlock` の `left/right.href`）・記事末尾の
  `PurchaseCard`・本文中の購入リンクは、すべて
  `articlePurchaseLinks['<記事スラグ>:<left|right|card>'].purchaseUrl` を参照する。
  レジストリのキーは「記事スラグ + 左右」単位で、同じ商品でも記事ごとに
  異なるリンクを保持できる（例: pigeon PPSU 240ml は記事ごとに別リンク）。
  商用記事（`CommercialArticlePage`）はビルド時に Rakuten API で URL を解決する
  ため対象外。
- **購入リンクの整合ゲート**（`scripts/check-purchase-link-consistency.mjs`）:
  (1) 購入コンテキストに URL 直書きが無いこと、(2) 参照キーがレジストリに存在
  すること、(3) ブロックと記事末尾カードが**同一キーを同一順序**で参照すること、
  を fail-closed で検証する。片方だけ差し替えて他方が古いキーのままになる
  「ドリフト」をビルド時に検出する。レンダリング結果ではなく式を比較する理由は、
  `productId` を持つ記事では Rakuten API が末尾 CTA を商品ページへ強化するため
  正当な差が生じるため（`pigeon-bottle-240`・`logicool-zone` 等）。
  `pnpm verify` に組み込み済み。

## 記事ごとの判断ルール

- 途中 CTA（after-decision）は廃止済み。長文記事でも置かない（NextStepBlock が
  結論直後の誘導を担う）。
- **単一商品記事** → `productCount: 1` を宣言し、末尾にカードを 1 枚だけ置く。
- 差分が 5〜6 項目以下 → 詳細比較を折りたたまずそのまま表示。
- 全仕様が長い（7 項目以上 or 数値表が大きい）→ `<details>` 折りたたみ。

## コンテンツタイプ（商品ガイド / 比較記事）

記事は `productCount` から機械的に導出されるコンテンツタイプを持つ
（定義: `config/article-layout.mjs` の `contentTypes`、導出: `contentTypeFor()`）。

- **商品ガイド（guide）** = `productCount` 1 の単一商品記事。
  例: `panasonic-baby-monitor-kx-hc705`（KX-HC705）、
  `panasonic-eh-na9m-guide`（EH-NA9M）。比較セクション
  （`article-comparison-v2`）を持たず、1 商品の特徴・向いている人・公式情報を
  単品で整理する。記事の meta 行に「商品ガイド」と表示する。
- **比較記事（comparison）** = `productCount` 2 以上の複数商品比較。

### 商品ガイドの作成手順

比較記事から 1 商品を「単品チェック」として切り出す場合は、次の手順で作る。
基準例: `src/pages/articles/panasonic-baby-monitor-kx-hc705/index.astro`（KX-HC705）。

1. **切り出す商品を選ぶ** — 既存の比較記事の中で、公式情報の多い商品や
   検索需要の高い商品を選ぶ（例: EH-NA9M は 2 本の比較記事に登場する上位モデル）。
2. **メタデータを追加する**（`src/content/articles.ts`）—
   `productCount: 1` を宣言する（コンテンツタイプはここから自動導出）。
   `path` は `panasonic-eh-na9m-guide` のように商品名 + `-guide` にする。
   確認日（`productInfoCheckedAt` / `purchaseLinksCheckedAt`）は、公式ページと
   購入リンクを実際に確認した日付を書く。既存記事の検証済みデータを再利用する場合は
   元記事の確認日を引き継ぐ。
3. **記事ファイルを作る** — 切り出し元の比較記事で公式に確認できた項目だけを
   「公式情報」に列挙する（比較記事の仕様表・FAQ から該当商品の行を抜き出す）。
   構成は KX-HC705 ガイドと同じ:
   1 行結論 lead → ジャンプナビ → 向いている人（`#conclusion`）→ 公式情報
   （`#official`）→ FAQ（`#faq`）→ 購入時の注意 → 購入カード 1 枚
   （`placement="article-end"`）→ 更新履歴 → 情報源一覧 → 調査方法・免責。
4. **比較記事へ相互リンクを張る** — FAQ や注意書きで、切り出し元の比較記事への
   リンクを置く（例: EH-NA9M ガイドの FAQ「EH-NA7Mと何が違う？」→ 比較記事）。
5. **購入カードは 1 枚だけ置く** — 比較記事から引き継いだ購入リンク
   （a.r10.to または楽天検索）を `PurchaseCard` 1 枚にまとめる。
6. **検証を通す** — ゲートが `productCount=1 → guide` と比較セクション無しを
   自動検証する。`tests/top-page.test.ts` がガイド記事を一覧のどこかのページで
   確認するため、ビルド後の `data-content-type="guide"` の件数が
   ガイド記事数と一致することを確認する。

BaseLayout が `<meta name="article:content-type" content="guide|comparison">` を
出力し、品質ゲート（`scripts/check-rendered-html.mjs`）が productCount と照合する。
商品ガイドが比較セクションを描画するとゲートが fail する。

### JSON-LD の分化

`article:content-type` と同一の `contentTypeFor()` から、記事の JSON-LD（schema.org
`Article`）に `about`（`Product`）を出力する。商品名はメタデータの
`aboutProductNames` で宣言する（件数は `productCount` と一致させる）。

- **商品ガイド** → `about` に単一の `Product`（宣言は必須。`defineArticleMetadata`
  が productCount=1 の記事に aboutProductNames を強制し、JSON-LD の商品セマンティクスを保証）。
- **比較記事** → 商品名を宣言した場合のみ `about` に 2 つの `Product`
  （商用シード記事は `leftProduct` / `rightProduct` から自動設定）。
  未宣言の比較記事（手書き比較記事など）は `about` を出力しない。

検証は `tests/article-metadata.test.ts`（宣言の検証 + 実ビルド JSON-LD の分岐）。

トップページと比較記事一覧の記事カードには、カテゴリタグの隣にコンテンツタイプの
ラベルタグ（`tag--type`）を表示する。ラベル文言は `src/lib/content-types.ts` の
`contentTypeLabel()` が config から導出し、カード要素に `data-content-type` 属性を
付与する（実ビルドテスト `tests/top-page.test.ts` が属性とラベルの描画を検証する）。

## トップページ（カテゴリ入口・よく比較される商品）

トップページ（`src/pages/index.astro`）は、カテゴリ入口と「よく比較される商品」を持つ。
構成の唯一の情報源は `config/article-layout.mjs` の `topPage`。

- **カテゴリ入口**（`data-top-categories`）: `articleMetadata` のカテゴリのうち、
  記事数が `topPage.categoryMinArticles`（2）以上のものだけを表示する。
  件数が多い順 → 名前順。リンク先は `/articles/?category=…`（一覧ページの
  クライアント側フィルタが URL パラメータを読んで絞り込む）。
- **よく比較される商品**（`data-top-featured`）: `topPage.featuredPaths` に
  載せた比較記事（**3〜4 件**）をカードで表示する。パスは必ず `articleMetadata` に存在させる。
  記事一覧を兼ねさせず、セクション直後に「もっと見る → /articles/」を置く。
- **最近の比較**（`data-top-latest`）: 追加日順の最新記事を**見出し付きセクション**として
  表示する。featured（人気・編集選定）とは意味を分けた入口で、「もっと見る → /articles/」を持つ。

検証は 2 段構え。

- **品質ゲート**（`scripts/check-rendered-html.mjs`）: ビルド後 HTML で
  featured の全パスがリンクされていること・カテゴリ入口の各カテゴリが
  比較記事一覧の option に実在することを照合する。
- **実ビルド整合テスト**（`tests/top-page.test.ts`）: `dist/index.html` と
  `articleMetadata` を突き合わせ、カテゴリ集合・件数ラベル・並び順・featured の
  完全一致を検証する。

## 記事カードのサムネイル（画像 or テキストタイル）

記事カード（`src/components/ArticleCard.astro`、トップ・一覧・ページ送りで共通）は
**常に 132px（スマホ 96px）のサムネイル枠**を持つ。

- **画像あり**（`imagePath` が宣言されている記事）: `<img class="card-thumb">`
  （`object-fit: cover` で枠に統一）。
- **画像なし**記事: カテゴリ名を中央表示するテキストタイル
  `<div class="card-tile">`（`data-thumb="tile"`）。
  これにより画像の有無にかかわらず全カードのレイアウトが揃う。
- カード要素は `data-thumb="image|tile"` を持ち、品質ゲート
  （`validateArticleCardThumbnails`）が「画像とタイルはちょうど一方だけ」を
  fail-closed で検証する。実ビルドテスト（`tests/top-page.test.ts`）も
  `articleMetadata.imagePath` と `data-thumb` の一致を突き合わせる。

## 比較表の「根拠・確認先」列（スマホ折りたたみ）

4 列テーブル（比較項目・A・B・根拠・確認先）を描画する比較記事では、
テーブル直前に `<details class="source-toggle">` を置く（CSS-only、JS 不使用）。

- **デスクトップ（>640px）**: 4 列すべて表示。トグル自体は `display: none`。
- **スマホ（≤640px）**: 4 列目を非表示にし、テーブルを 3 列で表示（`min-width` 解除）。
  「根拠・確認先を表示」をタップすると 4 列目が展開される。
- トグルの開閉はネイティブ `<details>`（`＋` / `−` マーカー）。
- 折りたたみ中も冒頭の TrustLine（✓ 公式確認済み（日付）・広告を含みます）と情報源一覧が根拠の所在を示す。

品質ゲート（`scripts/check-rendered-html.mjs` の `validateSourceToggle`）が fail-closed で検証する:

- 根拠列テーブル（4 列目ヘッダーが「根拠」または「根拠・確認先」）を描画する記事には
  トグルが必須（直前の要素が `</details>` であること）。
- トグルのみ存在して根拠列テーブルが無い記事（壊れたトグル）も検出する。
- 3 列テーブル（根拠列なし）は対象外。

## 記事末尾の関連記事（関連性スコア）

記事末尾は「関連する比較記事（最大 4 件）+ ほかの比較記事（最大 3 件）」で構成する。
選定は同カテゴリの先頭 n 件ではなく、関連性スコアで行う
（実装: `src/lib/related-articles.ts`、唯一の情報源: `config/article-layout.mjs` の `relatedSelection`）。

- **スコア** = 一致タグ × 3 + 一致用途（`uses`）× 2 + 一致検索意図（`audiences`）× 2 + 同カテゴリ × 1。
- **ブランド名タグ**（`relatedSelection.brandTags`）は一致しても 1 点の弱信号。
  ブランド同一性だけで「関連」と表示せず、製品タイプ（紙おむつ・哺乳びん・水筒 など）を優先する。
- **関連する比較記事** = スコア >= `minScore`（1）の上位 `limit`（4）件。
- **ほかの比較記事** = 関連に選ばれなかった記事をスコア順で `othersLimit`（3）件。
- 同点は publishedAt の新しい順、さらに path 順。
- `/tools/product-finder/` など記事メタデータの無いページは、従来どおり同カテゴリを上限件数で表示する。
- 品質ゲート（`scripts/check-rendered-html.mjs`）がビルド後 HTML の両セクション件数を
  `relatedSelection` と照合する。

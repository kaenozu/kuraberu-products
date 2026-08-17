# Article Layout v3 — 標準記事構成（2026-08-17）

v2（`docs/article-layout-v2-2026-08.md`）の後継。サイト監査（2026-08-17）の P0-3・P1-4 指摘
（「同じ商品カードが記事内で 2 回出る」「新旧テンプレート混在」）への回答として、
購入カードの配置を一本化する。

## v2 からの変更点

| 項目                       | v2                               | v3                                        |
| -------------------------- | -------------------------------- | ----------------------------------------- |
| 購入カードの配置           | **判断後 + 記事末尾**の 2 セット | **末尾 1 セットが原則**                   |
| 途中 CTA（after-decision） | 全記事に配置                     | **長文記事のみ**（`midArticleCta: true`） |
| 期待 CTA 総数              | 比較記事 4 / 単一 2              | 比較記事 2（長文 4）/ 単一 1（長文 2）    |
| `defaultPlacement`         | `after-decision`                 | `article-end`                             |

## 方針

- **購入カードは記事末尾に 1 セットだけ置く**（紹介する商品 1 つにつき 1 枚）。
  冒頭〜詳細の途中に広告カードを挟まず、本文を読んでから最後に購入先へ誘導する。
- **途中 CTA（`placement="after-decision"`）は長文記事のみ許容**。
  記事メタデータ（`src/content/articles.ts`）の `midArticleCta: true` が付いた記事だけが
  判断 UI の直後に 1 セット持てる。目安は本文 3,000 文字以上（旧育児記事相当）。
- 新旧テンプレートの混在を解消し、全記事を同じ骨格へ統一する。

## 標準骨格（全記事デフォルト）

1. タイトル + 1 行結論（リード）
2. **単一の 30秒比較 / 結論 UI**（HeroComparison など）
3. **主要差分**（共通仕様より先）
4. （長文記事のみ）**PurchaseCard × 商品数** — placement="after-decision"
5. 詳細比較（全仕様が長い記事は `<details>` 折りたたみ）
6. 公式情報・根拠
7. FAQ
8. SNS 等の任意補足（比較根拠から明確に分離した参考情報）
9. **最終 PurchaseCard × 商品数（記事末尾）** — placement="article-end"
10. 更新履歴・情報源・免責

## 機械的契約（config / ゲート）

- **唯一の情報源は `config/article-layout.mjs`**:
  - `ctaSets = [{ placement: "article-end", cardsPerProduct: 1 }]` — 末尾セット（全記事）
  - `midArticleSet = { placement: "after-decision", cardsPerProduct: 1 }` — 長文記事のみの途中セット
  - `defaultPlacement = "article-end"`
- **長文フラグは記事メタデータ**: `midArticleCta: true` を持つ記事だけ途中 CTA を持つ。
  BaseLayout が `<meta name="article:mid-cta" content="true">` を出力し、
  品質ゲート（`scripts/check-rendered-html.mjs`）が `product-count` / `mid-cta` の両 meta から
  期待枚数（総数 + placement 別）を導出して照合する。
  2026-08-17 の v3 短縮で旧育児記事 14 本が短文化されたため、現在 `midArticleCta: true` の記事は無い
  （全記事が末尾セットのみ）。今後長文記事を追加する場合は 3,000 文字目安でフラグを付ける。
- 期待枚数:
  - 通常記事: 比較 2 / 単一 1（article-end のみ）
  - 長文記事: 比較 4 / 単一 2（article-end + after-decision）
- レイアウト変更時は `config/article-layout.mjs` だけを直す（ゲートは自動追随する）。

## 記事ごとの判断ルール

- **本文が長く、判断直後の誘導が有効な記事** → `midArticleCta: true` を付けて
  after-decision セットを置く（目安: 本文 3,000 文字以上）。
- **それ以外の記事** → after-decision を置かない。`midArticleCta` は付けない。
- **単一商品記事** → `productCount: 1` を宣言し、各セットにカードを 1 枚だけ置く。
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
  載せた比較記事（3〜6 件）をカードで表示する。パスは必ず `articleMetadata` に存在させる。

検証は 2 段構え。

- **品質ゲート**（`scripts/check-rendered-html.mjs`）: ビルド後 HTML で
  featured の全パスがリンクされていること・カテゴリ入口の各カテゴリが
  比較記事一覧の option に実在することを照合する。
- **実ビルド整合テスト**（`tests/top-page.test.ts`）: `dist/index.html` と
  `articleMetadata` を突き合わせ、カテゴリ集合・件数ラベル・並び順・featured の
  完全一致を検証する。

## 比較表の「根拠・確認先」列（スマホ折りたたみ）

4 列テーブル（比較項目・A・B・根拠・確認先）を描画する比較記事では、
テーブル直前に `<details class="source-toggle">` を置く（CSS-only、JS 不使用）。

- **デスクトップ（>640px）**: 4 列すべて表示。トグル自体は `display: none`。
- **スマホ（≤640px）**: 4 列目を非表示にし、テーブルを 3 列で表示（`min-width` 解除）。
  「根拠・確認先を表示」をタップすると 4 列目が展開される。
- トグルの開閉はネイティブ `<details>`（`＋` / `−` マーカー）。
- 折りたたみ中も「公式情報確認済み」ヒーローと情報源一覧が根拠の所在を示す。

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

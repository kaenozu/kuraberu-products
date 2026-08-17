# 商品選択診断（/tools/product-finder/）— 設計とメンテナンス手順

商品選択診断（「結局どれ買えばいい？」）の設計方針・ファイル構成・メンテナンス手順。
対応する実装ブランチ: `kuraberu-product`（2026-08-17 時点では未マージ）。

## 概要

- 比較記事の「一般的にはどう違うか」に対して、「あなたならどれを選ぶべきか」を答える機能
- **ルール＋スコアリング方式**（AIの自由回答ではない）。再現性・根拠説明・公式情報準拠を優先
- サーバーAPI不要。完全クライアントサイドで、Cloudflare Pages の静的配信のみで動作
- 診断エンジンはカテゴリ非依存。**新カテゴリはデータ追加だけで動く**（エンジン・ページのコード変更不要）

## 設計方針（守るべきこと）

- 判定根拠は**メーカー公式情報のみ**。口コミ・推測値・未確認スペックをスコアに使わない
- 必須条件（exclude）はスコアより優先。ガラス不可などは除外で表現し、加点で表現しない
- スコアは -5〜+5 程度に抑え、一問で順位が極端に傾かないようにする
- 理由は reasonCode → 辞書の表示文言に分離（自由生成AIは使わない）
- 一般ユーザーへ疑似精密スコア（82点など）を見せない。「おすすめ / 次点 / 条件次第でおすすめ」表示
- アフィリエイト報酬で順位を変えない。商品カードには広告・PRを含む旨を明示
- 回答はブラウザ内だけで処理し、サーバーへ送信しない（個人情報は保存しない）
- 診断ページ自体もSEO対象。質問UIはJSで動くが、説明・選び方・FAQは静的HTMLで出力

## ファイル構成

```text
src/
├─ domain/diagnosis/            # 診断エンジン（カテゴリ非依存・依存ゼロ）
│  ├─ types.ts                  # Product / DiagnosisConfig / Question / Rule / DiagnosisCategory 等
│  ├─ filter.ts                 # 商品条件マッチング・exclude 適用
│  ├─ score.ts                  # スコアリング・理由収集
│  ├─ rank.ts                   # ランキング・タイブレーク
│  ├─ reasons.ts                # reasonCode → 表示文言の変換
│  ├─ engine.ts                 # runDiagnosis() 本体（判定順序の実装）
│  └─ validate.ts               # ビルド時のデータ整合性検証（throw で失敗させる）
├─ data/
│  ├─ products/                 # 商品データ（カテゴリごと）
│  │  ├─ baby-bottles.ts
│  │  └─ diapers.ts
│  └─ diagnoses/                # 診断設定（カテゴリごと）
│     ├─ index.ts               # レジストリ。新カテゴリはここに1行追加
│     ├─ baby-bottle.ts
│     └─ diaper.ts
└─ pages/tools/product-finder/
   ├─ index.astro               # カテゴリ一覧（レジストリから自動生成）
   └─ [category].astro          # 診断ページ（動的ルート。全カテゴリ共通）
```

## 新カテゴリの追加手順（例: 抱っこ紐）

エンジンとページのコードは変更しない。次の3つだけで追加できる。

1. **商品データ** `src/data/products/baby-carriers.ts`
   - `Product` 型に従い、id / categoryId / brand / name / tags / attributes / articleUrls / purchaseLinks / sources / verifiedAt を定義
   - `sources`（公式URL＋確認日）は最低1件必須。attributes はルールが参照する値のみ
   - purchaseLinks の URL は https であること（ビルド時検証）

2. **診断設定** `src/data/diagnoses/baby-carrier.ts`
   - `DiagnosisConfig`: id / categoryId / categoryLabel（表示名）/ title / description / productIds / questions / tieBreaker / resultConfig
   - `ReasonDictionary`: 質問の reasonCode をすべて網羅（未登録はビルド失敗）
   - `DiagnosisPageContent`: ページタイトル / H1 / description / lead / 診断対象リスト / 選び方 / FAQ / 関連記事
   - 質問は3〜6問、必須条件は exclude、強弱は score（+1〜+4 程度）で表現

3. **レジストリ登録** `src/data/diagnoses/index.ts`
   - `diagnosisCategories` に `{ slug, config, products, reasons, pageContent }` を1行追加
   - これで `/tools/product-finder/{slug}/` が自動生成される

あわせて以下を実施する。

- **比較記事へのCTA**: 対象カテゴリの比較記事に `<DiagnosisCta href="/tools/product-finder/{slug}/" />` を追加
- **sitemap**: `src/pages/sitemap.xml.ts` の `publicPaths` に `/tools/product-finder/{slug}/` を追加
- **回帰フィクスチャテスト**: `tests/diagnosis-engine.test.ts` に代表回答パターンと期待1位を追加
  （商品データ変更時に結果が変わったらテストが検知する）

## カテゴリ追加の判断基準（安易に増やさない）

- 3商品以上（または明確な比較軸を持つ2商品）が存在する
- 選択条件（質問）が2つ以上作れる
- 商品間に明確な**公式仕様差**がある（単なる人気ランキングにしない）
- 回答から推薦順位を説明できる

## 商品情報の鮮度管理（一番のメンテ負担）

- 商品データの `verifiedAt` と `sources[].checkedAt` が確認日。商品のリニューアル・仕様変更時は更新する
- 判断基準: サイト全体方針（AGENTS.md）と同じく**メーカー公式情報を一次根拠**とし、確認日と参照先を残す
- 診断ルールが「公式情報と矛盾しないか」は、コードレビューとは別の**コンテンツレビュー**が必要
  - 公式情報と一致しているか
  - 判定理由が誇張されていないか
  - アフィリエイト報酬で順位を変えていないか
  - 必須条件が正しく作用しているか
  - 同一条件で結果が再現するか

## 品質ゲート

`pnpm verify` が全て検証する（format / lint / typecheck / validate / build / rendered / deployment / external-links / spec-claims / vitest）。

- **ビルド時検証**（`validateDiagnosisData`）: productId重複・存在しない商品参照・reasonCode辞書欠落・ソース欠落・verifiedAt形式・purchase linkのhttps形式を検出してビルド失敗
- **回帰フィクスチャ**: 商品データやルール変更で「期待1位が変わる」ことをテストが検知
- **check:rendered**: 動的空要素（`<h2 data-diagnosis-label>` 等）は初期テキストを入れておかないと「empty section」で失敗する

## クリック計測

- 診断結果カードの購入リンクは `data-cta-event="purchase"` / `data-product-id` / `data-placement="diagnosis-result"` / `data-rank` を持つ
- `click-beacon.js` が同一オリジン `/api/events` へ送信（rank は任意属性。無ければ送らない）
- placement の許可リストは `config/article-layout.mjs` の `diagnosisPlacement` が唯一の定義
- これにより「比較記事経由 vs 診断経由」のクリックを比較できる（KV 有効時のみ保存）
- 詳細は `docs/click-analytics.md`

## 途中経過の保存

- localStorage キー: `product-diagnosis:{diagnosisId}:v1`
- 回答・質問位置を保存し、再訪時は途中から再開。結果表示・再診断でクリア
- 診断設定のバージョンが変わったらキーの v1 を上げて古い状態を破棄する

## 現在のカテゴリ

| slug        | 対象                                      | 質問数 | 比較記事 CTA                                                |
| ----------- | ----------------------------------------- | ------ | ----------------------------------------------------------- |
| baby-bottle | 母乳実感 160/240ml × ガラス/PPSU（4商品） | 5問    | pigeon-bottle-160-240 / pigeon-bottle-240 / pigeon-slim-240 |
| diaper      | ムーニー テープM（2商品）                 | 3問    | moony-m                                                     |

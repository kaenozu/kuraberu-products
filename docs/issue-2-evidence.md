# Issue #2 視覚・編集設計の証跡

## 対象

- Issue: [#2](https://github.com/kaenozu/kuraberu-products/issues/2)
- 実装ブランチ: `feat/issue-2-editorial-visual-design`
- 変更前基準: `ec66209`
- 実装日: 2026-07-31

## 商品画像の利用判断

今回は商品画像を使用しない。メーカー公式画像、楽天API画像、アフィリエイト経由画像について、このリポジトリ内で利用条件・保存・加工・キャッシュ条件を確認できる一次資料が揃っていないため、転載しない判断にした。

代わりに、商品名、候補A/B、ライン名、商品固有色、向く人、確認状態を組み合わせた識別UIを使う。これは架空パッケージや体験写真を作らずに、比較対象を視覚的に区別するためのもの。

## 採用モック

実装前のワイヤーフレームは [docs/issue-2-mock.md](./issue-2-mock.md) に記録した。トップ主要カードと記事冒頭の30秒比較を先に確認し、以下を採用した。

- 商品画像なしの候補A/B識別
- 「肌あたり重視」と「価格・買いやすさ重視」の差分
- 「公式確認済み」「販売ページ確認」「口コミ不足」「未確認」の文字付き状態表示
- 記事冒頭で結論・2商品・CTAアンカーをまとめる

## 変更前後スクリーンショット

`docs/issue-2-evidence/` に保存した。

変更前（`ec66209` の一時プレビュー）：

- `before-390-home.png`
- `before-390-article.png`
- `before-1440-home.png`
- `before-1440-article.png`

変更後：

- `after-390-home.png`
- `after-390-home-viewport.png`
- `after-390-article.png`
- `after-390-article-viewport.png`
- `after-1440-home.png`
- `after-1440-home-viewport.png`
- `after-1440-article.png`
- `after-1440-article-viewport.png`

## ブラウザ検証

ローカルAstro previewに対してGoogle Chrome + Playwrightで確認した。

- `/`、`/articles/`、`/articles/pampers-newborn/`: HTTP 200
- 320 / 390 / 1440px: `scrollWidth === clientWidth`、横スクロールなし
- console error、page error、request failureなし
- トップに商品名「肌へのいちばん」「さらさらケア」が描画される
- 記事冒頭に `.thirty-second` と `.difference-list` が描画される
- 公式確認済み、販売ページ確認、口コミ不足の状態バッジが描画される
- トップ → 記事一覧 → 比較記事 → 楽天CTA 2件のクリック導線を確認
- CTAは既存の楽天アフィリエイトURLと `sponsored nofollow noopener noreferrer` を維持
- 旧英語装飾ラベル（`COMPARISON MEMO`、`Latest note`、`First article`、`01 NOTE`）は公開ページに残していない

## 5秒確認

独立レビューで変更後の390pxスクリーンショットを確認した。

- トップは「パンパース新生児用」「肌へのいちばん vs さらさらケア」「肌あたり重視 vs 価格・買いやすさ重視」を短時間で回答可能
- 記事冒頭は30秒比較を見出し直下へ移動し、390pxでも2商品の名称と向く人を同時に見られる構成に調整
- 詳細な価格・サイズ・素材の具体値は、未確認のため断定していない

## 実行した検証

- `npm run verify`
- `git diff --check`
- Google Chrome + Playwright: 320 / 390 / 1440px
- コンソール、ページエラー、リクエスト失敗確認
- 導線クリック確認

結果は `npm run verify` が format、lint、Astro check（0 errors / 0 warnings / 0 hints）、content validation、Vitest 2 files / 3 tests、Astro build 7 pages まで成功。

## 未確認事項・残存リスク

- Issue #2の変更をCloudflare Productionへはまだデプロイしていない。
- 商品画像の利用規約は一次資料未確認のため、今後も画像を追加しない限り残存リスクは発生しない。
- 5秒確認は独立レビューによる画面評価であり、実ユーザー調査ではない。

## Cloudflare切り分け（2026-07-31）

- PRチェックの失敗Build ID: `638ed61e-5903-42ce-9303-4552a94762ae`
- Cloudflare Dashboardの認証付きログ本文はこの環境から取得できず、失敗フェーズ・最終エラーは未確定。
- `src/lib/rakuten.ts`でfetch接続例外を捕捉後、ローカル`pnpm run verify`は成功し7ページを生成。
- Wrangler手動デプロイ検証URL: `https://dcf07e4b.kuraberu-products.pages.dev`
- 手動デプロイURLの`/`、`/articles/`、`/articles/pampers-newborn/`はHTTP 200。
- 手動デプロイはローカル環境変数なしで生成したため楽天CTAが0件であり、Production受入成功とは扱わない。Git連携のProduction環境変数を注入した再ビルドが必要。

## Cloudflare設定照合（2026-07-31 再調査）

- `wrangler pages project list` の`kuraberu-products`は `Git Provider: No`。
- `wrangler pages deployment list --project-name kuraberu-products` はPagesのProductionデプロイ一覧を返す。
- 一方、PRの失敗Check Run名は `Workers Builds: kuraberu-products` で、CloudflareのWorkersサービスURLとBuild IDを持つ。
- したがって、PRチェックが監視しているWorkers Buildsサービスと、手動確認したPagesプロジェクトは同一のGit連携経路ではないことを確認した。
- Pages Productionの秘密変数名は `PUBLIC_RAKUTEN_PREMIUM_URL`、`PUBLIC_RAKUTEN_SARASARA_URL`、`PUBLIC_SITE_URL`、`RAKUTEN_ACCESS_KEY`、`RAKUTEN_AFFILIATE_ID`、`RAKUTEN_APPLICATION_ID` の6件が登録済み（値は出力していない）。
- Pagesの秘密変数はWranglerのローカル`dist`アップロードには注入されないため、手動アップロードのCTA 0件は環境変数未注入で説明できる。

## 訂正履歴（2026-07-31 ロールバック後）

### 誤記と正しい事実

| 誤記                                                                                                  | 正しい事実                                                                                                                                                                                                 | 確認方法                                                                                                                                                                                                                                                                                                               |
| ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 「Issue #2の変更をCloudflare Productionへはまだデプロイしていない」（上記「未確認事項・残存リスク」） | Issue #2作業中に実行したWrangler手動デプロイ（`dcf07e4b-4eea-4c71-b390-01c22c842bc3`、Source `5000eec`）が`Branch: main`としてProductionへ昇格し、Issue #1の正常なProduction（`7d203258`）を置き換えていた | `wrangler pages deployment list --project-name kuraberu-products` で`dcf07e4b`が`Environment: Production / Branch: main / Source: 5000eec`と確認                                                                                                                                                                       |
| 手動デプロイは「Production受入成功とは扱わない」（検証用の扱い）                                      | 実際にはProductionエイリアス（`kuraberu-products.pages.dev`）が`dcf07e4b`を配信しており、公開サイトへ影響していた                                                                                          | 公開URLのHTMLと`dcf07e4b.kuraberu-products.pages.dev`のHTMLが同一（CSSハッシュ`BaseLayout.DYdHilbV.css`一致）                                                                                                                                                                                                          |
| PagesプロジェクトとWorkers Buildsが「同一のGit連携経路ではない」ことのみ確認                          | さらに両者は**別アカウント・別リソース・別デプロイ経路**である                                                                                                                                             | `wrangler whoami`: PagesはAccount `3d144b7779afca3d1a896bc5796c0ad8`（Kaenozu@gmail.com）に存在。Worker `kuraberu-products`（Workers Builds）はAccount `723f1131cbe78e8bf86213adce4a6f33`（Neoenox@gmail.com）に存在。ダッシュボードでPagesプロジェクトは`723f1131`側からは見えず、Workerにカスタムドメイン/ルートなし |

### 誤認の原因と公開サイトへの影響

- **誤認の原因**: PR Check Run名 `Workers Builds: kuraberu-products` とPagesプロジェクト名 `kuraberu-products` が同名であり、同一リソースと誤認した。実際はGitHub連携がPages（Direct Upload、`Git Provider: No`）ではなくWorker側に設定されていた。
- **公開サイトへの影響**: `5000eec`（Issue #2作業中ブランチ先端）の手動デプロイはローカル環境変数なしでビルドされたため、楽天CTA 0件・環境変数未注入の状態がProductionに配信された。Issue #1で確立した環境変数注入済みProduction（`7d203258`、Source `2b0c937`、楽天CTAあり）は4時間後に上書きされた。

### Phase 1: 緊急ロールバック（2026-07-31）

Cloudflare Pages APIのrollbackエンドポイントにより、Productionを既知の正常デプロイへ復旧した。

- **ロールバック前のProduction**: `dcf07e4b-4eea-4c71-b390-01c22c842bc3`（Source `5000eec`、`Branch: main`）
- **ロールバック後のProduction**: `7d203258-7afe-4254-bcaa-d2ee71ea3255`（Source `2b0c937`、`Branch: main`、Status success）
- 実行コマンド: Cloudflare API `POST /accounts/3d144b7779afca3d1a896bc5796c0ad8/pages/projects/kuraberu-products/deployments/7d203258-7afe-4254-bcaa-d2ee71ea3255/rollback`（wrangler OAuthトークンを使用、トークン値は出力していない）

### 公開サイトの復旧確認（2026-07-31）

| 確認項目                                        | 結果                                                                                      |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `/`、`/articles/`、`/articles/pampers-newborn/` | HTTP 200                                                                                  |
| 楽天CTA                                         | 記事ページに6件（`hb.afl.rakuten.co.jp`アフィリエイト2件＋`search.rakuten.co.jp`検索4件） |
| CTAリンク                                       | 空hrefなし                                                                                |
| canonical                                       | `https://kuraberu-products.pages.dev/` と一致（全ページ）                                 |
| robots                                          | `index,follow`（全ページ）                                                                |
| console error                                   | なし                                                                                      |
| レイアウト                                      | 320 / 390 / 1440pxで横スクロール・はみ出し要素なし                                        |

### 残存リスク

- 最新main（`96103bc`、PR #10マージ済み）はProduction未反映。環境変数6件の実値を受領後に再ビルド・再デプロイが必要（Phase 3、未実施）。
- `dcf07e4b`のデプロイは削除していない（ロールバック履歴として残存）。

## Phase 3: 最新mainの検証と再デプロイ（2026-07-31）

### デプロイ実績

| 項目                             | 値                                                                                                                                                     |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 新しいProduction Deployment ID   | `b4477a4b-90fb-4ae8-bda2-7c7596195fa7`                                                                                                                 |
| Deploymentに記録されたSource SHA | `f20c949`（`96103bc`とツリー同一、リモートデフォルトブランチHEAD `96103bc` を `git diff --stat` で差分0行と確認）                                      |
| ビルドに含めたローカル変更       | `PUBLIC_CONTACT_URL`必須チェック削除、`.env.example`/`README.md`更新、回帰テスト `tests/env-config.test.ts` 追加（未コミット。GitHubのmainには未反映） |
| デプロイ方式                     | Wrangler Direct Upload（`wrangler pages deploy dist --project-name kuraberu-products --branch main`、アカウント `3d144b7779afca3d1a896bc5796c0ad8`）   |
| デプロイ前のProduction           | `7d203258-7afe-4254-bcaa-d2ee71ea3255`（Source `2b0c937`）                                                                                             |

### ローカル検証（`DEPLOYMENT_ENV=production`、`corepack pnpm run verify`）

- format、lint、typecheck、validate:env、validate:content、build（7ページ）、check:rendered、check:external-links、test（回帰テスト含む）すべて成功。
- 公開値（`PUBLIC_SITE_URL`、`PUBLIC_RAKUTEN_PREMIUM_URL`、`PUBLIC_RAKUTEN_SARASARA_URL`）は現Production HTMLの公開リンクから復元し、ローカル`.env`（gitignored）へ設定。
- 楽天API秘密変数3件（`RAKUTEN_APPLICATION_ID`、`RAKUTEN_ACCESS_KEY`、`RAKUTEN_AFFILIATE_ID`）は未設定のままビルドし、楽天CTAがenvの直接URLから生成されることを確認（API未認証でもCTAは維持される）。

### 公開受入結果

| 確認項目                                        | 結果                                                                                                                                                      |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`、`/articles/`、`/articles/pampers-newborn/` | HTTP 200（3件とも）                                                                                                                                       |
| 楽天CTA                                         | 記事ページに6件（`hb.afl.rakuten.co.jp`アフィリエイト2件＋`search.rakuten.co.jp`検索4件）。アフィリエイト先は環境変数で設定した2商品（netbaby、hikaritv） |
| CTAリンク                                       | 空hrefなし（全ページ0件）                                                                                                                                 |
| canonical                                       | `https://kuraberu-products.pages.dev/` と一致（全ページ）                                                                                                 |
| robots                                          | `index,follow`（全ページ）                                                                                                                                |
| console error / warn                            | なし                                                                                                                                                      |
| レイアウト                                      | 320 / 390 / 1440pxで横スクロール・はみ出し要素なし（`scrollWidth === clientWidth`）                                                                       |

### 環境変数状態（値は記載しない）

| 変数名                        | 公開値/秘密値 | 設定済み/未設定                                     | ビルド必須/任意                          |
| ----------------------------- | ------------- | --------------------------------------------------- | ---------------------------------------- |
| `PUBLIC_SITE_URL`             | 公開値        | 設定済み（ローカル`.env`＋Pages秘密変数）           | 必須                                     |
| `PUBLIC_RAKUTEN_PREMIUM_URL`  | 公開値        | 設定済み（ローカル`.env`＋Pages秘密変数）           | 必須                                     |
| `PUBLIC_RAKUTEN_SARASARA_URL` | 公開値        | 設定済み（ローカル`.env`＋Pages秘密変数）           | 必須                                     |
| `PUBLIC_CONTACT_URL`          | 公開値        | 未設定（aboutページは「準備中」フォールバック表示） | 任意（Phase 3で任意化）                  |
| `RAKUTEN_APPLICATION_ID`      | 秘密値        | 未設定（再発行確認待ち）                            | 任意（未設定時はAPI補完なし、CTAは維持） |
| `RAKUTEN_ACCESS_KEY`          | 秘密値        | 未設定（再発行確認待ち）                            | 任意（同上）                             |
| `RAKUTEN_AFFILIATE_ID`        | 秘密値        | 未設定（再発行確認待ち）                            | 任意（同上）                             |

### Phase 3の変更内容

- `PUBLIC_CONTACT_URL`は`src/pages/about.astro`で参照されるがフォールバック実装があり、現Productionも未設定で運用中のため、production必須チェック（`astro.config.mjs`、`scripts/validate-build-env.mjs`）から削除し任意化。
- `.env.example`と`README.md`の環境変数説明を実装と同期（必須3件＋任意）。
- 必須チェックと`.env.example`・READMEの不一致を検出する回帰テスト`tests/env-config.test.ts`を追加。

### ロールバック手順

新しいProductionが正常でない場合、Cloudflare APIで既知の正常デプロイへ戻す。

- ロールバック先: `7d203258-7afe-4254-bcaa-d2ee71ea3255`（Source `2b0c937`、楽天CTAあり）
- コマンド: `POST /accounts/3d144b7779afca3d1a896bc5796c0ad8/pages/projects/kuraberu-products/deployments/7d203258-7afe-4254-bcaa-d2ee71ea3255/rollback`

### 残存リスク（Phase 3後）

- 楽天API秘密変数3件は未設定。値の保管場所を確認し、無ければ楽天側で再発行し、Cloudflare Dashboardから登録する必要がある（値のやり取りはチャット・ログ・コミットに載せない）。
- ローカル変更（`PUBLIC_CONTACT_URL`任意化、回帰テスト）はGitHubのmainに未反映。Phase 4でPR化・マージが必要。
- `b4477a4b`のデプロイはgitの記録上`f20c949`（`96103bc`とツリー同一）だが、ビルドには上記ローカル変更が含まれる。

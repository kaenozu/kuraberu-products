# Issue #2 視覚・編集設計の証跡

## 対象

- Issue: [#2](https://github.com/kaenozu/kuraberu-products/issues/2)
- 実装ブランチ: `feat/issue-2-editorial-visual-design`
- 変更前基準: `ec66209`
- 実装日: 2026-07-31

## 公開証跡の情報境界

このファイルは公開リポジトリに含まれるため、Cloudflareのaccount ID、zone ID、route、アカウントメール、Dashboard固有URL、Deployment UUID、認証付きURLは記録しない。正確な運用識別子、rollback対象、認証付きログは、必要な権限を持つ運用者の非公開証跡で管理する。スクリーンショットはサイト表示だけを含み、ブラウザの認証画面や運用画面は保存しない。

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

`docs/issue-2-evidence/` に保存した。ファイルはサイトのviewport表示だけで、Cloudflareの運用情報を含まない。

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

- `pnpm run verify`
- `git diff --check`
- Google Chrome + Playwright: 320 / 390 / 1440px
- コンソール、ページエラー、リクエスト失敗確認
- 導線クリック確認

結果は `pnpm run verify` が format、lint、Astro check（0 errors / 0 warnings / 0 hints）、content validation、Vitest 2 files / 3 tests、Astro build 7 pages まで成功。

## 未確認事項・残存リスク

- Issue #2の変更を正規Productionへ反映したことは、この証跡だけでは確認しない。
- 商品画像の利用規約は一次資料未確認のため、今後も画像を追加しない限り残存リスクは発生しない。
- 5秒確認は独立レビューによる画面評価であり、実ユーザー調査ではない。

## Cloudflare切り分け（2026-07-31）

- PRチェックの失敗Build IDと認証付きDashboardログは、この公開証跡には記載しない。失敗フェーズ・最終エラーは未確定のまま保持する。
- `src/lib/rakuten.ts`でfetch接続例外を捕捉後、ローカル`pnpm run verify`は成功し7ページを生成。
- Wrangler手動デプロイの検証用URLは公開しない。`/`、`/articles/`、`/articles/pampers-newborn/`がHTTP 200であることだけを記録する。
- 手動デプロイはローカル環境変数なしで生成したため楽天CTAが0件であり、Production受入成功とは扱わない。Git連携のProduction環境変数を注入した再ビルドが必要。

## Cloudflare設定照合（2026-07-31 再調査）

- PagesプロジェクトはGit ProviderなしのDirect Upload経路である。
- PRチェックのWorkers Buildsサービスと手動確認したPagesプロジェクトは、同名でも別リソース・別デプロイ経路である。
- Pages側の環境変数名は、公開値と秘密値を含めて6件登録済みと確認した。値、account ID、zone ID、route、Dashboard URLは記載しない。
- Pagesの秘密変数はWranglerのローカル`dist`アップロードには注入されないため、手動アップロードのCTA 0件は環境変数未注入で説明できる。

## 訂正履歴（2026-07-31 ロールバック後）

### 誤記と正しい事実

| 誤記                                        | 正しい事実                                                                                 | 確認方法                                                           |
| ------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| Issue #2の変更はProductionへ未反映          | Issue #2作業中の手動デプロイがProductionへ反映され、既知の正常なProductionを置き換えていた | Pagesのデプロイ履歴でEnvironment、Branch、Source SHAを照合         |
| 手動デプロイは検証用で公開影響なし          | 実際にはProductionエイリアスへ配信され、公開サイトへ影響した                               | 公開originと対象デプロイのHTML・CSSハッシュを比較                  |
| PagesとWorkers Buildsは同一経路かもしれない | 両者は別リソース・別アカウント・別デプロイ経路で、Workers側に確認対象のrouteはない         | `wrangler whoami`、Dashboard、デプロイ履歴を照合（識別子は非公開） |

### 誤認の原因と公開サイトへの影響

- **誤認の原因**: PR Check Run名とPagesプロジェクト名が同名だったため、同一リソースと誤認した。実際はPagesのDirect UploadとWorkers側のGit連携が別経路だった。
- **公開サイトへの影響**: Issue #2作業中の手動デプロイはローカル環境変数なしでビルドされたため、楽天CTA 0件・環境変数未注入の状態がProductionに配信された。既知の正常なProductionは後で復旧した。

### Phase 1: 緊急ロールバック（2026-07-31）

Cloudflare Pages APIのrollbackエンドポイントにより、Productionを既知の正常デプロイへ復旧した。デプロイID、account ID、APIパス、トークン情報は公開しない。

- ロールバック前後のSource SHA、Branch、Statusは内部運用証跡で照合済み。
- 公開サイトの復旧確認では、主要3ページがHTTP 200、楽天アフィリエイトCTAが2件、空hrefがなく、320 / 390 / 1440pxで横スクロールがなかった。
- canonicalは正規Production originと一致し、通常ページのrobotsは`index,follow`、console errorはなかった。

### 残存リスク

- 最新default branchのProduction反映、実環境変数、楽天API実経路は別の受入条件として残る。
- 旧デプロイは削除せず、ロールバック履歴として保持する方針だった。

## Phase 3: 最新default branchの検証と再デプロイ（2026-07-31）

### デプロイ実績

- Productionデプロイの一意IDとaccount情報は非公開運用証跡に分離した。
- DeploymentのSource SHAは`f20c949`で、当時のdefault branchとツリー同一だった。
- ビルドには`PUBLIC_CONTACT_URL`任意化、`.env.example`・`README.md`更新、`tests/env-config.test.ts`追加が含まれていたが、当時はGitHubのdefault branchへ未反映だった。
- デプロイ方式はWrangler Direct Uploadで、公開URL・固有Dashboard URLは記載しない。

### ローカル検証（`DEPLOYMENT_ENV=production`、`corepack pnpm run verify`）

- format、lint、typecheck、validate:env、validate:content、build（7ページ）、check:rendered、check:external-links、test（回帰テスト含む）すべて成功。
- 公開値はローカル`.env`（gitignored）へ設定した。楽天API秘密変数3件は未設定のまま、直接URL経路でCTAが生成されることを確認した。

### 公開受入結果

- 主要3ページはHTTP 200、楽天アフィリエイトCTAは2件、空hrefなし。
- canonicalは正規Production originと一致し、通常ページのrobotsは`index,follow`。
- console error / warnはなく、320 / 390 / 1440pxで横スクロールなし。

### 環境変数状態（値は記載しない）

| 変数名                        | 公開値/秘密値 | 設定状態             | ビルド条件 |
| ----------------------------- | ------------- | -------------------- | ---------- |
| `PUBLIC_SITE_URL`             | 公開値        | 設定済み             | 必須       |
| `PUBLIC_RAKUTEN_PREMIUM_URL`  | 公開値        | 設定済み             | 必須       |
| `PUBLIC_RAKUTEN_SARASARA_URL` | 公開値        | 設定済み             | 必須       |
| `PUBLIC_CONTACT_URL`          | 公開値        | 未設定（準備中表示） | 任意       |
| `RAKUTEN_APPLICATION_ID`      | 秘密値        | 未設定               | 任意       |
| `RAKUTEN_ACCESS_KEY`          | 秘密値        | 未設定               | 任意       |
| `RAKUTEN_AFFILIATE_ID`        | 秘密値        | 未設定               | 任意       |

### Phase 3の変更内容

- 以下は2026-07-31時点の履歴であり、現在の統合HEADやProduction反映を示す受入証跡ではない。
- `PUBLIC_CONTACT_URL`はフォールバック実装があるためproduction必須から任意へ変更した。
- `.env.example`と`README.md`を実装と同期し、環境変数の不一致を回帰テストで検出する。
- 現在の統合HEADではProductionの`PUBLIC_CONTACT_URL`を必須へ戻しているが、実際のProduction値、正式な運営者情報、正規Cloudflare経路は未確認である。

### ロールバック手順

新しいProductionが正常でない場合は、Cloudflareのデプロイ履歴から内部証跡に記録した既知の正常デプロイへ戻し、公開後検証を再実行する。公開文書にはDeployment ID、account ID、APIパスを記載しない。

### 残存リスク（Phase 3後）

- 楽天API秘密変数3件は未設定。保管場所、権限、利用状況を確認し、必要な場合だけ再発行・登録・API補完確認を行う。
- ローカル変更はGitHubのdefault branchへ未反映だったため、再現可能なPRとCIを経由する必要がある。

## Phase 4: default branchとの整合（PR #12）と正式デプロイ（2026-07-31）

### 経緯

Phase 3のProductionは未コミットのローカル変更を含むビルドだったため、Gitからの再現性が保証できない状態だった。その後、PR #12をdefault branchへ反映し、同一ツリーを正式デプロイした。

### PR #12 の内容

- ブランチ: `agent/11-env-config-fix` → `feat/affiliate-site-foundation` にマージ（Squash）
- マージコミット: `397e600c282477a3abd26a9c07ba823aab892f7b`
- 変更: `astro.config.mjs`・`scripts/validate-build-env.mjs`、`.env.example`・`README.md`、`tests/env-config.test.ts`、本証跡
- CI: verify、Workers Builds、GitGuardianが成功

### 正式デプロイと受入

- Productionデプロイの一意ID、公開URL、account情報は非公開運用証跡に分離した。
- DeploymentのSource SHAは`397e600`で、マージ後default branchと完全一致した。
- ローカル検証（`DEPLOYMENT_ENV=production`、`corepack pnpm run verify`）はformat、lint、typecheck、validate:env、validate:content、build 7ページ、check:rendered、check:external-links、test 3 files / 8 testsが全PASS。
- 公開受入は主要3ページHTTP 200、楽天アフィリエイトCTA 2件、空hrefなし、canonical一致、robots `index,follow`、console error / warnなし、320 / 390 / 1440px横スクロールなし。

### Deployment保持方針

- 旧・現行Deploymentは削除せず、内部運用のロールバック用途に保持する。
- ロールバック時は対象Deployment、Source SHA、時刻、PASS/BLOCKERだけを内部証跡へ記録し、秘密値やaccount識別子を公開しない。

### 残存リスク（Phase 4後）

- 楽天API秘密変数3件、正規Production route、Protected Environment、実Ruleset受入は別タスクで確認する。
- 公開証跡にCloudflare account ID、zone ID、route、email、Dashboard固有URL、Deployment UUIDを再追加しない。

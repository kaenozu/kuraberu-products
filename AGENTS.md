# AGENTS.md

このリポジトリで作業するAIエージェントと自動化担当者は、変更前に本書を確認してください。

## 作業モードとworktreeの適用範囲

作業方法を次の2種類に分けます。

### ローカル作業

ローカルcloneでファイル編集、format、test、build、commit、push等を行う作業です。

- 原則として担当ごとに別branch、別worktreeを使用します。
- 元リポジトリのdefault branch checkout先を直接編集しません。
- worktree確認、実行中process確認、未コミット差分保護の規則は、ローカル作業にだけ適用します。

### Remote-only GitHub作業

GitHub API、GitHub Contents API、Pull Request API等だけを使い、ローカルclone、ローカルファイル、ローカルprocessを操作しない作業です。

- **worktreeの作成・存在確認は不要です。**
- Exact default-branch HEADまたは明示されたbase refから専用remote branchを作成します。
- default branchへ直接commitせず、専用branchへcommitしてDraft PRを作成します。
- ローカルdirty状態、ローカルworktree、実行中processを推測したり、remote-only作業の停止理由にしたりしません。
- ローカル検証を実行していない場合は明記し、GitHub ActionsのExact HEAD結果を確認します。
- CIで安全に検証できない大規模変更、binary、生成物、秘密情報、Production操作はremote-onlyで実施しません。

途中でローカルコマンドやローカルファイル操作が必要になった場合、その時点からローカル作業として専用worktree規則を適用します。

## 共通の作業開始前確認

- 対象repository、default branch、base HEAD、関連Issue・PR、変更対象を確認します。
- GitHub上ではPRのbase/head、review、CI、mergeabilityを確認します。
- 未確認情報を過去の会話や別担当者の記憶で補完しません。
- 1つの担当branchやPRへ無関係な目的を混在させません。

## ローカル作業の開始前確認

```bash
git remote -v
git status --short
git branch --show-current
git rev-parse HEAD
git worktree list --porcelain
```

- 同一ファイル、同一test、依存更新、formatter、buildを複数担当で同時に扱いません。
- 同じworktreeで別セッションが生存している場合、編集、format、test、build、commit、pushを開始しません。
- 他担当の未コミット差分や未追跡ファイルを削除、上書き、stash、commitしません。
- 競合範囲が解消できない作業は、解除条件を記録して保留します。
- ローカル作業完了後は、統合済み、再開条件なし、未コミット差分なしを確認してから不要なworktreeを削除します。

## Remote-only GitHub作業の開始前確認

1. repository metadata、default branch、Exact base HEADをGitHubから再取得します。
2. 対象remote branchが存在しないこと、または自分の継続branchであることを確認します。
3. Exact baseから専用remote branchを作成します。
4. 更新対象ファイルの最新blob SHAと内容を取得します。
5. 小さくレビュー可能なcommitを作成し、Draft PRを開きます。
6. diff、GitHub Actions、status checksを確認します。

Remote-only作業では、ローカルworktreeの有無やローカルprocessを確認事項またはBlockerに含めません。

## 変更方針

- IssueのGoal、受入条件、利用者への影響を優先します。
- 公開API、URL、環境変数、記事templateとの後方互換性を維持します。
- 依頼範囲外の大規模refactorや無関係な整理を混在させません。
- errorの握りつぶし、test skip、型安全性低下、lint無効化で問題を隠しません。
- network処理にはtimeoutと安全なfallbackを設けます。

## サイト構造とコンテンツ編集（このリポジトリ固有）

- Astro静的サイト（`output: "static"`）。記事は `src/content/articles/` 配下のTypeScriptファイルで `defineArticleMetadata()` を使って定義し、`src/content/articles/index.ts` が単一レジストリとして再exportする（消費者コードはここだけをimportする）。
- 新規記事の雛形は `pnpm article:add`（`node scripts/article-add.mjs`）で生成する。
- 購入リンクは `src/data/article-purchase-links.json` と各記事の `purchaseLinkStatus` をセットで管理する。`purchaseLinkStatus` は `verified` / `unverified` / `unavailable` を基本とし、楽天商品詳細URL（`item.rakuten.co.jp`）を直接参照する場合は `direct` を使う（`check:rendered` は `verified` と `direct` を購入CTA表示対象にする）。`check:purchase-link-consistency` が整合性を検証する（ネットワーク検証。オフライン時は `ALLOW_NETWORK_SKIP=1` で警告のみになる）。
- 記事・カテゴリ追加の手順は `docs/site-management.md`、記事候補の管理は `docs/article-backlog.md`、リサーチの雛形は `docs/article-research-template.md` を参照する。
- 用語表記の扱い（例: 「沸とう」）は `CONTRIBUTING.md` を正とする。

## コンテンツと広告

- メーカー等の一次情報を優先し、確認日と参照先を残します。
- 未確認の数値、価格、在庫、体験談、評価、review数を補いません。
- 実際に使用していない商品を使用したとは記載しません。
- 広告linkは編集内容と分離し、広告であることを明示します。
- 外部投稿は公式embedまたは原文linkだけを使用し、screenshot転載や本文保存を行いません。

## 秘密情報と本番操作

GitHub mergeは本番反映を意味しません。本番反映は `tools/production/Invoke-ProductionBuildAndDeploy.ps1` か `.github/workflows/deploy-production.yml` の workflow_dispatch（`expected_sha` + `confirm: DEPLOY`）でのみ行います。

次は明示的な許可なしに実施しません。

- Production deploy、traffic切替、公開URL変更
- Cloudflare/GitHubの権限・branch protection・ruleset変更
- API key、token、secret variableの作成、再発行、登録
- data削除、force push、履歴改変

秘密情報、接続文字列、token、個人情報をlog、screenshot、commit、Issue、PRへ含めません。

## ローカル実行環境（Windows開発機の注意）

- PowerShellの実行ポリシーで `pnpm.ps1` が起動できないため、pnpmは `& "$env:APPDATA\npm\pnpm.cmd" ...` で呼ぶ。Nodeは `.node-version`（24）、正規のinstall経路は `corepack enable` + `pnpm install --frozen-lockfile`。
- worktreeに新規 `pnpm install --frozen-lockfile` すると、`satteri` のoptional native binding欠落でvitest（astro経由の `vitest.config.ts` 読み込み）が `ERR_DLOPEN_FAILED` で起動しない事象がある。回避はastroをimportしない最小の仮vitest configを一時配置して純ロジックの `tests/` だけ実行し、実行後に削除する。リポジトリ直下（`main` checkout）のnode_modulesは正常で、単独のworktreeにinstallし直す必要はない。
- `DEPLOYMENT_ENV` は未設定時 `preview`。production buildは `PUBLIC_SITE_URL` 等が必須で、`config/runtime-env.mjs` がビルド開始時に検査する（不足だとビルド失敗）。個別コマンドの一覧は `CONTRIBUTING.md` を参照。

## 検証

### ローカル作業

検証は対象に応じて次の3段階で行います（個別コマンドの実体は `package.json`、一覧は `CONTRIBUTING.md` を正とする）。

- 反復中（build・network不要）: `pnpm verify:fast`
- Ready化前のフルゲート: `pnpm verify`（＝ `verify:lint` + `verify:build`。`verify:build` が先頭で `astro build` するため、`verify` 単体でformat/lint/typecheck/env/content/build/生成物検証/vitestが一巡する）→ 最後に `git diff --check`
- dist・browser依存: `pnpm test:dist`（build後のdist検証）、`pnpm test:e2e`（`pnpm exec playwright install chromium` が必要）。E2Eの失敗をskip・timeout延長・assertion弱体化で隠さない。

注意点:

- `verify:lint` は vitest（coverage付き）と購入リンク整合性（ネットワーク）を含む。CIは `ALLOW_NETWORK_SKIP=1` で実行される。
- `check:source-relevancy` / `check:price-claims` は warn-first（`--strict` 付きでのみ失敗）。公式ページの例外は `docs/source-relevancy-allowlist.md` に登録する。
- 外部リンクの実到達性（200〜399=OK / 404・410=失敗 / 403・429・5xx=警告）は `check:external-link-reachability` が別ゲート。
- Production設定の検証はtest用URL（`.invalid`）を使い、本物のsecretは使わない。

終了codeだけでなく、実行件数、skip、warning、生成page数、差分も確認します。

### Remote-only GitHub作業

- ローカル検証を実行したと虚偽報告しません。
- Draft PRのExact HEADでGitHub Actionsとstatus checksを確認します。
- 必要な検証がCIに存在しない場合は、BlockerまたはResidual Riskとして記録します。
- CI failureは原因を確認し、自分のbranchだけを修正します。
- CIだけで安全に検証できない変更は、ローカル作業へ切り替えるまでDraftを維持します。

## GitとPR

- default branchへ直接commitまたはpushしません。
- 1つのPRへ無関係な目的を混在させません。
- ローカル作業ではstaging対象を明示し、未関連差分を含めません。
- force pushを行いません。
- 他担当branchの書換え、削除、流用を行いません。
- PR本文へ変更理由、主要実装、base HEAD、最終HEAD、検証結果、未実行検証、未確認事項、関連Issueを記載します。
- 検証が重大な理由で未完了、または競合が残る場合はDraftのままにします。
- mergeやProduction反映は、明示的に依頼された場合だけ行います。

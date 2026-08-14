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

## コンテンツと広告

- メーカー等の一次情報を優先し、確認日と参照先を残します。
- 未確認の数値、価格、体験談、評価、review数を補いません。
- 実際に使用していない商品を使用したとは記載しません。
- 広告linkは編集内容と分離し、広告であることを明示します。
- 外部投稿は公式embedまたは原文linkだけを使用し、screenshot転載や本文保存を行いません。

## 秘密情報と本番操作

次は明示的な許可なしに実施しません。

- Production deploy、traffic切替、公開URL変更
- Cloudflare/GitHubの権限・branch protection・ruleset変更
- API key、token、secret variableの作成、再発行、登録
- data削除、force push、履歴改変

秘密情報、接続文字列、token、個人情報をlog、screenshot、commit、Issue、PRへ含めません。

## 検証

### ローカル作業

変更内容に応じ、次を直列で実行します。

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm validate:env
pnpm validate:content
pnpm build
pnpm check:rendered
pnpm check:deployment
pnpm check:external-link-syntax
pnpm test
git diff --check
```

終了codeだけでなく、実行件数、skip、warning、生成page数、差分を確認します。Production設定検証はtest用URLを使い、本物のsecretを使用しません。

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

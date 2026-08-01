# AGENTS.md

このリポジトリで作業するAIエージェントと自動化担当者は、変更前に本書を確認してください。

## 作業開始前

対象リポジトリ、ブランチ、HEAD、差分、worktree、関連Issue・PR、実行中プロセスを確認します。

```bash
git remote -v
git status --short
git branch --show-current
git rev-parse HEAD
git worktree list --porcelain
```

GitHub上では対象Issue、PRのbase/head、レビュー、CI、mergeabilityを確認してください。未確認情報を過去の会話や別担当者の記憶で補完しないでください。

## 並行作業

- 原則として担当ごとに別ブランチ、別worktreeを使用します。
- 同一ファイル、同一テスト、依存更新、formatter、buildを複数担当で同時に扱いません。
- 同じworktreeで別セッションが生存している場合、ファイル変更、format、test、build、commit、pushを開始しません。
- 他担当の未コミット差分、未追跡ファイルを削除、上書き、stash、commitしません。
- 競合範囲が解消できない作業は、解除条件を記録して保留します。

## 変更方針

- IssueのGoal、受入条件、利用者への影響を優先します。
- 公開API、URL、環境変数、記事テンプレートとの後方互換性を維持します。
- 依頼範囲外の大規模リファクタや無関係な整理を混在させません。
- エラーの握りつぶし、テストskip、型安全性低下、lint無効化で問題を隠しません。
- ネットワーク処理にはタイムアウトと安全なフォールバックを設けます。

## コンテンツと広告

- メーカー等の一次情報を優先し、確認日と参照先を残します。
- 未確認の数値、価格、体験談、評価、レビュー数を補いません。
- 実際に使用していない商品を使用したとは記載しません。
- 広告リンクは編集内容と分離し、広告であることを明示します。
- 外部投稿は公式埋め込みまたは原文リンクだけを使用し、スクリーンショット転載や本文保存を行いません。

## 秘密情報と本番操作

次は明示的な許可なしに実施しません。

- Productionデプロイ、traffic切替、公開URL変更
- Cloudflare/GitHubの権限・branch protection変更
- APIキー、トークン、秘密変数の作成、再発行、登録
- データ削除、force push、履歴改変

秘密情報、接続文字列、トークン、個人情報をログ、スクリーンショット、commit、Issue、PRへ含めません。

## 検証

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

終了コードだけでなく、実行件数、skip、警告、生成ページ数、差分を確認します。Production設定検証はテスト用URLで行い、本物の秘密値を使用しません。

## GitとPR

- 1つのPRへ無関係な目的を混在させません。
- stagingは対象ファイルを明示し、未関連差分を含めません。
- force pushは行いません。
- PR本文へ変更理由、主要実装、検証結果、未確認事項、関連Issueを記載します。
- 検証が重大な理由で未完了、または競合が残る場合はDraftのままにします。
- マージやProduction反映は、明示的に依頼された場合だけ行います。

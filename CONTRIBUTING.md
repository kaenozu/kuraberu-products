# Contributing

## 開発環境

- Node.js: `^20.19.1` または `>=22.12.0`
- 標準Node: `.node-version`
- pnpm: `packageManager` に記載したバージョン

```bash
corepack enable
pnpm install --frozen-lockfile
```

秘密値は `.env` またはGit管理外の安全な保管場所で管理します。`.env.example` には変数名と安全な例だけを記載してください。

## Issueとブランチ

- 実装前にIssueのGoalと受入条件を確認します。
- ブランチ名は `agent/<issue-or-purpose>` を基本とします。
- 並行担当は別worktreeを使用し、変更ファイルと重い検証を重複させません。
- 既定ブランチへ直接commitしません。

## コード変更

- 既存の静的サイト構成、URL、記事テンプレートを維持します。
- 公開URLは共通検証を通し、不正スキームや資格情報付きURLを出力しません。
- 楽天URLは許可した公式ホストだけを使用します。
- ネットワーク呼び出しには有限のタイムアウトを設定します。
- API障害時も記事本文と静的ビルドが成立するようにします。
- コンテンツは一次情報を根拠とし、確認できない事実を補いません。

## 品質ゲート

通常は次をまとめた `pnpm verify` を実行します。

```bash
pnpm verify
git diff --check
```

個別確認が必要な場合:

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
```

`check:external-link-syntax` はネットワーク到達性を保証しません。公開前のリンク到達性は別の受入確認として実施します。

Production設定は本物の秘密値を使わず、次のようなテスト用URLで検証できます。

```bash
DEPLOYMENT_ENV=production \
PUBLIC_SITE_URL=https://ci.kuraberu-products.invalid \
PUBLIC_RAKUTEN_PREMIUM_URL=https://hb.afl.rakuten.co.jp/ci/premium \
PUBLIC_RAKUTEN_SARASARA_URL=https://hb.afl.rakuten.co.jp/ci/sarasara \
pnpm validate:env
```

## CommitとPR

- commitは目的単位にし、無関係な変更を含めません。
- PRは原則Draftで開始し、検証完了後にReady化します。
- PR本文には次を記載します。
  - 変更理由と利用者への影響
  - 主要な変更ファイル
  - 実行した検証、件数、結果
  - 未確認事項と残存リスク
  - `Closes #...` または関連Issue
- CI失敗、重大な未検証、競合がある状態でReady化・マージしません。
- Productionデプロイ、traffic切替、権限変更、秘密再発行はコードPRと分離し、明示的な許可を得ます。

## 依存更新

- `pnpm-lock.yaml` を意図せず再生成しません。
- 依存更新は変更理由、互換性、セキュリティ影響を確認します。
- overrideには理由と解除条件を記録します。
- 依存更新PRでも全品質ゲートを実行します。

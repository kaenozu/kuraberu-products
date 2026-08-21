# くらべる商品メモ

Astro + TypeScript で構築した、日本向けの2商品比較サイトです。カテゴリは限定せず、比較の根拠は確認できる公式情報を優先します。

## 編集方針

- 確認できない数値、価格、在庫、体験談を事実として書かない
- 比較結論と購入導線を分離し、アフィリエイト条件を比較結果へ影響させない
- メーカー公式情報を比較の一次根拠とする
- SNS等の感想を扱う場合も、比較根拠とは分離して参考情報として示す
- 記事ごとに検証日・出典・変更履歴を管理する

開発・レビュー規約は [CONTRIBUTING.md](./CONTRIBUTING.md)、AIエージェントと並行作業の安全規約は [AGENTS.md](./AGENTS.md) を参照してください。

商品選択診断（/tools/product-finder/）の設計・メンテナンス手順は [docs/product-diagnosis.md](./docs/product-diagnosis.md) を参照してください。

## 開発

### 必要環境

- Node.js: `^20.19.1` または `>=22.12.0`
- 標準環境: `.node-version` に記載した Node 24
- pnpm: 10.34.5

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

### 品質ゲート

```bash
pnpm verify
```

`pnpm verify` は format、lint、typecheck、環境・コンテンツ検証、build、生成HTML、デプロイ契約、外部URL構文、Vitest をまとめて検証します。

外部リンクの実到達性は別ゲートです。

```bash
pnpm check:external-link-reachability
```

- 200〜399: 到達可能
- 404 / 410: リンク切れとして失敗
- 403 / 429 / 5xx / timeout: bot制限や一時障害の可能性があるため警告

通常PRの主要品質ゲートは外部ネットワークへ依存しません。

## 環境変数

`DEPLOYMENT_ENV` は `development` / `preview` / `production` のいずれかです。未設定時は `preview` です。

Production では次が必須です。

- `PUBLIC_SITE_URL`: query / fragment / credentials / subpath を含まない HTTPS のサイトルート
- 購入リンクは次のどちらか
  - `PUBLIC_RAKUTEN_PREMIUM_URL` と `PUBLIC_RAKUTEN_SARASARA_URL` の両方
  - `RAKUTEN_APPLICATION_ID` / `RAKUTEN_ACCESS_KEY` / `RAKUTEN_AFFILIATE_ID`

商品別の補完リンクを使う場合は、`PUBLIC_RAKUTEN_BABYBJORN_CRADLE_URL`、`PUBLIC_RAKUTEN_APRICA_COCONEL_AIR_URL`、`PUBLIC_RAKUTEN_PIGEON_160_URL` を設定します。

購入URLは HTTPS の許可済み楽天ホストだけを受け付けます。API取得に失敗した場合は、未確認値を補完せず「準備中」として静的ビルドを継続します。

任意:

- `PUBLIC_CONTACT_URL`: 問い合わせ先 HTTPS URL
- `PUBLIC_BUILD_SHA`: デプロイ検証用のビルド元コミットSHA。`tools/production/Invoke-ProductionBuildAndDeploy.ps1` が本番ビルド時に自動注入し、`Invoke-PostDeployVerification.ps1` が配信HTMLの `meta[name=build-sha]` と突合する。通常は手動設定不要。

お問い合わせAPI（`/api/contact`）の同一IPからの連続送信は、`wrangler.jsonc` の `ratelimits` バインディング（Workers Rate Limiting API）で1分あたり5件に制限しています。カウンタはCloudflareロケーション単位・結果整合性のため、厳密な会計ではなくスパム抑止です。バインディング未設定・エラー時は制限なしで続行します（可用性優先）。`namespace_id` はこのアカウント内で一意な正の整数文字列を選んでください。

クリック計測（`/api/events`）はプライバシー配慮型で、購入CTAクリックを同一オリジンの Function で受け取ります。Cookie・IP・フィンガープリントは保存しません。永続化は任意の Workers KV（`ANALYTICS_KV`）で、未設定時はイベントを破棄して動作を続けます。詳細は [`docs/click-analytics.md`](./docs/click-analytics.md)。

`.env.example` を基準にしてください。`.env` と `.env.*` は `.env.example` を除いて Git 管理対象外です。秘密値をログ、Issue、PRへ記録しないでください。

## SEO / 生成物の基本契約

- Production の通常ページ: `index,follow`
- Preview と 404: `noindex,nofollow`
- `robots.txt` は Production のみクロール許可
- `sitemap.xml` は公開ページのみ列挙
- canonical / Open Graph URL は `PUBLIC_SITE_URL` から生成
- JSON-LD に未確認の価格、評価、レビュー数、在庫を含めない

## 依存関係

`pnpm-lock.yaml` と `pnpm install --frozen-lockfile` を正規の再現可能インストール経路とします。依存更新は専用PRで検証し、自動マージしません。

pnpm の install script は原則無効で、`pnpm-workspace.yaml` の `onlyBuiltDependencies` に明示した依存だけを許可します。許可対象追加時は用途とサプライチェーン影響をレビューしてください。

Cloudflare Pages へのデプロイ（`tools/production/Invoke-ProductionBuildAndDeploy.ps1`、`.github/workflows/deploy-production.yml`）は `pnpm exec wrangler` を使うため、wrangler を devDependencies に固定しています。グローバルインストールは不要です。workerd（wrangler のローカル実行ランタイム）は `onlyBuiltDependencies` で install script を許可しています。

## CI / デプロイ

GitHub Actions は Preview 向け `pnpm verify` に加え、秘密値を使わないテスト用 HTTPS URL で Production 設定と生成HTMLを検証します。CIだけで Production traffic は変更しません。

Cloudflare の正規ビルド経路:

```text
Build:  pnpm build（DEPLOYMENT_ENV=production）
Deploy: pnpm exec wrangler deploy --config wrangler.jsonc
Assets: dist
Config: wrangler.jsonc
```

Production反映は PR マージとは別工程で、`.github/workflows/deploy-production.yml` の workflow_dispatch（対象コミットSHAを明示）か、`tools/production/Invoke-ProductionBuildAndDeploy.ps1` で行います。

## 現在の作業管理

README には変動しやすい記事数、PR番号、dependency更新状態を固定しません。最新の実装優先度、UI/UX改善、公開ゲートは GitHub Issues / Pull Requests を正としてください。

## 本番運用

このプロジェクトはGit ProviderなしのDirect Upload運用です。GitHubでマージしても本番へ自動反映されるとは限りません。本番反映は `.github/workflows/deploy-production.yml` の workflow_dispatch（`expected_sha` と `confirm: DEPLOY` を入力）か、次の手動コマンドで行います。

- Build: `set -a && source .env && set +a && DEPLOYMENT_ENV=production pnpm build`
- Deploy: `pnpm exec wrangler deploy --config wrangler.jsonc`
- 確認: `npx wrangler deployments list --config wrangler.jsonc`
- Cloudflare デプロイラベル: `main`（`tools/production/Invoke-ProductionBuildAndDeploy.ps1` の `--branch=main` で指定。GitHub default branch名 `feat/affiliate-site-foundation` とは異なる）
- 本番URL: `https://kuraberu-products.pages.dev`

デプロイ後はDeployment一覧でEnvironmentがProduction、Branchがmain、Sourceが対象コミットであることを確認し、トップ・記事一覧・全記事詳細のHTTPステータスと生成HTMLを検証します。詳細な新規記事・既存記事・UI改善の管理基準は [`docs/site-management.md`](./docs/site-management.md) を参照してください。

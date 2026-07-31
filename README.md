# くらべる商品メモ

Astro + TypeScript の静的な楽天アフィリエイト商品紹介・比較サイトです。最初の記事は育児用品ですが、サイト全体はカテゴリを限定しません。確認できない数値や体験談は掲載しません。

開発・レビュー規約は [CONTRIBUTING.md](./CONTRIBUTING.md)、AIエージェントと並行作業の安全規約は [AGENTS.md](./AGENTS.md) を参照してください。

## ローカル

Node.jsは `^20.19.1` または `>=22.12.0` が必要です。標準の開発・CI環境は `.node-version` に記載したNode 24、パッケージマネージャーはpnpm 10.11.1です。

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

検証は `pnpm verify` です。format、lint、typecheck、環境・コンテンツ検証、build、生成HTML・デプロイ契約・外部URL構文検査、Vitestを実行します。

`check:external-link-syntax` はURLの構文、HTTPS、危険なスキーム、placeholderを検査します。外部サイトへHTTPリクエストを送る到達性検査ではありません。

## 環境変数

`DEPLOYMENT_ENV` は `development` / `preview` / `production` のいずれかです。未設定時は `preview` です。

Productionでは次が必須です。

- `PUBLIC_SITE_URL`: query、fragment、資格情報、サブパスを含まないHTTPSのサイトルート
- 購入リンクは次のどちらか
  - `PUBLIC_RAKUTEN_PREMIUM_URL` と `PUBLIC_RAKUTEN_SARASARA_URL` の両方
  - `RAKUTEN_APPLICATION_ID`、`RAKUTEN_ACCESS_KEY`、`RAKUTEN_AFFILIATE_ID` の3件すべて

直接購入URLとAPIレスポンス由来URLは、HTTPSの楽天公式ホストだけを許可します。直接URLが設定されている商品では直接URLを優先し、未設定の商品だけAPI補完を試みます。APIは5秒でタイムアウトし、失敗時は購入リンクを「準備中」として静的ビルドを続行します。

次は任意です。

- `PUBLIC_CONTACT_URL`: aboutページの問い合わせ先HTTPS URL。未設定時は「準備中」表示

`.env.example` をコピーして使用してください。`.env` と `.env.*` は `.env.example` を除いてGit管理対象外です。秘密値をログ、Issue、PR、証跡へ記載しないでください。

## 検索・共有メタデータ

- Productionの通常ページ: `index,follow`
- Previewと404ページ: `noindex,nofollow`
- `robots.txt` はProductionのみクロールを許可
- `sitemap.xml` は公開ページのみを列挙し、404を含めない
- canonicalとOpen Graph URLは `PUBLIC_SITE_URL` から生成

## CI

GitHub ActionsはPreviewの `pnpm verify` に加え、秘密値を使わないテスト用HTTPS URLでProduction設定と生成HTMLを検証します。CIはデプロイやProduction traffic変更を行いません。

branch protectionの必須チェック設定はリポジトリ設定で別途有効化し、失敗中のマージを禁止してください。

## Cloudflare Workers Builds

正規のGit連携経路はCloudflare Workers Buildsです。

- Build command: `pnpm build`
- Deploy command: `npx wrangler versions upload`
- Static assets directory: `dist`
- Wrangler config: `wrangler.jsonc`
- Node.js: `.node-version` と同じメジャーバージョン

PR buildはVersion uploadまで行い、Production trafficへは流しません。Production反映時はCloudflare Dashboardまたは `wrangler versions deploy` で対象Versionを明示的にデプロイし、Deployment IDと公開受入結果を記録します。

旧Cloudflare Pagesの直接アップロード経路が残っている場合は、Issue #4で整理します。

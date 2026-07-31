# くらべる商品メモ

Astro + TypeScript の静的な楽天アフィリエイト商品紹介・比較サイトです。最初の記事は育児用品ですが、サイト全体はカテゴリを限定しません。確認できない数値や体験談は掲載しません。

## ローカル

Node.js 20以上とpnpmを使用します。

```bash
pnpm install --frozen-lockfile
pnpm dev
```

検証は `pnpm verify` です。format、lint、typecheck、環境・コンテンツ検証、build、生成HTML・リンク検査、Vitestを実行します。

## 環境変数

Previewは `DEPLOYMENT_ENV=preview`、Productionは `DEPLOYMENT_ENV=production` を設定します。Productionでは次の変数が必須です。

- `PUBLIC_SITE_URL`
- `PUBLIC_RAKUTEN_PREMIUM_URL`
- `PUBLIC_RAKUTEN_SARASARA_URL`

次の変数は任意です（未設定時はaboutページが「準備中」表示にフォールバックします）。

- `PUBLIC_CONTACT_URL`

楽天APIから購入リンクを補完する場合は次も設定します。

- `RAKUTEN_APPLICATION_ID`
- `RAKUTEN_ACCESS_KEY`
- `RAKUTEN_AFFILIATE_ID`

## Cloudflare Workers Builds

正規のGit連携経路はCloudflare Workers Buildsです。

- Build command: `pnpm build`
- Deploy command: `npx wrangler versions upload`
- Static assets directory: `dist`
- Wrangler config: `wrangler.jsonc`

PR buildはVersion uploadまで行い、Production trafficへは流しません。Production反映時はCloudflare Dashboardまたは `wrangler versions deploy` で対象Versionを明示的にデプロイし、Deployment IDと公開受入結果を記録します。

旧Cloudflare Pagesの直接アップロード経路が残っている場合は、Issue #4で整理します。

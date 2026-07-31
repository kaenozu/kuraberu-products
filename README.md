# くらべる商品メモ

Astro + TypeScript の静的な楽天アフィリエイト商品紹介・比較サイトです。最初の記事は育児用品ですが、サイト全体はカテゴリを限定しません。口コミは原文リンクを残し、未確認の数値や体験談は掲載しません。

## ローカル

Node.js 20 以上を推奨します。

```bash
npm install
npm run dev
```

検証は `npm run verify`（format check / lint / typecheck / content validation / test / build）です。楽天連携は `rakuten-x-automation` と同じ `RAKUTEN_APPLICATION_ID`、`RAKUTEN_ACCESS_KEY`、`RAKUTEN_AFFILIATE_ID` を利用します。未設定時はAPI検索を行わず、CTAを無効表示します。

## Cloudflare Pages

Cloudflare Pagesで新規プロジェクトを作成し、GitHubリポジトリを接続します。Build command は `npm run build`、Output directory は `dist`。Node.js 20以上を指定し、`PUBLIC_SITE_URL` と楽天URLを環境変数に設定してください。`pages.dev` URLを楽天アフィリエイトの利用サイトとして登録します。独自ドメインは収益確認後で構いません。Cloudflare認証がある場合のみPreview deploymentを実行してください。

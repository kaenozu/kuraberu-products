# くらべる商品メモ

Astro + TypeScript で構築した、日本向けの2商品比較サイトです。カテゴリは限定せず、比較の根拠は確認できる公式情報を優先します。

## 編集方針

- 確認できない数値、価格、在庫、体験談を事実として書かない
- 比較結論と購入導線を分離し、アフィリエイト条件を比較結果へ影響させない
- メーカー公式情報を比較の一次根拠とする
- SNS等の感想を扱う場合も、比較根拠とは分離して参考情報として示す
- 記事ごとに検証日・出典・変更履歴を管理する

開発・レビュー規約は [CONTRIBUTING.md](./CONTRIBUTING.md)、AIエージェントと並行作業の安全規約は [AGENTS.md](./AGENTS.md) を参照してください。

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
  - 商品別の `PUBLIC_RAKUTEN_*_URL`
  - `RAKUTEN_APPLICATION_ID` / `RAKUTEN_ACCESS_KEY` / `RAKUTEN_AFFILIATE_ID`

購入URLは HTTPS の許可済み楽天ホストだけを受け付けます。API取得に失敗した場合は、未確認値を補完せず「準備中」として静的ビルドを継続します。

任意:

- `PUBLIC_CONTACT_URL`: 問い合わせ先 HTTPS URL

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

## CI / デプロイ

GitHub Actions は Preview 向け `pnpm verify` に加え、秘密値を使わないテスト用 HTTPS URL で Production 設定と生成HTMLを検証します。CIだけで Production traffic は変更しません。

Cloudflare の正規ビルド経路:

```text
Build:  pnpm build
Deploy: npx wrangler versions upload
Assets: dist
Config: wrangler.jsonc
```

PRはVersion uploadまでに留め、Production反映は対象Versionを明示して別途行います。

## 現在の作業管理

README には変動しやすい記事数、PR番号、dependency更新状態を固定しません。最新の実装優先度、UI/UX改善、公開ゲートは GitHub Issues / Pull Requests を正としてください。

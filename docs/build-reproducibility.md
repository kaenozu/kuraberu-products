# ビルド再現性と楽天購入リンク

## 結論

同じ Git commit だけでは、楽天 API を使うビルドの生成物は完全には同一になりません。`AffiliateButton.astro` は、商品クエリが登録されている場合にビルド時の API 応答から購入 URL を解決します。API の応答、掲載状態、タイムアウトは外部状態で変化するためです。

再現可能な Production ビルドを作る場合は、次のいずれかを選び、ビルド記録に残します。

- **推奨（固定入力）**: 商品ごとの検証済み URL を `PUBLIC_RAKUTEN_*_URL` として注入する。API の応答を生成物の入力にしない。
- **API 連携（可変入力）**: `RAKUTEN_APPLICATION_ID`、`RAKUTEN_ACCESS_KEY`、`RAKUTEN_AFFILIATE_ID` を注入し、API 応答日時・対象 commit・生成物の SHA-256 をリリース証跡へ記録する。同じ commit の再ビルドでも URL が変わり得るため、「完全再現可能」とは扱わない。

秘密値は `.env`、CI secret、Cloudflare secret から注入し、ログ・Issue・PR・生成物へ出力しません。

## 固定入力での標準手順

```sh
pnpm install --frozen-lockfile
DEPLOYMENT_ENV=production \
PUBLIC_SITE_URL=https://example.invalid \
PUBLIC_RAKUTEN_PREMIUM_URL=https://example.invalid/premium \
PUBLIC_RAKUTEN_SARASARA_URL=https://example.invalid/sarasara \
PUBLIC_BUILD_SHA="$(git rev-parse HEAD)" \
pnpm build
sha256sum dist/index.html
```

実運用では `example.invalid` を使用せず、許可済み HTTPS の楽天 URLを設定します。`PUBLIC_BUILD_SHA` は配信HTMLの `meta[name=build-sha]` と照合するための値であり、URLの固定やAPI応答の固定を意味しません。

## API 取得時の失敗契約

API 取得に失敗した場合、未確認値を補完しないことが契約です。購入リンクは「準備中」または安全な直接URLへフォールバックし、ビルド自体を成功させる場合があります。したがって、Production の公開判定ではビルド成功だけでなく、生成HTMLに期待する CTA が存在することを確認します。

- API 失敗を成功した商品検索として記録しない
- 未確認の価格・在庫・商品 URLを生成しない
- CTA が準備中になった場合は、Production 成功扱いにしない
- API 取得を使ったリリースは、取得日時・対象 commit・生成物 SHA-256 を保存する

## 証跡の最低項目

| 項目             | 内容                                                       |
| ---------------- | ---------------------------------------------------------- |
| source commit    | `git rev-parse HEAD` の完全 SHA                            |
| dependency input | `pnpm-lock.yaml` と `pnpm install --frozen-lockfile`       |
| build mode       | 固定 URL または API 取得                                   |
| API input        | API 利用時のみ、秘密値ではなく取得日時・対象商品・結果件数 |
| generated output | `dist` の SHA-256 または保存済み deployment artifact       |
| public check     | `PUBLIC_BUILD_SHA` と配信HTMLの値、代表 CTA の有無         |

## 関連コマンド

- `pnpm verify`: format、lint、型、コンテンツ、単体テスト、生成HTMLを検証
- `pnpm build`: `DEPLOYMENT_ENV=production` で本番生成物を作成
- `pnpm check:deployment`: 生成HTMLの公開設定と build SHA を検証

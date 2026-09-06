# セキュリティヘッダ方針

`public/_headers` で配信しているセキュリティ関連 HTTP ヘッダの意図と、トレードオフをまとめる。  
`scripts/check-deployment-html.mjs` が Production 配信時のヘッダ契約を機械検証する。

最終更新: 2026-09-02

## 配信ヘッダ一覧

| ヘッダ                      | 値                                         | 目的                                        |
| --------------------------- | ------------------------------------------ | ------------------------------------------- |
| `Content-Security-Policy`   | (下記参照)                                 | XSS / データ注入 / クリックジャッキング対策 |
| `X-Content-Type-Options`    | `nosniff`                                  | MIME スニッフィング拒否                     |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains`      | HTTPS 強制 (1年)                            |
| `Referrer-Policy`           | `strict-origin-when-cross-origin`          | Referer 情報の最小化                        |
| `Permissions-Policy`        | `camera=(), microphone=(), geolocation=()` | センサー API の無効化                       |

## Content-Security-Policy のディレクティブ別意図

```
default-src 'self';
base-uri 'self';
object-src 'none';
frame-ancestors 'none';
script-src 'self'
  https://platform.twitter.com
  https://assets.pinterest.com
  https://widgets.pinterest.com;
frame-src
  https://platform.twitter.com
  https://assets.pinterest.com
  https://www.youtube-nocookie.com
  https://www.tiktok.com;
connect-src 'self'
  https://platform.twitter.com
  https://cdn.syndication.twimg.com
  https://api.twitter.com
  https://assets.pinterest.com;
img-src 'self' data:
  https://pbs.twimg.com https://abs.twimg.com
  https://i.pinimg.com
  https://*.image.rakuten.co.jp;
style-src 'self' 'unsafe-inline';
font-src 'self' data:;
media-src 'self'
  https://www.youtube-nocookie.com
  https://www.tiktok.com;
form-action 'self';
```

### 設計判断

- **`default-src 'self'`**: すべて自オリジンに限定。XSS の被害を最小化。
- **`object-src 'none'`**: Flash / Java アプレット等のレガシー埋め込みを全面禁止。
- **`frame-ancestors 'none'`**: クリックジャッキング防止 (X-Frame-Options の後継)。
- **`form-action 'self'`**: フォーム送信先を自サイトに限定 (CSRF 対策の補助)。
- **`script-src 'self'` + 限定ホストのみ**: インライン禁止。Twitter / Pinterest の公式 widget のみ例外許可。
- **`script-src` に `'unsafe-inline'` / `'unsafe-eval'` を付けない**: コードインジェクション耐性を最大化。
- **`style-src 'self' 'unsafe-inline'`**: Astro が生成するインライン `<style>` ブロック (スコープ付き CSS) のため `unsafe-inline` を許容。
  - これは Astro のデフォルト動作。nonce / hash ベースへの移行は未着手 (Issue 検討中)。
  - `script-src` には `'unsafe-inline'` を付けないため、XSS 耐性は維持されている。
- **`frame-src` で embed ホストを限定**: 外部 embed (X / Pinterest / YouTube nocookie / TikTok) のみ iframe 許可。
  - `youtube-nocookie.com` を使うことで privacy-enhanced モードに統一。
- **`connect-src`**: XSS された場合の fetch / XHR 送信先を自サイトと公式 widget API のみに限定。
- **`img-src`**: 自サイトに加え Twitter / Pinterest / 楽天商品画像 CDN のみ許可。
  - 楽天商品画像は `https://*.image.rakuten.co.jp` のワイルドカードで子ドメインを包含。

## トレードオフと既知の制限

1. **`style-src 'unsafe-inline'`**
   - 影響: CSS インジェクション (XSS と組み合わせた視覚的な攻撃) が可能
   - 緩和: `script-src` に `'unsafe-inline'` を付けないため、JS 経由の CSS 注入は不可
   - 移行案: Astro のスコープ付き CSS は nonce 化可能。将来的な改善項目。

2. **インラインスクリプト**
   - 現状: `BaseLayout.astro` に `<script is:inline src="...">` が複数
   - 影響: CSP の `script-src` で `'self'` のみ許可しているため、外部スクリプトは明示的に列挙した widget 以外読み込めない

3. **frame-src のホワイトリスト**
   - 新規 embed サービスを追加する場合は `frame-src` / `connect-src` / `img-src` を同時に更新する
   - `docs/external-embed-policy.md` と整合させる

4. **Permissions-Policy**
   - camera / microphone / geolocation を無効化
   - 将来的に他センサー (payment, usb 等) を追加する場合は同様に列挙

## 検証

- `pnpm check:deployment` で `public/_headers` を読み込み、Production デプロイ後の HTML に対するヘッダ付与を機械検証
  - `default-src`, `script-src`, `frame-src`, `connect-src`, `img-src`, `style-src` の存在チェック
  - `script-src` に `*` / `unsafe-eval` が**ない**ことを確認
- `pnpm check:rendered` で生成 HTML に `platform.twitter.com` 等の embed 参照と CSP のホワイトリストが一致していることを確認

## 変更手順

CSP を変更する場合は次の順で行う:

1. `public/_headers` を編集
2. 影響を受ける embed の host を `docs/external-embed-policy.md` に記載
3. ローカルで `pnpm check:deployment` / `pnpm check:rendered` を通す
4. Preview デプロイでブラウザ DevTools の CSP violation レポートを確認
5. PR レビューで embed 利用部署と合意

## 関連Issue

- Issue #552: 本ドキュメント整備
- Issue #550: `/api/rakuten-perf` POST 認証
- Issue #551: 副作用 API の Origin 厳格化

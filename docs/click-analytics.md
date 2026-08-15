# クリック計測（プライバシー配慮型）

購入CTA（`data-cta-event` 付きリンク）のクリックを、**第三者サービスを使わず**、
同じサイトの Cloudflare Pages Function で受け取る自己完結型の計測。

## プライバシー設計

- 保存するのは **イベント種別 / 商品ID / 配置（placement）/ ページパス / 時刻** のみ
- Cookie・フィンガープリント・**IP アドレスは収集・保存しない**
  （IP はレート制限の判定に一時使用するだけ）
- 通信はすべて同一オリジン（`/api/events`）。第三者ドメインへは送信しない
- CSP は既存の `script-src 'self'` / `connect-src 'self'` でそのまま通る（変更不要）

## 構成

- **クライアント**: `public/click-beacon.js`（classic スクリプト）
  - `BaseLayout.astro` が `<script src="/click-beacon.js" defer>` で読み込む
    （同一オリジンのファイルとして配信されるため厳格 CSP でも許可される。
    Astro のバンドル script は小さいと `<script type="module">` にインライン化され
    CSP でブロックされるため、あえて public 配信にしている）
  - `navigator.sendBeacon('/api/events', Blob)`、不可なら `fetch(..., {keepalive: true})`
  - `[data-cta-event]` を含む要素のクリックを捕捉し、`event / productId / placement / path` を送信
  - 計測失敗は黙って無視（ユーザー体験に影響させない）
- **受信口**: `functions/api/events.ts`（POST `/api/events`）
  - サイズ上限 4KB、JSON 検証
  - イベント名・placement は `config/article-layout.mjs` の許可リストで検証
    （レイアウト契約と同一の情報源から導出）
  - 同一IP 1分あたり60件のレート制限（`ANALYTICS_RATE_LIMITER`、fail-open）
  - 保存先は任意の `ANALYTICS_KV`（Workers KV）。未設定・障害時はイベントを破棄して 204 を返す

## 保存形式（KV 有効時）

- キー: `v1:events:YYYY-MM-DD:<uuid>`（日別・追記型で読み書き競合なし）
- 値: `{"event", "productId", "placement", "path", "at"}`（IP・ユーザー識別子は含まない）
- TTL: 90日。集計は外部のダッシュボードやスクリプトで行う

## KV の有効化手順（任意）

1. `pnpm exec wrangler kv namespace create kuraberu-events` で namespace を作成し id を控える
2. `wrangler.jsonc` のコメントアウトされた `kv_namespaces` を有効化して id を設定する
3. デプロイ後、`/api/events` が KV に書き込む

未設定のままでもサイトと計測の送信側は動作し続ける（保存だけが行われない）。

# 新規比較記事リサーチ台帳

新規記事は、この記事台帳を埋めてからseedを追加する。検索結果の断片、推測URL、既存商品のURL流用は証跡として認めない。

## 1. 記事候補

- slug:
- title:
- category:
- left product:
- right product:
- duplicate check:
  - slug/route search:
  - left model reuse:
  - right model reuse:
- adoption: `候補` / `保留` / `採用`
- research date (JST):

## 2. 公式商品証跡

| 項目                                  | 左商品 | 右商品 |
| ------------------------------------- | ------ | ------ |
| メーカー公式個別URL                   |        |        |
| HTTP status / final URL               |        |        |
| 公式ページ表示名                      |        |        |
| 型番・品番                            |        |        |
| 公式ページ内の仕様表                  |        |        |
| 共通比較項目1（原文）                 |        |        |
| 共通比較項目2（原文）                 |        |        |
| 製品ごとの差分（原文）                |        |        |
| 公式画像URL                           |        |        |
| 画像HTTP status / Content-Type / byte |        |        |
| 公式画像を`public/products/`へ保存    |        |        |

公式ページが型番、仕様、画像のいずれかを直接確認できない場合は `確認不可` と記録し、採用しない。後継機・海外モデル・シリーズ一覧の値を転用しない。

## 3. 楽天導線証跡

| 項目                                  | 左商品 | 右商品 |
| ------------------------------------- | ------ | ------ |
| 楽天市場の商品詳細URL                 |        |        |
| 商品名・型番一致                      |        |        |
| 商品ページのショップ                  |        |        |
| 楽天商品ページHTTP status / final URL |        |        |
| 楽天公式アフィリエイトUI入力URL       |        |        |
| UI表示の商品名                        |        |        |
| UI表示のショップ                      |        |        |
| UI生成の完全成果URL                   |        |        |
| 成果URLの外側ホスト                   |        |        |
| リダイレクト先                        |        |        |
| リダイレクト先HTTP status             |        |        |
| `rel="nofollow sponsored noopener"`   |        |        |

ショップ不一致、検索結果URL、最終遷移先を特定できない短縮URL、既存URLの流用は `unverified` とし、CTAを表示しない。

## 4. 実装チェック

- [ ] `CommercialArticleSeed`へ商品名・公式URL・確認日・仕様を追加
- [ ] `articlePurchaseLinks`へ左右の商品詳細成果URLを追加
- [ ] CTAに商品画像を含めた
- [ ] 未確認商品はfail-closedでCTA非表示
- [ ] `articleMetadata` / canonical / sitemap / 一覧へ反映
- [ ] 価格・在庫・人気・口コミを公式根拠なしに記載していない
- [ ] SNS情報を比較根拠にしていない

## 5. 検証と公開

```bash
pnpm test
PUBLIC_BUILD_SHA=$(git rev-parse HEAD) pnpm verify
```

- [ ] 生成HTMLで左右の商品名・型番・公式リンク・画像を確認
- [ ] 生成HTMLで成果URLのホスト、`sponsored`、広告表示、計測属性を確認
- [ ] 全外部リンクの最終URLとHTTP statusを確認
- [ ] 専用PRのexact-head CIが全PASS
- [ ] merge SHAを確認
- [ ] Production deploymentが`main`かつmerge SHAと一致
- [ ] Productionの対象記事、sitemap、画像、JSON-LD、CTA DOMをcache-buster付きで確認

## 6. 残件

確認できなかった項目、停止理由、再調査URL、再開条件を列挙する。残件がある場合、記事を「最新化済み」や「公開完了」と報告しない。

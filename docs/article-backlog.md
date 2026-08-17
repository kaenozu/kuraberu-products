# 記事バックログ

「くらべて、選ぶ。」の比較記事を、公式情報で裏取りできる比較軸と記事の重複を見ながら管理する。

## 選定基準

1. 公式商品ページ・公式Q&Aで比較軸を裏取りできる
2. 2つの対象を同じ観点で比較できる
3. 読者の選択に影響する差分がある
4. 体験談・口コミを比較の根拠にせず、公式情報中心で構成できる
5. 既存記事と検索意図・対象商品が過度に重複しない

## 現在の公開済み（33本）

| slug                                             | 状態     |
| ------------------------------------------------ | -------- |
| `babybjorn`                                      | 公開済み |
| `babybjorn-bouncer`                              | 公開済み |
| `babybjorn-cradle`                               | 公開済み |
| `babybjorn-onekai`                               | 公開済み |
| `babybjorn-potty`                                | 公開済み |
| `combi-the-s-plus-vs-premium`                    | 公開済み |
| `kingjim-tepra-sr-r2500p-vs-sr-mk1`              | 公開済み |
| `merries-newborn`                                | 公開済み |
| `merries-pants`                                  | 公開済み |
| `moony-m`                                        | 公開済み |
| `pampers-newborn`                                | 公開済み |
| `panasonic-baby-monitor-kx-hc705`                | 公開済み |
| `panasonic-eh-na9m-vs-eh-na7m`                   | 公開済み |
| `panasonic-eh-ne7m-vs-eh-ne5m`                   | 公開済み |
| `panasonic-f-yhvx120-vs-f-yhvx90`                | 公開済み |
| `panasonic-mc-sb55k-vs-mc-sb35k`                 | 公開済み |
| `panasonic-ne-fl1a-vs-ne-fl1c`                   | 公開済み |
| `pigeon-bottle-160-240`                          | 公開済み |
| `pigeon-bottle-240`                              | 公開済み |
| `pigeon-slim-240`                                | 公開済み |
| `sharp-kc-s50-vs-fu-s50`                         | 公開済み |
| `shupot`                                         | 公開済み |
| `tefal-dv4030j0-vs-dv8070j0`                     | 公開済み |
| `tefal-ko5901jp-vs-ko8601j0`                     | 公開済み |
| `thermos-kfm-020-vs-kfi-020`                     | 公開済み |
| `thermos-tiger-bottle`                           | 公開済み |
| `tiger-mta-j050-guide`                           | 公開済み |
| `tiger-jpv-l100-vs-jpv-m100`                     | 公開済み |
| `yamazaki-condor-wagon-vs-self-wagon`            | 公開済み |
| `yamazaki-dust-wagon-45l-2division-vs-3division` | 公開済み |
| `yamazaki-free-broom-32-vs-45`                   | 公開済み |
| `yamazaki-tower-desk-panel-vs-pen-stand`         | 公開済み |
| `zojirushi-ck-pa08-vs-ck-dc08`                   | 公開済み |

記事の公開日・変更日・公式確認日は `src/content/articles.ts` を正本とする。ここには履歴やPR番号を重複して持たせない。

## 次の候補

### 日立 BD-SX130K vs BD-STX130K（実装済み・PR作成待ち）

- 記事slug: `hitachi-bd-sx130k-vs-bd-stx130k`
- 状態: 専用worktreeで実装。preview verify PASS。PR作成待ち。
- 比較軸: 洗濯・乾燥容量、操作パネル、温水、シワ伸ばし、乾燥方式、質量。
- 公式ページ: [BD-SX130K](https://kadenfan.hitachi.co.jp/wash/lineup/bd-sx130k/) / [BD-STX130K](https://kadenfan.hitachi.co.jp/wash/lineup/bd-stx130k/)
- 購入導線: 楽天公式UIで画面表示された短縮URL2本を実装済み。

これまで「次の候補」に挙げていたパナソニック衣類乾燥除湿機・ティファール電気ケトル・シャープ空気清浄機・コンビチャイルドシートはすべて公開済みです。次は非育児カテゴリ（生活雑貨・デスク用品・キッチン家電など）から、公式ページで比較軸を裏取りできる2商品ペアを選定する。

### パナソニック NE-FL1A vs NE-FL1C（公開済み）

- 記事slug: `panasonic-ne-fl1a-vs-ne-fl1c`
- 状態: 公開済み。公開後の公式情報・購入リンク更新時に再確認する。
- 公式ページ: [NE-FL1A](https://panasonic.jp/range/products/NE-FL1A.html) / [NE-FL1C](https://panasonic.jp/range/products/NE-FL1C.html)
- 比較軸: 総庫内容量、庫内寸法、本体質量、自動メニュー数。
- 購入導線: 楽天公式UIで画面表示された短縮URL2本を実装済み。
- 公開確認: 記事URL・生成HTML・CTAは定期巡回で確認する。

## 追加確認・保留

### パナソニック ナノケア EH-NA9M vs EH-NA7M（公開済み・購入リンク未検証）

- slug: `panasonic-eh-na9m-vs-eh-na7m`
- 状態: 公開済み。公式商品ページ・仕様ページを確認。購入リンクは未検証。
- 比較軸: 搭載機能、モード、風量、質量、収納性。

### サーモス KFM-020 vs KFI-020（公開済み）

- slug: `thermos-kfm-020-vs-kfi-020`
- 状態: 公開済み。公式ページと楽天公式短縮URLを確認済み。
- 比較軸: 対応熱源、内径、本体寸法、本体重量、メーカー希望小売価格

### アップリカ ラクーナ クッションフリー AF vs プラス AE

- 保留理由: 公式サイトで対象商品ページを安定して確認できない場合は記事化しない。
- 再開条件: 現行公式ページと両モデルの仕様・画像を個別にHTTP確認できること。

## 調査メモ

- チャイルドシート: `C:\Users\neoen\kuraberu-notes\childseat-research-2026-08.md`
- サーモス・タイガー水筒: `C:\Users\neoen\kuraberu-notes\thermos-tiger-research-2026-08.md`
- 記事テンプレート相談: `C:\Users\neoen\kuraberu-notes\chatgpt-consult-2026-08.md`
- SNS参考情報の選定: `C:\Users\neoen\kuraberu-notes\chatgpt-sns-selection-2026-08.md`

## 運用

- 新記事は必ずブランチ → PR → 必須 `pnpm verify` → マージの順で反映する
- 記事化前に公式URLを再取得し、対象商品・型番・比較軸を確認する
- 記事化後は `src/content/articles.ts` とこのバックログの状態を同じ変更で更新する
- 本番デプロイはGitマージとは別工程。Direct Uploadの実体と公開URLを確認してから完了扱いにする
- 価格・在庫・体験談は、確認できないものを推測して掲載しない

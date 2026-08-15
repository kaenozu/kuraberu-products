# 記事バックログ

「くらべて、選ぶ。」の比較記事を、公式情報で裏取りできる比較軸と記事の重複を見ながら管理する。

## 選定基準

1. 公式商品ページ・公式Q&Aで比較軸を裏取りできる
2. 2つの対象を同じ観点で比較できる
3. 読者の選択に影響する差分がある
4. 体験談・口コミを比較の根拠にせず、公式情報中心で構成できる
5. 既存記事と検索意図・対象商品が過度に重複しない

## 現在の公開済み（27本）

| slug                                     | 状態     |
| ---------------------------------------- | -------- |
| `babybjorn`                              | 公開済み |
| `babybjorn-bouncer`                      | 公開済み |
| `babybjorn-cradle`                       | 公開済み |
| `babybjorn-onekai`                       | 公開済み |
| `babybjorn-potty`                        | 公開済み |
| `combi-the-s-plus-vs-premium`            | 公開済み |
| `kingjim-tepra-sr-r2500p-vs-sr-mk1`      | 公開済み |
| `merries-newborn`                        | 公開済み |
| `merries-pants`                          | 公開済み |
| `moony-m`                                | 公開済み |
| `pampers-newborn`                        | 公開済み |
| `panasonic-baby-monitor-kx-hc705`        | 公開済み |
| `panasonic-eh-ne7m-vs-eh-ne5m`           | 公開済み |
| `panasonic-f-yhvx120-vs-f-yhvx90`        | 公開済み |
| `panasonic-mc-sb55k-vs-mc-sb35k`         | 公開済み |
| `pigeon-bottle-160-240`                  | 公開済み |
| `pigeon-bottle-240`                      | 公開済み |
| `pigeon-slim-240`                        | 公開済み |
| `sharp-kc-s50-vs-fu-s50`                 | 公開済み |
| `shupot`                                 | 公開済み |
| `tefal-dv4030j0-vs-dv8070j0`             | 公開済み |
| `tefal-ko5901jp-vs-ko8601j0`             | 公開済み |
| `thermos-tiger-bottle`                   | 公開済み |
| `tiger-jpv-l100-vs-jpv-m100`             | 公開済み |
| `yamazaki-condor-wagon-vs-self-wagon`    | 公開済み |
| `yamazaki-tower-desk-panel-vs-pen-stand` | 公開済み |
| `zojirushi-ck-pa08-vs-ck-dc08`           | 公開済み |

記事の公開日・変更日・公式確認日は `src/content/articles.ts` を正本とする。ここには履歴やPR番号を重複して持たせない。

## 次の候補

これまで「次の候補」に挙げていたパナソニック衣類乾燥除湿機・ティファール電気ケトル・シャープ空気清浄機・コンビチャイルドシートはすべて公開済みです。次は非育児カテゴリ（生活雑貨・デスク用品・キッチン家電など）から、公式ページで比較軸を裏取りできる2商品ペアを選定する。

## 保留

### サーモス KFM-020 vs KFI-020

- slug: `thermos-kfm-020-vs-kfi-020`
- 状態: 実装・検証中。公式ページと楽天公式短縮URLを確認済み。
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

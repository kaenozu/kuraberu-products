# 記事バックログ

「くらべて、選ぶ。」の比較記事を、公式情報で裏取りできる比較軸と記事の重複を見ながら管理する。

## 選定基準

1. 公式商品ページ・公式 Q&A で比較軸を裏取りできる
2. 2つの対象を同じ観点で比較できる
3. 読者の選択に影響する差分がある
4. 体験談・口コミを比較の根拠にせず、公式情報中心で構成できる
5. 既存記事と検索意図・対象商品が過度に重複しない

## 実装済み

### シャープ KC-S50 vs FU-S50

- slug: `sharp-kc-s50-vs-fu-s50`
- 公式URL: https://jp.sharp/kuusei/products/kcs50/ / https://jp.sharp/kuusei/products/fus50/
- 比較軸: 加湿機能・最大加湿量、外形寸法、重量、適用畳数、運転音、ニオイセンサー
- 状態: 記事実装済み。公式仕様確認日 2026-08-13。価格・SNSは未確認。

## 公開済み（14本）

| 記事群                                | slug                                     | 状態     |
| ------------------------------------- | ---------------------------------------- | -------- |
| パンパース新生児用                    | `pampers-newborn`                        | 公開済み |
| メリーズ新生児用                      | `merries-newborn`                        | 公開済み |
| ピジョン母乳実感240ml（素材）         | `pigeon-bottle-240`                      | 公開済み |
| ピジョン母乳実感240ml vs スリムタイプ | `pigeon-slim-240`                        | 公開済み |
| ムーニーM                             | `moony-m`                                | 公開済み |
| メリーズパンツ                        | `merries-pants`                          | 公開済み |
| ピジョン母乳実感160ml vs 240ml        | `pigeon-bottle-160-240`                  | 公開済み |
| ピジョン電動 vs 手動鼻吸い器          | `shupot`                                 | 公開済み |
| ベビービョルン抱っこひも              | `babybjorn`                              | 公開済み |
| ベビービョルン ONE KAI vs MOVE        | `babybjorn-onekai`                       | 公開済み |
| ベビービョルン バウンサー             | `babybjorn-bouncer`                      | 公開済み |
| ベビービョルン クレードル系           | `babybjorn-cradle`                       | 公開済み |
| ベビービョルン おまる                 | `babybjorn-potty`                        | 公開済み |
| サーモス vs タイガー水筒              | `thermos-tiger-bottle`                   | 公開済み |
| 山崎実業 tower デスク収納             | `yamazaki-tower-desk-panel-vs-pen-stand` | 実装済み |

記事の公開日・変更日・公式確認日は `src/content/articles.ts` を正本とする。ここには履歴やPR番号を重複して持たせない。

## 公開準備済み・追加候補

### ティファール ジャスティン ロック vs アプレシア ロック コントロール

- slug: `tefal-ko5901jp-vs-ko8601j0`
- 比較軸: 容量、本体重量、温度調節、保温、タッチパネル、給湯ロック、自動電源オフ、空焚き防止、定格消費電力
- 状態: 記事化済み。ティファール公式商品ページを2026-08-13に再確認

## 次の候補

### 1. チャイルドシート: コンビ THE S plus vs THE S premium

- slug: `combi-the-s-plus-vs-premium`
- 調査メモ: `C:\Users\neoen\kuraberu-notes\childseat-research-2026-08.md`
- 比較軸: 使用期間、身長基準、回転・乗せ降ろし機構、付属品、価格帯
- 採用理由: 同シリーズ内の上位差分を公式情報で説明しやすい
- 状態: 記事化済み。公式商品ページを2026-08-12に再確認

### 2. チャイルドシート: アップリカ クルリラ プラス ライト vs プライト

- 調査メモ: `C:\Users\neoen\kuraberu-notes\childseat-research-2026-08.md`
- 比較軸: 対象身長・使用期間、後向き使用、回転・固定方式、付属品、価格帯
- 採用理由: 同時期の入門・上位モデルとして比較軸を作りやすい
- 状態: 公式情報の追加確認後に記事化候補

## 保留

### アップリカ ラクーナ クッションフリー AF vs プラス AE

- 保留理由: 2026-08-11確認時点で、アップリカ公式サイトに対象商品ページを安定して確認できなかった
- 再開条件: 現行公式ページと両モデルの仕様を確認できること
- 代替候補: 上記チャイルドシート2組

## 調査メモ

- チャイルドシート: `C:\Users\neoen\kuraberu-notes\childseat-research-2026-08.md`
- サーモス・タイガー水筒: `C:\Users\neoen\kuraberu-notes\thermos-tiger-research-2026-08.md`（記事化済み）
- 記事テンプレート相談: `C:\Users\neoen\kuraberu-notes\chatgpt-consult-2026-08.md`
- SNS参考情報の選定: `C:\Users\neoen\kuraberu-notes\chatgpt-sns-selection-2026-08.md`

## 運用

- 新記事は必ずブランチ → PR → 必須 `pnpm verify` → マージの順で反映する
- 記事化前に公式URLを再取得し、対象商品・型番・比較軸を確認する
- 記事化後は `src/content/articles.ts` とこのバックログの状態を同じ変更で更新する
- 本番デプロイはGitマージとは別工程。Direct Uploadの実体と公開URLを確認してから完了扱いにする
- 価格・在庫・体験談は、確認できないものを推測して掲載しない

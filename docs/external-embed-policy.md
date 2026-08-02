# 外部投稿・動画の埋め込み方針

確認日: 2026-07-31
対象: Issue #15

## 結論

外部投稿は記事の主たる根拠にせず、購入品レビューやメーカー一次情報を補足する用途に限る。初期表示では第三者サービスへ接続せず、読者が「投稿を表示」を選んだ後にのみ公式プレーヤーまたは公式ウィジェットを読み込む。

Phase 1では、URLから安全に公式表示へ変換でき、任意HTMLを保存せずに実装できるサービスだけを採用する。

| サービス  | 判定   | Phase 1の方式                    | 主な理由                                                                                                               |
| --------- | ------ | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| X         | 採用   | 公開ポストURL＋公式widgets.js    | 公式の埋め込み手順があり、公開ポストに限定できる                                                                       |
| YouTube   | 採用   | youtube-nocookie.comの公式iframe | プライバシー強化モードを利用できる                                                                                     |
| TikTok    | 採用   | 公式Embed Player iframe          | 投稿IDから公式プレーヤーURLを生成できる                                                                                |
| Pinterest | 採用   | 公開Pin URL＋公式pinit.js        | Pinウィジェットが公式提供されている                                                                                    |
| Instagram | 保留   | 外部リンクのみ                   | oEmbed/API権限、生成コード、削除時挙動を実投稿で再確認してから導入する                                                 |
| Threads   | 保留   | 外部リンクのみ                   | oEmbedのアクセス条件と対応アカウント範囲を実装時に再確認する必要がある                                                 |
| Reddit    | 保留   | 外部リンクのみ                   | 公式埋め込みは存在するが、日本向け商品記事での優先度が低く、遅延挿入後の複数ウィジェット再処理を追加検証する必要がある |
| Facebook  | 対象外 | 外部リンクのみ                   | 現在の記事用途に対する必要性が低い                                                                                     |

保留サービスは「利用禁止」ではない。具体的な投稿を記事へ載せる必要が生じた時点で、公式仕様とプライバシー影響を再確認し、別PRで許可リストへ追加する。

## 公式情報

- X: https://help.x.com/ja/using-x/how-to-embed-a-post
- YouTube: https://support.google.com/youtube/answer/171780?hl=ja
- TikTok Embedded Videos: https://developers.tiktok.com/doc/embed-videos/
- TikTok Embed Player: https://developers.tiktok.com/doc/embed-player
- Reddit: https://support.reddithelp.com/hc/en-us/articles/360043033532-How-do-I-embed-a-Reddit-post-or-comment-in-an-article-or-other-publication
- Pinterest: https://help.pinterest.com/en/business/article/build-a-website-widget
- Pinterest Developers: https://dev.pinterest.com/docs/web-features/widgets/

公式仕様は変更されるため、サービス追加時と公開前に再確認する。

## コンテンツ運用

- 公開投稿だけを対象にする。
- 投稿URLは記事作成者が内容、投稿者、対象商品、投稿日を目視確認する。
- 自分の購入経験と記事本文を主とし、外部投稿は補足に留める。
- 投稿者が商品、メーカー、当サイトを推薦しているような見出しや配置にしない。
- 医療・健康、安全性、詐欺、違法性など重大な主張の根拠として個人投稿を単独使用しない。
- 子どもの顔、住所、購入履歴など、不要な個人情報を含む投稿は採用しない。
- PR・商品提供・広告投稿は、一般消費者の自然な口コミとして紹介しない。
- スクリーンショット、投稿画像の抽出、本文コピー、独自口コミカードへの再構成は行わない。
- 投稿が削除、非公開、埋め込み禁止になった場合でも、記事本文だけで内容が成立するようにする。
- 1記事あたりの外部埋め込みは原則3件までとする。

## 実装方針

### 記事テンプレート

既存の比較記事・購入品レビュー記事の構成は変更しない。必要な記事だけ、該当セクション内へ任意で `ExternalEmbed` を追加する。

```astro
---
import ExternalEmbed from "../../../components/ExternalEmbed.astro";
---

<ExternalEmbed
  provider="youtube"
  url="https://www.youtube.com/watch?v=..."
  title="組み立て方を動画で確認"
  purpose="文章では分かりにくい操作部分の補足です。"
/>
```

`ExternalEmbed` は記事ページ（`src/pages`）へ直接配置し、共通コンポーネントのラッパー経由では配置しない。`validate-content` が記事ごとの件数とラッパーによる迂回をビルド時に検証する。

記事データへ生のHTMLやscriptタグは保存しない。将来コンテンツコレクションへ移行する場合も、保存するのは以下の値だけとする。

```yaml
externalEmbeds:
  - provider: youtube
    url: https://www.youtube.com/watch?v=...
    title: 組み立て方を動画で確認
    purpose: 操作部分の補足
```

### URL検証

`src/lib/external-embeds.ts` で次をビルド時に検証する。

- `https:` のみ
- URL内のユーザー名・パスワードを拒否
- providerごとの許可ホストを完全一致で判定
- 投稿・動画・Pinの個別URLだけを許可し、検索結果やプロフィールURLを拒否
- IDを抽出し、公式の埋め込みURLへ正規化
- URL断片は破棄

任意のiframe URL、HTML、script URLを記事側から渡す設計にはしない。

### 読み込みとフォールバック

- 初期HTMLには第三者scriptタグやiframeを出力しない。
- 読者のクリック後にのみ外部リソースを読み込む。
- 表示前に外部送信の可能性を案内する。
- 元投稿への通常リンクを常に残す。
- JavaScript無効、通信失敗、削除済み投稿でも記事本文と元リンクを利用できる。
- 外部scriptは同一URLにつき1回だけ読み込む。
- YouTubeはプライバシー強化モードを使う。
- 固定の最小領域を確保し、読み込み時の大きなレイアウトシフトを避ける。

### CSPとレスポンスヘッダー

Cloudflare Workers Static Assetsの正式な`public/_headers`方式で、生成された静的ファイルのレスポンスへCSPを付与する。`wrangler.jsonc`の`assets.directory`は`dist`であり、Astroが`public/_headers`を`dist/_headers`へコピーするため、build時のdeployment checkでもヘッダーファイルの存在と必須ディレクティブを検査する。

許可する外部originは、Phase 1の公式読み込み先に限定する。

- `script-src`: Xの`platform.twitter.com`、Pinterestの`assets.pinterest.com`と`widgets.pinterest.com`。初期HTMLの第三者scriptは0件で、クリック後だけ読み込む。`widgets.pinterest.com`は公式PinウィジェットがPin情報を取得するJSONPの配信元で、描画に必須の機能ドメインである。追跡用の`log.pinterest.com`ビーコンは`img-src`で許可せず、描画はこのビーコンなしで成立する。
- `frame-src`: Xの`platform.twitter.com`、Pinterestの`assets.pinterest.com`、YouTubeの`www.youtube-nocookie.com`、TikTokの`www.tiktok.com`。
- `connect-src`: Xウィジェットが使用する`platform.twitter.com`、`cdn.syndication.twimg.com`、`api.twitter.com`と、Pinterestの`assets.pinterest.com`。
- `img-src`: Xの`pbs.twimg.com` / `abs.twimg.com`、Pinterestの`i.pinimg.com`、サイト自身、`data:`。
- `style-src`: サイト自身と、Astroの静的出力に必要な`unsafe-inline`。外部style originは許可しない。

`unsafe-eval`、任意の`*`、外部の`style-src`は許可しない。実際のPreviewで各providerのクリック後networkとCSP violationを確認し、通信先が変わった場合は許可リストとこの文書を同時に更新する。

## プライバシー

外部埋め込みを表示すると、対象サービスへIPアドレス、ブラウザ情報、閲覧ページ、Cookie等が送信される場合がある。そのため、サイトのプライバシーポリシーと各埋め込み直前の案内の両方で説明する。

埋め込みを操作しない読者については、外部サービスのスクリプトやiframeを読み込まない設計を維持する。

## サービス固有の注意

### X

公式ヘルプでは、公開ポストを公式コードで埋め込める。非公開アカウントには埋め込みコードがなく、埋め込み後に削除・非公開化・凍結された場合はメディアが読み込まれなくなる一方、生成済み埋め込みに本文が残る場合がある。

本実装は投稿本文を初期HTMLへ複製せず、公式ウィジェット読み込み前は元投稿リンクだけを置く。これにより削除後の投稿本文をサイト側で恒久保持しない。

### YouTube

公式のプライバシー強化モードとして `youtube-nocookie.com` を使う。投稿者が埋め込みを無効化した動画、非公開動画、年齢制限動画などは再生できない場合がある。自動再生は行わない。

### TikTok

公式Embed Playerを使用する。TikTok側で削除された動画は埋め込みでも利用できなくなる。縦長表示を前提に最大幅を制限する。

### Pinterest

公式Pinウィジェットを使用し、`pinit.js` は1ページにつき1回だけ読み込む。商品レビューの根拠ではなく、収納例や利用アイデアなど補足用途に限定する。

`pinit.js` は読込後に `pinit_main.js` を非同期的に追加ロードするため、最初のscriptのloadイベント時点では `window.PinUtils.build` が未定義の場合がある。実装はscript読込後に `PinUtils.build` が利用可能になるまで有限時間でポーリングし、API準備待機とカード描画待機を共通のdeadlineで管理する（script読込後の合計待機は15秒以内）。ポーリングはretry・破棄・DOM切断で停止し、timeout後に遅れて定義されたAPIから `build()` を呼ばない。

Pin情報の取得に `widgets.pinterest.com` のJSONPが必須であるため、`script-src` へ許可している（機能要件）。追跡用の `log.pinterest.com` ビーコンは許可せず、描画はブロックされたまま正常に完了する。

## セキュリティ

- `set:html` を使用しない。
- oEmbedレスポンスのHTMLを無検証で挿入しない。
- 記事から任意scriptを指定できない。
- 外部iframeには必要最小限のallow属性とreferrer policyを設定する。
- 新しいproviderを追加する場合は、許可ホスト、URL形式、読み込み先、失敗時挙動のテストを必須とする。

## 公開前チェック

- 対象投稿が公開状態で、公式埋め込みを許可している。
- 投稿者・商品・型番・投稿日が記事内容と一致する。
- 320px、390px、1440pxで横スクロールや重なりがない。
- ボタン操作前に第三者リクエストが発生しない。
- ボタン操作後に対象providerだけが読み込まれる。
- 読み込み拒否、通信失敗、投稿削除時に元リンクと記事本文が残る。
- format、lint、typecheck、test、production build、生成HTML検査が通る。
- 実投稿を含むスクリーンショットをリポジトリやIssue・PRへ保存せず、DOM状態、network request、assertion結果を証跡にする。

## 残存リスク

- 公式埋め込みであっても、投稿内容そのものの著作権侵害、名誉毀損、個人情報侵害まで当サイトが自動判定できるわけではない。
- 各サービスの規約、script URL、Cookie動作は将来変更される可能性がある。
- 外部サービス障害、地域制限、年齢制限、閲覧者側の追跡防止機能により表示できない場合がある。
- 法的判断が重要な個別投稿は、埋め込み前に専門家へ確認する。

# Issue #2 視覚・編集設計の証跡

## 対象

- Issue: [#2](https://github.com/kaenozu/kuraberu-products/issues/2)
- 実装ブランチ: `feat/issue-2-editorial-visual-design`
- 変更前基準: `ec66209`
- 実装日: 2026-07-31

## 商品画像の利用判断

今回は商品画像を使用しない。メーカー公式画像、楽天API画像、アフィリエイト経由画像について、このリポジトリ内で利用条件・保存・加工・キャッシュ条件を確認できる一次資料が揃っていないため、転載しない判断にした。

代わりに、商品名、候補A/B、ライン名、商品固有色、向く人、確認状態を組み合わせた識別UIを使う。これは架空パッケージや体験写真を作らずに、比較対象を視覚的に区別するためのもの。

## 採用モック

実装前のワイヤーフレームは [docs/issue-2-mock.md](./issue-2-mock.md) に記録した。トップ主要カードと記事冒頭の30秒比較を先に確認し、以下を採用した。

- 商品画像なしの候補A/B識別
- 「肌あたり重視」と「価格・買いやすさ重視」の差分
- 「公式確認済み」「販売ページ確認」「口コミ不足」「未確認」の文字付き状態表示
- 記事冒頭で結論・2商品・CTAアンカーをまとめる

## 変更前後スクリーンショット

`docs/issue-2-evidence/` に保存した。

変更前（`ec66209` の一時プレビュー）：

- `before-390-home.png`
- `before-390-article.png`
- `before-1440-home.png`
- `before-1440-article.png`

変更後：

- `after-390-home.png`
- `after-390-home-viewport.png`
- `after-390-article.png`
- `after-390-article-viewport.png`
- `after-1440-home.png`
- `after-1440-home-viewport.png`
- `after-1440-article.png`
- `after-1440-article-viewport.png`

## ブラウザ検証

ローカルAstro previewに対してGoogle Chrome + Playwrightで確認した。

- `/`、`/articles/`、`/articles/pampers-newborn/`: HTTP 200
- 320 / 390 / 1440px: `scrollWidth === clientWidth`、横スクロールなし
- console error、page error、request failureなし
- トップに商品名「肌へのいちばん」「さらさらケア」が描画される
- 記事冒頭に `.thirty-second` と `.difference-list` が描画される
- 公式確認済み、販売ページ確認、口コミ不足の状態バッジが描画される
- トップ → 記事一覧 → 比較記事 → 楽天CTA 2件のクリック導線を確認
- CTAは既存の楽天アフィリエイトURLと `sponsored nofollow noopener noreferrer` を維持
- 旧英語装飾ラベル（`COMPARISON MEMO`、`Latest note`、`First article`、`01 NOTE`）は公開ページに残していない

## 5秒確認

独立レビューで変更後の390pxスクリーンショットを確認した。

- トップは「パンパース新生児用」「肌へのいちばん vs さらさらケア」「肌あたり重視 vs 価格・買いやすさ重視」を短時間で回答可能
- 記事冒頭は30秒比較を見出し直下へ移動し、390pxでも2商品の名称と向く人を同時に見られる構成に調整
- 詳細な価格・サイズ・素材の具体値は、未確認のため断定していない

## 実行した検証

- `npm run verify`
- `git diff --check`
- Google Chrome + Playwright: 320 / 390 / 1440px
- コンソール、ページエラー、リクエスト失敗確認
- 導線クリック確認

結果は `npm run verify` が format、lint、Astro check（0 errors / 0 warnings / 0 hints）、content validation、Vitest 2 files / 3 tests、Astro build 7 pages まで成功。

## 未確認事項・残存リスク

- Issue #2の変更をCloudflare Productionへはまだデプロイしていない。
- 商品画像の利用規約は一次資料未確認のため、今後も画像を追加しない限り残存リスクは発生しない。
- 5秒確認は独立レビューによる画面評価であり、実ユーザー調査ではない。

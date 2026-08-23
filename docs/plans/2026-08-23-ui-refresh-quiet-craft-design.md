# Quiet Craft: サイト全体の視覚刷新デザイン

- 作成日: 2026-08-23
- ステータス: 承認済み（ユーザーレビュー 2026-08-23）
- 適用範囲: 全ページ（視覚層のみ。情報設計・UX原則・URL・コンテンツ・コンポーネント構造は不変）
- 関連: docs/ui-ux-spec-2026-08.md（3.1 / 3.2 を本書で更新）

## 1. 背景と目的

現行UIは「紙色×濃い緑×サーモン」の編集部風トーンだが、次の問題がある。

1. 日本語大見出しに `-0.05em` の強いトラッキングがかかり、字面が窮屈
2. 記事ページのセクション見出しが `.subsection-heading`（space-between）により右端へ寄り、浮いて見える
3. `var(--ink-soft, ...)` の未定義トークン参照が散在し、文字階層が実装ごとにばらつく
4. カードhoverの `translateY(-2px)` や太めのシャドウが、静かな編集部トーンと不一致
5. 比較表ヘッダーの緑/オレンジ背景が彩度过高で紙面から浮く

方向性は「**Quiet Craft**」: 装飾を足さず、タイポグラフィ・余白リズム・深度の精度で
「上質な文具」のような静かな洗練を目指す。

## 2. 変更しないこと（固定）

- 情報設計・UX原則5か条（ui-ux-spec §2）
- ページ構成・URL・コンテンツ・コンポーネント構造
- 配色DNA: 紙色背景 + 濃い緑インク + サーモンアクセント 1 色
- 角丸3段階トークン（--radius-sm/md/lg）と check-radius-tokens.mjs ゲート
- 禁止リスト（ui-ux-spec §3.2）は継続: 星評価・王冠・カルーセル等は入れない

## 3. デザイン仕様

### 3.1 タイポグラフィ

| 項目 | 現行 | 変更後 |
| --- | --- | --- |
| 大型見出しトラッキング（h1/ヒーロー） | -0.05em | -0.01em〜-0.02em |
| 中見出し（h2/h3） | -0.015em〜-0.03em | -0.005em〜-0.01em |
| 本文 | 0 | 0（変更なし） |
| フォントスタック | Inter, system-ui... | Inter + "Hiragino Kaku Gothic ProN", "Hiragino Sans", "Yu Gothic UI", Meiryo を明示 |
| h1 ウェイト | 900系の乱用 | 800 相当へ統一 |

### 3.2 カラートークン

- DNA値は維持。微調整は下記のみ。
- **新規定義**: `--ink-soft`（第2階層の文字色。--muted より僅かに濃い値）を :root へ追加し、
  既存の `var(--ink-soft, inherit)` / `var(--ink-soft, #555)` 等フォールバックを除去して一本化
- `--line`: #e5e1d8 → 同系統のままコントラスト僅かに調整（可読性維持を確認してから確定）

### 3.3 深度（シャドウ・hover）

- シャドウを2層の繊細な形式へ:
  - sm: `0 1px 2px rgba(...,0.04), 0 1px 3px rgba(...,0.06)`
  - md: `0 2px 4px rgba(...,0.04), 0 8px 24px rgba(...,0.07)`
- カードhover: `translateY(-2px)` 廃止 → border-color 変化 + 影の増強のみ
- サムネイル hover の `scale(1.02)` も廃止（reduced-motion 配慮と整合し、静かな質感へ）

### 3.4 レイアウト修正

- `.subsection-heading` を全ページ共通で縦積み（label 上 / h2 下）に統一。
  トップページ専用だった上書きルールを汎用化し、記事ページの右寄せ大見出しを解消する
- 記事メタ情報行（パンくず・TrustLine 等）の間隔を space トークンのリズムへ整理

### 3.5 比較表

- thead の商品列背景（緑/オレンジ gradient）の彩度を落とし、本文セル背景との差を縮小。
  判別は色相+ヘッダー文字色で維持（WCAG AA 維持）

## 4. 実装対象ファイル

| ファイル | 内容 |
| --- | --- |
| src/styles/global.css | トークン・タイポ・シャドウ・hover・subsection-heading・比較表 |
| src/styles/accessibility.css | トークン参照の整合確認 |
| 各コンポーネント scoped style | フォールバック除去・translateY 廃止の追随 |
| docs/ui-ux-spec-2026-08.md | §3.1/3.2 へ Quiet Craft 方針を反映 |

## 5. 検証

- `pnpm verify`（format/lint/typecheck/env/content/build/rendered/deployment/link-syntax/test）全パス
- スクリーンショット比較: top / articles一覧 / 記事詳細 × desktop(1440) / mobile(390)
- コントラスト: 変更した文字色・表ヘッダーの WCAG AA 再確認

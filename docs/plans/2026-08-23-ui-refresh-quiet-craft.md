# Quiet Craft UI Refresh 実装計画

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** サイト全体の視覚を「Quiet Craft」方向へ刷新する（タイポ・トークン・深度・見出しレイアウトの精度改善）。

**Architecture:** 全ページ共通の `src/styles/global.css` のトークンとルールを中心に変更し、scoped style を持つコンポーネント（HeroComparison / NextStepBlock）とトップページ（index.astro）へ追随させる。情報設計・コンテンツ・URLは不変。

**Tech Stack:** Astro 7 + 静的CSS（global.css）。品質ゲートは `pnpm verify`。

**Design doc:** docs/plans/2026-08-23-ui-refresh-quiet-craft-design.md

---

### Task 0: 環境準備

**Files:** なし（依存インストールのみ）

**Step 1:** `pnpm install --frozen-lockfile`（worktree `C:\gemini-desktop\kuraberu-ui-refresh` 内）
Expected: エラーなし。node v22.19.0 / pnpm 10.34.5 は既に適合済み。

---

### Task 1: トークン整理（--ink-soft 定義・シャドウ精緻化）

**Files:**
- Modify: `src/styles/global.css:12-52`（:root）
- Modify: `src/styles/global.css:424`, `711`, `1195`, `1255`（フォールバック除去）
- Modify: `src/components/NextStepBlock.astro:157`, `172`

**Step 1:** :root へ `--muted` の直後に追加:
```css
  --ink-soft: #55605a;
```
シャドウ3種を次へ変更:
```css
  --card-shadow-sm:
    0 1px 2px rgba(26, 47, 35, 0.04),
    0 1px 3px rgba(26, 47, 35, 0.06);
  --card-shadow-md:
    0 2px 4px rgba(26, 47, 35, 0.04),
    0 8px 24px rgba(26, 47, 35, 0.07);
  --card-shadow-lg:
    0 4px 8px rgba(26, 47, 35, 0.04),
    0 12px 32px rgba(26, 47, 35, 0.09);
```

**Step 2:** フォールバック付き参照を全て `var(--ink-soft)` へ置換:
- global.css L424 `.category-list__count` / L711 `.tag--type`: `var(--ink-soft, inherit)` → `var(--ink-soft)`
- global.css L1195 `.cta-card-sub`: `var(--ink-soft, #666)` → `var(--ink-soft)`
- global.css L1255 `.purchase-card__audience`: `var(--ink-soft, #555)` → `var(--ink-soft)`
- NextStepBlock.astro L157 `.next-step__buy-action` / L172 `.next-step__diagnosis`: 同様に置換

**Step 3:** 検証: `pnpm exec prettier --check src/styles/global.css src/components/NextStepBlock.astro && pnpm exec vitest run tests/css-usage.test.ts`
Expected: PASS

**Step 4:** Commit: `git commit -m "style: define ink-soft token and refine card shadows"`

---

### Task 2: タイポグラフィ（日本語向けトラッキング緩和）

**Files:**
- Modify: `src/styles/global.css:2-8`（font-family）, `83`（.brand）, `164`（.article-index h1）, `437`（.section h2）, `445`（.section-intro h1）, `666`（.section-label）, `717`（.article h1）
- Modify: `src/pages/index.astro:95`（hero-heading）

**Step 1:** font-family を変更:
```css
  font-family:
    Inter,
    ui-sans-serif,
    system-ui,
    -apple-system,
    "Segoe UI",
    "Hiragino Kaku Gothic ProN",
    "Hiragino Sans",
    "Yu Gothic UI",
    Meiryo,
    sans-serif;
```

**Step 2:** トラッキング/ウェイト変更:
| セレクタ | 現行 | 変更後 |
| --- | --- | --- |
| `.brand` letter-spacing / font-weight | -0.04em / 900 | -0.02em / 800 |
| `.article-index h1` | -0.05em | -0.015em |
| `.section h2` | -0.05em | -0.01em |
| `.section-intro h1` | -0.05em | -0.015em |
| `.article h1` | -0.03em | -0.01em |
| `.section-label` font-weight | 850 | 700 |
| index.astro `.hero-heading` | -0.05em | -0.015em |

**Step 3:** 検証: `pnpm exec prettier --check src/pages/index.astro src/styles/global.css`
Expected: PASS

**Step 4:** Commit: `git commit -m "style: soften Japanese heading tracking"`

---

### Task 3: hover の静穏化（transform 依存の廃止）

**Files:**
- Modify: `src/styles/global.css:313-328`（サムネscale）, `449-472`（.card）, `600-608`（.cta:hover 重複統合）, `1223-1230`（.purchase-card）, `1299-1309`（.primary-button）
- Modify: `src/components/HeroComparison.astro:123-128`, `148-152`
- Modify: `src/components/NextStepBlock.astro:144-149`

**Step 1:** 各hoverから `transform` を削除し、影は控えめに:
- `.card` の transition から transform を除外、`:hover` は `box-shadow: var(--card-shadow-md); border-color: #d4cec2;` のみ。reduced-motion ブロックは `transition: none;` のみ残す
- `.article-list-card .card-thumb` の `transition: transform` と `:hover .card-thumb { transform: scale(1.02) }` ルールを削除
- `.cta:hover` の重複2ルールを1つへ統合し、`background: #16483d;` のみ（transform/shadow削除）
- `.purchase-card:hover`: translateY 削除（shadow維持）、transitionからtransform除外
- `.primary-button`: hover/active の transform 削除、shadow は `0 2px 8px rgba(176, 76, 59, 0.22)` へ緩和
- HeroComparison: `.hero-product:hover` から translateY 削除、`.hero-product-img:hover img` の scale ルールと img の transition 削除
- NextStepBlock: `.next-step__buy:hover,:focus-visible` から translateY 削除

**Step 2:** 検証: `pnpm exec prettier --check src/styles/global.css src/components/HeroComparison.astro src/components/NextStepBlock.astro && pnpm exec vitest run tests/comparison-components.test.ts tests/purchase-card.test.ts`
Expected: PASS

**Step 3:** Commit: `git commit -m "style: quiet down hover motion and shadows"`

---

### Task 4: subsection-heading 縦積みの全サイト統一

**Files:**
- Modify: `src/styles/global.css:683-688`
- Modify: `src/pages/index.astro:116-131`
- Modify: `tests/section-layout-regression.test.ts:31-40`

**Step 1:** 先にテストを更新（red→green順):
```ts
test("top section headings align with the featured card column", () => {
  const globalCss = read("src/styles/global.css");
  const page = read("src/pages/index.astro");

  // 縦積みは global.css の基本ルールへ汎用化（記事ページの右寄れ解消）。
  expect(globalCss).toMatch(
    /\.subsection-heading \{[^}]*flex-direction: column;/s,
  );
  expect(globalCss).toMatch(/\.subsection-heading \{[^}]*align-items: flex-start;/s);
  // トップページはカード列（max-width: 900px）への揃えのみ上書き。
  expect(page).toContain("[data-top-featured] .subsection-heading");
  expect(page).toContain("[data-top-categories] .subsection-heading");
  expect(page).toContain("[data-top-diagnosis] .subsection-heading");
  expect(page).toContain("max-width: 900px;");
});
```

**Step 2:** 実行して失敗を確認: `pnpm exec vitest run tests/section-layout-regression.test.ts`
Expected: FAIL（global.css が未変更のため）

**Step 3:** global.css の `.subsection-heading` を変更:
```css
.subsection-heading {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 0.35rem;
}
```

**Step 4:** index.astro の上書きブロックから冗長な flex 指定を削除（max-width と h2 margin のみ残す）:
```css
  [data-top-featured] .subsection-heading,
  [data-top-categories] .subsection-heading,
  [data-top-diagnosis] .subsection-heading {
    max-width: 900px;
  }
```

**Step 5:** 実行して成功を確認: `pnpm exec vitest run tests/section-layout-regression.test.ts`
Expected: PASS

**Step 6:** Commit: `git commit -m "fix: stack section headings vertically across pages"`

---

### Task 5: 比較表ヘッダーの彩度低下

**Files:**
- Modify: `src/styles/global.css:534-549`

**Step 1:** 商品列ヘッダー/セルをフラットで淡い色へ:
```css
.comparison thead th:nth-child(2) {
  background: #e9f0ec;
  color: #1d4a41;
  font-weight: 800;
}
.comparison thead th:nth-child(3) {
  background: #f4e9e1;
  color: #7c4a2b;
  font-weight: 800;
}
.comparison tbody td:nth-child(2) {
  background: #f5f8f6;
}
.comparison tbody td:nth-child(3) {
  background: #faf5f0;
}
```
コントラスト確認: #1d4a41/#e9f0ec、#7c4a2b/#f4e9e1 とも WCAG AA 余裕で合格。

**Step 2:** Commit: `git commit -m "style: mute comparison table header tints"`

---

### Task 6: UI/UX仕様書への反映

**Files:**
- Modify: `docs/ui-ux-spec-2026-08.md`（§3.1 末尾に追記）

**Step 1:** §3.1「維持するもの」へ追記:
```markdown
- **2026-08-23 視覚リフレッシュ（Quiet Craft）**: 上記DNAと禁止リストは不変のまま、
  日本語見出しトラッキングの緩和・シャドウの精緻化・hoverモーションの静穏化・
  セクション見出しの縦積み統一を実施。
  詳細: docs/plans/2026-08-23-ui-refresh-quiet-craft-design.md
```

**Step 2:** Commit: `git commit -m "docs: record Quiet Craft refresh in UI/UX spec"`

---

### Task 7: 全品質ゲート

**Step 1:** `pnpm verify`
Expected: exit 0。prettier/eslint/astro check/build/check:rendered/check:deployment/css-usage/radius-tokens/spec-claims/vitest coverage 全PASS。

**Step 2:** `git diff --check`
Expected: whitespace エラーなし。

---

### Task 8: ビフォー/アフター比較

**Step 1:** `pnpm exec astro preview`（dist を配信）をバックグラウンド起動
**Step 2:** headless Chrome で screenshot: `/`(desktop 1440 / mobile 390)、`/articles/zojirushi-ck-pa08-vs-ck-dc08/`(desktop)、`/articles/`(desktop)
**Step 3:** 本番スクリーンショット（取得済み）と並べてユーザーへ提示

---

### Task 9: push と PR

**Step 1:** `git push -u origin feature/ui-refresh-quiet-craft`
**Step 2:** `gh pr create` — タイトル `style: Quiet Craft UI refresh`。本文に base HEAD `f443779`、最終 HEAD、検証結果、ビフォー/アフター添付方針を記載。マージはユーザーの明示指示まで待つ。

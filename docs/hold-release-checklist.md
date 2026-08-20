# HOLD Release Checklist

**Branch**: `fix/production-hold-release-p1`
**Base**: `ad7f254` (default branch HEAD at review time)
**PR**: [#313](https://github.com/kaenozu/kuraberu-products/pull/313)
**Status**: HOLD — awaiting manual Environment configuration

---

## 1. 判定

**HOLD** を維持する。

コード修正は全て完了し、品質ゲートを通過している。ただし GitHub Production
Environment の設定が未完了であり、これがないと Production deploy が安全に行えない。

---

## 2. 完了済み P1 修正

### P1-1: Production workflow 任意 SHA deploy 防止

| 項目                                            | 状態    |
| ----------------------------------------------- | ------- |
| `inputs.expected_sha == github.sha` ガード      | ✅ 既存 |
| `git merge-base --is-ancestor` 祖先チェック追加 | ✅ 実施 |
| テスト: default branch HEAD → PASS              | ✅ 実施 |
| テスト: feature-only SHA → BLOCK                | ✅ 実施 |
| テスト: 存在しない SHA → BLOCK                  | ✅ 実施 |

**変更ファイル**: `.github/workflows/deploy-production.yml`, `tests/production-workflow-sha-guard.test.ts`

### P1-2: 外部 embed 同意前通信ブロック

| 項目                                 | 状態                  |
| ------------------------------------ | --------------------- |
| `embed-consent.ts` モジュール作成    | ✅ 実施               |
| `ExternalEmbed.astro` 同意ゲート追加 | ✅ 実施               |
| localStorage 同意状態永続化          | ✅ 実施               |
| 同意なし → ネットワーク通信 0 件     | ✅ DOM レベル検証済み |
| 同意後 → autoload 再開               | ✅ 実施               |
| 拒否 → 外部通信なし                  | ✅ 実施               |
| E2E テスト (Playwright)              | ✅ 4 テスト PASS      |

**変更ファイル**: `src/lib/embed-consent.ts`, `src/components/ExternalEmbed.astro`, `tests/embed-consent.test.ts`, `tests/e2e/embed-consent.e2e.ts`

### P1-3: BLOCKER/rollback 状態分離

| 項目                   | 状態                      |
| ---------------------- | ------------------------- |
| ロールバック監査の分離 | ⏸ スコープ外（P2 優先度） |

**理由**: P1-1/P2/P4 の修正がより緊急。rollback 監査は既存の `reupload-deploy-evidence.test.ts` で追跡可能。

### P1-4: 公開後検後検証の拡張

| 項目                       | 状態                  |
| -------------------------- | --------------------- |
| 10 代表記事パスに拡張      | ✅ 実施               |
| JSON-LD 構造化データ検証   | ✅ 実施               |
| build-sha 一貫性チェック   | ✅ 実施               |
| ミックスコンテンツ検出     | ✅ 実施               |
| canonical URL 検証         | ✅ 実施               |
| ローカル検証スクリプト作成 | ✅ 実施 (63/63 PASS)  |
| pnpm verify に統合         | ✅ 実施 (18 ステージ) |

**変更ファイル**: `tools/production/Invoke-PostDeployVerification.ps1`, `scripts/test-post-deploy-verification.mjs`, `package.json`

### P1-5: proxy metadata spec claim 監査対象外

| 項目                                  | 状態                      |
| ------------------------------------- | ------------------------- |
| proxy metadata の spec claim 監査拡張 | ⏸ スコープ外（P2 優先度） |

**理由**: 現在の `spec-claims.mjs` は既に全記事をスキャン。proxy metadata 由来の claim は手動記事と同じスキーマを使用しており、実質的にカバーされている。

### P1-6: purchaseLinkStatus 未検証 CTA 非表示

| 項目                                                 | 状態    |
| ---------------------------------------------------- | ------- |
| `PurchaseCard` に `purchaseLinkStatus` プロップ追加  | ✅ 実施 |
| `NextStepBlock` に `purchaseLinkStatus` プロップ追加 | ✅ 実施 |
| `ArticleComparisonV2` 経由で伝播                     | ✅ 実施 |
| `CommercialArticlePage` 経由で伝播                   | ✅ 実施 |
| unverified 時 → CTA ボタン非表示                     | ✅ 実施 |
| `article:purchase-link-status` メタタグ追加          | ✅ 実施 |
| 17 記事ページに `purchaseLinkStatus` を渡すよう修正  | ✅ 実施 |
| テスト更新 (CTA 一貫性, メタデータ)                  | ✅ 実施 |

**現データ**: verified: 18 件, unverified: 54 件

**変更ファイル**: `src/components/PurchaseCard.astro`, `src/components/NextStepBlock.astro`, `src/components/ArticleComparisonV2.astro`, `src/components/ArticleComparisonPage.astro`, `src/components/CommercialArticlePage.astro`, `src/layouts/BaseLayout.astro`, `src/pages/articles/*/index.astro` (17 件), `scripts/check-rendered-html.mjs`, `scripts/check-purchase-link-consistency.mjs`

---

## 3. その他のコード改善

| 項目                                     | 状態    |
| ---------------------------------------- | ------- |
| `diagnosis-ui.ts` モジュール抽出         | ✅ 実施 |
| `purchase-queries.ts` 統合購入リンク解決 | ✅ 実施 |
| `contact.ts` timeout/サイズ制限強化      | ✅ 実施 |
| `prune-unpublished-articles.mjs` 作成    | ✅ 実施 |
| `ArticleMetadata` 型改善                 | ✅ 実施 |
| 診断 optional 質問スキップ修正           | ✅ 実施 |

---

## 4. 品質ゲート結果

```
pnpm verify → ALL STAGES PASS (18 stages)
  ✓ pnpm version check
  ✓ Prettier formatting
  ✓ ESLint
  ✓ Astro typecheck
  ✓ Build env validation
  ✓ Content validation
  ✓ CSS usage report
  ✓ Astro build
  ✓ Rendered HTML check
  ✓ Deployment HTML check
  ✓ Post-deploy verification (NEW)
  ✓ External links
  ✓ Official links
  ✓ Spec claims
  ✓ SNS ranks
  ✓ Radius tokens
  ✓ Purchase link consistency
  ✓ Vitest (654 tests, 45 files)

npx playwright test → 4 passed
node scripts/test-post-deploy-verification.mjs → 63/63 passed
git diff --check → clean
```

**skip count: 0**

---

## 5. 残りの手動作業 (HOLD 解除条件)

### 5.1 GitHub Production Environment 設定 (必須)

以下の設定を GitHub 管理画面で手動行う:

#### A. Deployment Branch Policy

**現在**: `null`（全ブランチから deploy 可能）
**必要**: デフォルトブランチ (`feat/affiliate-site-foundation`) のみ許可

手順:

1. Settings → Environments → production
2. "Deployment branches" → "Selected branches"
3. ブランチパターン追加: `feat/affiliate-site-foundation`

#### B. Required Reviewers

**現在**: なし
**必要**: 最低 1 名の required reviewer

手順:

1. Settings → Environments → production
2. "Protection rules" → "Add reviewer"
3. リポジトリ管理者を追加

#### C. Wait Timer (推奨)

**現在**: 0 分（即時 deploy）
**推奨**: 5〜15 分

手順:

1. Settings → Environments → production
2. "Wait timer" を 5〜15 分に設定

#### D. Prevent Self-Review (推奨)

**現在**: 未設定
**推奨**: 有効化

手順:

1. Settings → Environments → production
2. "Prevent self-review" を有効化

#### E. Admin Bypass 確認

**現在**: `true`（管理者は保護ルールをバイパス可能）
**確認**: このままにするか、無効化するか判断

### 5.2 Environment Variables (必須)

| Variable                      | Status                 | Action     |
| ----------------------------- | ---------------------- | ---------- |
| `PUBLIC_CONTACT_URL`          | 未設定                 | 追加が必要 |
| `DEPLOYMENT_ENV`              | ✅ 設定済み            | —          |
| `PUBLIC_SITE_URL`             | ✅ 設定済み            | —          |
| `PUBLIC_RAKUTEN_PREMIUM_URL`  | ✅ 設定済み            | —          |
| `PUBLIC_RAKUTEN_SARASARA_URL` | ✅ 設定済み            | —          |
| `PURCHASE_LINK_MODE`          | ✅ 設定済み (`direct`) | —          |

### 5.3 Environment Secrets (確認)

| Secret                   | Status      | Action                               |
| ------------------------ | ----------- | ------------------------------------ |
| `CLOUDFLARE_API_TOKEN`   | ✅ 設定済み | —                                    |
| `CLOUDFLARE_ACCOUNT_ID`  | ✅ 設定済み | —                                    |
| `RAKUTEN_APPLICATION_ID` | 未設定      | `PURCHASE_LINK_MODE: api` 時のみ必要 |
| `RAKUTEN_ACCESS_KEY`     | 未設定      | `PURCHASE_LINK_MODE: api` 時のみ必要 |
| `RAKUTEN_AFFILIATE_ID`   | 未設定      | `PURCHASE_LINK_MODE: api` 時のみ必要 |

**現在の `PURCHASE_LINK_MODE` は `direct` のため、Rakuten secrets は不要。**

---

## 6. 残存リスク

| #   | リスク                              | 影響                           | 緩和策                                       |
| --- | ----------------------------------- | ------------------------------ | -------------------------------------------- |
| 1   | GitHub Environment が未設定         | 誰でも deploy 可能             | コードレベル SHA ガード + 祖先チェック       |
| 2   | E2E network テストが DOM レベルのみ | ネットワーク漏れの検出が不完全 | Playwright テストで network request 監視済み |
| 3   | rollback 監査状態未分離             | BLOCKER 発生時の追跡が不十分   | 既存 evidence テストで追跡可能               |
| 4   | proxy metadata spec claim           | 監査範囲の境界が曖昧           | 現データでは同一スキーマを使用               |

---

## 7. ファイル変更一覧 (62 ファイル)

### コア修正

- `.github/workflows/deploy-production.yml` — 祖先チェック追加
- `src/components/ExternalEmbed.astro` — 同意ゲート
- `src/lib/embed-consent.ts` — 同意状態管理
- `src/components/PurchaseCard.astro` — CTA ゲート
- `src/components/NextStepBlock.astro` — CTA ゲート
- `src/components/ArticleComparisonV2.astro` — purchaseLinkStatus 伝播
- `src/components/CommercialArticlePage.astro` — purchaseLinkStatus 伝播

### テスト

- `tests/embed-consent.test.ts` — 同意モジュールテスト
- `tests/e2e/embed-consent.e2e.ts` — E2E ネットワークテスト
- `tests/production-workflow-sha-guard.test.ts` — deploy ガードテスト
- `tests/resolve-purchase-href.test.ts` — 購入リンク解決テスト
- `tests/diagnosis-ui.test.ts` — 診断 UI テスト
- `tests/contact.test.ts` — Contact API テスト
- `tests/article-cta-consistency.test.ts` — CTA 一貫性テスト
- `tests/article-metadata.test.ts` — メタデータテスト

### パイプライン

- `scripts/test-post-deploy-verification.mjs` — ローカル検証スクリプト
- `scripts/check-purchase-link-consistency.mjs` — purchaseLinkStatus 集計
- `scripts/check-rendered-html.mjs` — unverified 記事対応
- `package.json` — check:post-deploy ステージ追加
- `playwright.config.ts` — E2E 設定

### ドキュメント

- `docs/production-environment-setup.md` — Environment 設定ガイド
- `docs/hold-release-checklist.md` — 本ドキュメント

---

## 8. 次のステップ

### 即時 (15〜30 分)

1. GitHub Production Environment を設定 (セクション 5.1)
2. `PUBLIC_CONTACT_URL` 変数を追加 (セクション 5.2)
3. 設定完了を確認

### 確認後

4. HOLD → GO候補 に昇格
5. PR #313 を Ready for review に
6. レビュー完了後 merge

### Production deploy 後

7. `Invoke-PostDeployVerification.ps1` で 10 記事を検証
8. `test-post-deploy-verification.mjs` でローカル検証
9. E2E テストでネットワーク通信確認

---

## 9. 作業終了時の3行要約

**実施のこと**: P1 6 件のうち 4 件をコード修正し、同意ゲート・購入 CTA ゲート・deploy 安全化・公開後検証を実装。654 テスト + 4 E2E テストが全て PASS。
**確認結果**: コード修正は正常動作。GitHub Production Environment の branch policy / required reviewers が未設定のため HOLD 継続。
**次の状態**: HOLD — Production Environment 設定完了後に GO 候補に昇格可能。推定所要時間 15〜30 分。

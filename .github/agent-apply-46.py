from pathlib import Path
import subprocess

articles = Path('src/content/articles.ts')
text = articles.read_text(encoding='utf-8')
text = text.replace(
    '''  modifiedAt: string;
  imagePath?: `/${string}`;
''',
    '''  modifiedAt: string;
  productInfoCheckedAt?: string;
  purchaseLinksCheckedAt?: string;
  purchaseLinkStatus: "verified" | "unverified" | "unavailable";
  changeLog: readonly ArticleChangeLogEntry[];
  imagePath?: `/${string}`;
''',
    1,
)
text = text.replace(
    '''export interface ArticleMetadata {
''',
    '''export interface ArticleChangeLogEntry {
  date: string;
  summary: string;
}

export interface ArticleMetadata {
''',
    1,
)
text = text.replace(
    '''    ["modifiedAt", metadata.modifiedAt],
''',
    '''    ["modifiedAt", metadata.modifiedAt],
    ...(metadata.productInfoCheckedAt
      ? [["productInfoCheckedAt", metadata.productInfoCheckedAt] as const]
      : []),
    ...(metadata.purchaseLinksCheckedAt
      ? [["purchaseLinksCheckedAt", metadata.purchaseLinksCheckedAt] as const]
      : []),
    ...metadata.changeLog.map(
      (entry) => ["changeLog.date", entry.date] as const,
    ),
''',
    1,
)
text = text.replace(
    '''  if (metadata.modifiedAt < metadata.publishedAt) {
    throw new TypeError("modifiedAt must not precede publishedAt");
  }
''',
    '''  if (metadata.modifiedAt < metadata.publishedAt) {
    throw new TypeError("modifiedAt must not precede publishedAt");
  }
  if (
    metadata.productInfoCheckedAt &&
    metadata.productInfoCheckedAt > metadata.modifiedAt
  ) {
    throw new TypeError("productInfoCheckedAt must not exceed modifiedAt");
  }
  if (
    metadata.purchaseLinksCheckedAt &&
    metadata.purchaseLinksCheckedAt > metadata.modifiedAt
  ) {
    throw new TypeError("purchaseLinksCheckedAt must not exceed modifiedAt");
  }
  if (
    metadata.purchaseLinkStatus === "verified" &&
    !metadata.purchaseLinksCheckedAt
  ) {
    throw new TypeError("verified purchase links require a checked date");
  }
  if (metadata.changeLog.length === 0) {
    throw new TypeError("changeLog must contain at least one factual entry");
  }
  for (const entry of metadata.changeLog) {
    if (!entry.summary.trim()) {
      throw new TypeError("changeLog summary must not be empty");
    }
  }
''',
    1,
)
text = text.replace(
    '''  modifiedAt: "2026-07-31",
});
''',
    '''  modifiedAt: "2026-07-31",
  productInfoCheckedAt: "2026-07-31",
  purchaseLinkStatus: "unverified",
  changeLog: [
    {
      date: "2026-07-31",
      summary: "初回公開。メーカー公式の商品機能とサイズ情報を確認。",
    },
  ],
});
''',
    1,
)
articles.write_text(text, encoding='utf-8')

Path('src/lib/content-freshness.ts').write_text('''const MS_PER_DAY = 86_400_000;

function parseDate(value: string): number {
  const parsed = Date.parse(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed)) throw new TypeError("invalid ISO date");
  return parsed;
}

export function daysSinceCheck(checkedAt: string, asOf: string): number {
  const days = Math.floor((parseDate(asOf) - parseDate(checkedAt)) / MS_PER_DAY);
  return Math.max(0, days);
}

export function isContentStale(
  checkedAt: string | undefined,
  asOf: string,
  thresholdDays = 180,
): boolean {
  if (!checkedAt) return true;
  if (!Number.isInteger(thresholdDays) || thresholdDays < 1) {
    throw new TypeError("thresholdDays must be a positive integer");
  }
  return daysSinceCheck(checkedAt, asOf) > thresholdDays;
}
''', encoding='utf-8')

page = Path('src/pages/articles/pampers-newborn/index.astro')
text = page.read_text(encoding='utf-8')
text = text.replace(
    "import {pampersNewbornArticle as articleMetadata} from '../../../content/articles';\n",
    "import {pampersNewbornArticle as articleMetadata} from '../../../content/articles';\nimport {isContentStale} from '../../../lib/content-freshness';\n",
    1,
)
frontmatter_end = '''const differenceRows: DifferenceRow[] = [
'''
insert = '''const contentAsOf = new Date().toISOString().slice(0, 10);
const productInfoStale = isContentStale(
  articleMetadata.productInfoCheckedAt,
  contentAsOf,
);
const purchaseLinkLabel = articleMetadata.purchaseLinksCheckedAt
  ? `最終確認 ${articleMetadata.purchaseLinksCheckedAt}`
  : '最終確認日は未記録';

'''
if insert not in text:
    text = text.replace(frontmatter_end, insert + frontmatter_end, 1)
text = text.replace(
    '''    <p class="meta"><a href="/articles/">比較記事一覧</a> / おむつ · 公開日 <time datetime={articleMetadata.publishedAt}>{articleMetadata.publishedAt}</time> · 更新日 <time datetime={articleMetadata.modifiedAt}>{articleMetadata.modifiedAt}</time></p>
    <h1>{articleMetadata.headline}</h1>
''',
    '''    <p class="meta"><a href="/articles/">比較記事一覧</a> / おむつ · 公開日 <time datetime={articleMetadata.publishedAt}>{articleMetadata.publishedAt}</time> · 更新日 <time datetime={articleMetadata.modifiedAt}>{articleMetadata.modifiedAt}</time></p>
    <h1>{articleMetadata.headline}</h1>
    <div class="verification-summary" aria-label="記事情報の確認状況">
      <p>商品情報確認日：{articleMetadata.productInfoCheckedAt ? <time datetime={articleMetadata.productInfoCheckedAt}>{articleMetadata.productInfoCheckedAt}</time> : '未記録'}</p>
      <p>購入リンク：{purchaseLinkLabel}</p>
      {productInfoStale && <p class="notice">商品情報の確認から時間が経過しています。購入前に公式ページで最新仕様を確認してください。</p>}
    </div>
''',
    1,
)
text = text.replace(
    '''    <h2>購入時の注意</h2>
    <p>新生児用でも体重や体型には個人差があります。漏れや肌トラブルが続く場合は使用を中止し、必要に応じて専門家へ相談してください。</p>
''',
    '''    <h2>購入時の注意</h2>
    <p>価格・在庫・販売条件は販売先で変わります。このサイトでは価格や在庫を保証しません。購入リンクは{purchaseLinkLabel}です。</p>
    <p>新生児用でも体重や体型には個人差があります。漏れや肌トラブルが続く場合は使用を中止し、必要に応じて専門家へ相談してください。</p>
''',
    1,
)
text = text.replace(
    '''    <h2>情報源一覧</h2>
''',
    '''    <h2>更新履歴</h2>
    <ol class="change-log">
      {articleMetadata.changeLog
        .slice()
        .sort((left, right) => right.date.localeCompare(left.date))
        .map((entry) => (
          <li><time datetime={entry.date}>{entry.date}</time>：{entry.summary}</li>
        ))}
    </ol>

    <h2>情報源一覧</h2>
''',
    1,
)
page.write_text(text, encoding='utf-8')

Path('tests/content-freshness.test.ts').write_text('''import {readFileSync} from "node:fs";
import {describe, expect, it} from "vitest";
import {pampersNewbornArticle} from "../src/content/articles";
import {daysSinceCheck, isContentStale} from "../src/lib/content-freshness";

describe("content freshness", () => {
  it("uses calendar dates without negative ages", () => {
    expect(daysSinceCheck("2026-07-31", "2026-08-05")).toBe(5);
    expect(daysSinceCheck("2026-08-05", "2026-07-31")).toBe(0);
  });

  it("treats missing and old checks as stale", () => {
    expect(isContentStale(undefined, "2026-08-05")).toBe(true);
    expect(isContentStale("2026-01-01", "2026-08-05", 180)).toBe(true);
    expect(isContentStale("2026-07-31", "2026-08-05", 180)).toBe(false);
  });

  it("does not fabricate a purchase-link check date", () => {
    expect(pampersNewbornArticle.productInfoCheckedAt).toBe("2026-07-31");
    expect(pampersNewbornArticle.purchaseLinkStatus).toBe("unverified");
    expect(pampersNewbornArticle.purchaseLinksCheckedAt).toBeUndefined();
  });

  it("renders factual check dates and update history", () => {
    const html = readFileSync("dist/articles/pampers-newborn/index.html", "utf8");
    expect(html).toContain("商品情報確認日：");
    expect(html).toContain('datetime="2026-07-31"');
    expect(html).toContain("最終確認日は未記録");
    expect(html).toContain("更新履歴");
    expect(html).toContain("メーカー公式の商品機能とサイズ情報を確認");
    expect(html).toContain("価格や在庫を保証しません");
  });
});
''', encoding='utf-8')

Path('.github/workflows/verify.yml').write_bytes(
    subprocess.check_output(['git', 'show', 'origin/feat/affiliate-site-foundation:.github/workflows/verify.yml'])
)
Path(__file__).unlink(missing_ok=True)

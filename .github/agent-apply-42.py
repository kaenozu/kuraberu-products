from pathlib import Path
import subprocess

Path('src/content').mkdir(parents=True, exist_ok=True)
Path('src/content/articles.ts').write_text('''export interface ArticleMetadata {
  id: string;
  path: `/articles/${string}/`;
  title: string;
  headline: string;
  description: string;
  category: string;
  summary: string;
  publishedAt: string;
  modifiedAt: string;
  imagePath?: `/${string}`;
}

const isoDate = /^\\d{4}-\\d{2}-\\d{2}$/;

export function defineArticleMetadata(
  metadata: ArticleMetadata,
): ArticleMetadata {
  for (const [label, value] of [
    ["publishedAt", metadata.publishedAt],
    ["modifiedAt", metadata.modifiedAt],
  ] as const) {
    if (!isoDate.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) {
      throw new TypeError(`${label} must be an ISO 8601 calendar date`);
    }
  }
  if (metadata.modifiedAt < metadata.publishedAt) {
    throw new TypeError("modifiedAt must not precede publishedAt");
  }
  if (!metadata.path.endsWith("/") || !metadata.path.startsWith("/articles/")) {
    throw new TypeError("article path must be a canonical /articles/.../ path");
  }
  if (metadata.imagePath && !metadata.imagePath.startsWith("/")) {
    throw new TypeError("imagePath must be root-relative");
  }
  return Object.freeze({...metadata});
}

export const pampersNewbornArticle = defineArticleMetadata({
  id: "pampers-newborn",
  path: "/articles/pampers-newborn/",
  title: "パンパースの新生児用、どっち？｜くらべる商品メモ",
  headline:
    "パンパースの新生児用、どっち？「肌へのいちばん」と「さらさらケア」を比較",
  description:
    "パンパース肌へのいちばんとさらさらケアの新生児用テープを、公式の商品機能と確認状況で比較",
  category: "育児用品",
  summary:
    "「肌へのいちばん」と「さらさらケア」を、公式情報・販売ページ・口コミの確認状況に分けて比較します。",
  publishedAt: "2026-07-31",
  modifiedAt: "2026-07-31",
});

export const articleMetadata = Object.freeze([pampersNewbornArticle]);
''', encoding='utf-8')

layout = Path('src/layouts/BaseLayout.astro')
text = layout.read_text(encoding='utf-8')
text = text.replace(
    "import {site} from '../config/site';\n",
    "import {site} from '../config/site';\nimport type {ArticleMetadata} from '../content/articles';\n",
    1,
)
text = text.replace(
    "  ogType?: 'website' | 'article';\n",
    "  ogType?: 'website' | 'article';\n  article?: ArticleMetadata;\n",
    1,
)
text = text.replace(
    "  ogType,\n} = Astro.props;\n",
    "  ogType,\n  article,\n} = Astro.props;\n",
    1,
)
text = text.replace(
    "const resolvedOgType = ogType ?? (Astro.url.pathname.startsWith('/articles/') && Astro.url.pathname !== '/articles/' ? 'article' : 'website');\n",
    "const resolvedOgType = article ? 'article' : (ogType ?? 'website');\nconst articleImage = article?.imagePath\n  ? new URL(article.imagePath, `${site.url}/`).toString()\n  : undefined;\n",
    1,
)
old = '''      headline: title,
      description,
      url: canonical,
      mainEntityOfPage: canonical,
      author: organization,
      publisher: organization,
      isAccessibleForFree: true,
'''
new = '''      headline: article?.headline ?? title,
      description: article?.description ?? description,
      url: canonical,
      mainEntityOfPage: canonical,
      datePublished: article?.publishedAt,
      dateModified: article?.modifiedAt,
      ...(articleImage ? {image: articleImage} : {}),
      author: organization,
      publisher: organization,
      isAccessibleForFree: true,
'''
if text.count(old) != 1:
    raise SystemExit('Article JSON-LD block not found')
text = text.replace(old, new, 1)
text = text.replace(
    '''    <meta property="og:url" content={canonical} />
    <meta name="twitter:card" content="summary" />
''',
    '''    <meta property="og:url" content={canonical} />
    {articleImage && <meta property="og:image" content={articleImage} />}
    {article?.publishedAt && <meta property="article:published_time" content={article.publishedAt} />}
    {article?.modifiedAt && <meta property="article:modified_time" content={article.modifiedAt} />}
    <meta name="twitter:card" content={articleImage ? 'summary_large_image' : 'summary'} />
    {articleImage && <meta name="twitter:image" content={articleImage} />}
''',
    1,
)
layout.write_text(text, encoding='utf-8')

article = Path('src/pages/articles/pampers-newborn/index.astro')
text = article.read_text(encoding='utf-8')
import_marker = "import type {\n"
metadata_import = "import {pampersNewbornArticle as articleMetadata} from '../../../content/articles';\n"
if metadata_import not in text:
    text = text.replace(import_marker, metadata_import + import_marker, 1)
text = text.replace(
    '<BaseLayout title="パンパースの新生児用、どっち？｜くらべる商品メモ" description="パンパース肌へのいちばんとさらさらケアの新生児用テープを、公式の商品機能と確認状況で比較">',
    '<BaseLayout title={articleMetadata.title} description={articleMetadata.description} article={articleMetadata}>',
    1,
)
text = text.replace(
    '<p class="meta"><a href="/articles/">比較記事一覧</a> / おむつ · 更新日 2026-07-31</p>\n    <h1>パンパースの新生児用、どっち？「肌へのいちばん」と「さらさらケア」を比較</h1>',
    '<p class="meta"><a href="/articles/">比較記事一覧</a> / おむつ · 公開日 <time datetime={articleMetadata.publishedAt}>{articleMetadata.publishedAt}</time> · 更新日 <time datetime={articleMetadata.modifiedAt}>{articleMetadata.modifiedAt}</time></p>\n    <h1>{articleMetadata.headline}</h1>',
    1,
)
article.write_text(text, encoding='utf-8')

index = Path('src/pages/articles/index.astro')
text = index.read_text(encoding='utf-8')
text = text.replace(
    "import BaseLayout from '../../layouts/BaseLayout.astro';\n",
    "import BaseLayout from '../../layouts/BaseLayout.astro';\nimport {articleMetadata} from '../../content/articles';\n",
    1,
)
old = '''    <div class="article-list">
      <article class="card article-list-card">
        <span class="tag">育児用品</span>
        <h2><a href="/articles/pampers-newborn/">パンパースの新生児用、どっち？</a></h2>
        <p>「肌へのいちばん」と「さらさらケア」を、公式情報・販売ページ・口コミの確認状況に分けて比較します。</p>
        <a class="cta" href="/articles/pampers-newborn/">記事を読む →</a>
      </article>
    </div>
'''
new = '''    <div class="article-list">
      {articleMetadata.map((article) => (
        <article class="card article-list-card">
          <span class="tag">{article.category}</span>
          <h2><a href={article.path}>{article.headline}</a></h2>
          <p>{article.summary}</p>
          <p class="meta">更新日 <time datetime={article.modifiedAt}>{article.modifiedAt}</time></p>
          <a class="cta" href={article.path}>記事を読む →</a>
        </article>
      ))}
    </div>
'''
if text.count(old) != 1:
    raise SystemExit('article index block not found')
index.write_text(text.replace(old, new, 1), encoding='utf-8')

Path('tests/article-metadata.test.ts').write_text('''import {readFileSync} from "node:fs";
import {describe, expect, it} from "vitest";
import {
  articleMetadata,
  defineArticleMetadata,
  pampersNewbornArticle,
} from "../src/content/articles";

function extractJsonLd(html: string): Record<string, unknown>[] {
  return [...html.matchAll(/<script type="application\\/ld\\+json">([\\s\\S]*?)<\\/script>/g)].map(
    (match) => JSON.parse(match[1] ?? "{}") as Record<string, unknown>,
  );
}

describe("article metadata", () => {
  it("keeps one typed canonical source for article listings and pages", () => {
    expect(articleMetadata).toEqual([pampersNewbornArticle]);
    expect(pampersNewbornArticle.path).toBe("/articles/pampers-newborn/");
    expect(pampersNewbornArticle.modifiedAt).not.toBeLessThan(
      pampersNewbornArticle.publishedAt,
    );
  });

  it("rejects invalid and contradictory dates", () => {
    expect(() =>
      defineArticleMetadata({
        ...pampersNewbornArticle,
        publishedAt: "2026-02-30",
      }),
    ).toThrow();
    expect(() =>
      defineArticleMetadata({
        ...pampersNewbornArticle,
        publishedAt: "2026-08-01",
        modifiedAt: "2026-07-31",
      }),
    ).toThrow();
  });

  it("renders dates consistently in HTML, meta and Article JSON-LD", () => {
    const html = readFileSync("dist/articles/pampers-newborn/index.html", "utf8");
    const article = extractJsonLd(html).find((item) => item["@type"] === "Article");

    expect(article).toBeDefined();
    expect(article?.headline).toBe(pampersNewbornArticle.headline);
    expect(article?.datePublished).toBe(pampersNewbornArticle.publishedAt);
    expect(article?.dateModified).toBe(pampersNewbornArticle.modifiedAt);
    expect(article?.url).toBe(article?.mainEntityOfPage);
    expect(article).not.toHaveProperty("image");
    expect(html).toContain(
      `<meta property="article:published_time" content="${pampersNewbornArticle.publishedAt}">`,
    );
    expect(html).toContain(
      `<meta property="article:modified_time" content="${pampersNewbornArticle.modifiedAt}">`,
    );
    expect(html).toContain(`datetime="${pampersNewbornArticle.publishedAt}"`);
    expect(html).toContain(`datetime="${pampersNewbornArticle.modifiedAt}"`);
  });

  it("keeps ordinary pages as WebPage without article dates", () => {
    const html = readFileSync("dist/about/index.html", "utf8");
    const data = extractJsonLd(html);
    expect(data.some((item) => item["@type"] === "WebPage")).toBe(true);
    expect(html).not.toContain("article:published_time");
  });
});
''', encoding='utf-8')

Path('.github/workflows/verify.yml').write_bytes(
    subprocess.check_output(['git', 'show', 'origin/feat/affiliate-site-foundation:.github/workflows/verify.yml'])
)
Path(__file__).unlink(missing_ok=True)

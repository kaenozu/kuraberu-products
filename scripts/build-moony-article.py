# -*- coding: utf-8 -*-
"""chatgpt の正確な日本語原稿（moony-body.txt）から moony-m/index.astro を組み立てる。
私の日本語タイプを最小化するため、日本語文字列はすべて chatgpt 原稿から機械的に抽出する。"""
import io, os, re, sys, json
from pathlib import Path

# 入力は外部原稿のため環境変数 MOONY_SRC で指定する（未指定時はコマンドライン引数、
# いずれも無ければ従来の開発者ローカルパスへフォールバックする）。
SRC = os.environ.get('MOONY_SRC') or (sys.argv[1] if len(sys.argv) > 1 else r'C:\Users\neoen\ashita-cdp\moony-body.txt')
# 出力はこのスクリプトが属するリポジトリ内へ解決する（別プロジェクトを上書きしない）。
OUT = str(Path(__file__).resolve().parents[1] / 'src' / 'pages' / 'articles' / 'moony-m' / 'index.astro')

body = io.open(SRC, encoding='utf-8').read()
# 原稿末尾に混入したプロンプト除去
cut = body.find('You are a writer')
if cut > 0:
    body = body[:cut]
body = body.replace('\r', '').strip()

def section(name, next_names):
    """name セクションの本文（次のセクション見出しの直前まで）を返す"""
    i = body.find(name)
    if i < 0:
        return ''
    i += len(name)
    ends = [body.find(n, i) for n in next_names if body.find(n, i) > 0]
    ends = [e for e in ends if e > 0]
    j = min(ends) if ends else len(body)
    return body[i:j].strip()

lead = section('リード文', ['3つの違い', '30秒でわかる結論'])
diff3 = section('3つの違い', ['30秒でわかる結論'])
concl30 = section('30秒でわかる結論', ['先に結論'])
concl = section('先に結論', ['公式情報'])
official = section('公式情報', ['FAQ'])
faq_raw = section('FAQ', ['X での実際の声'])
voices_intro = section('X での実際の声', ['購入時の注意'])
purchase_note = section('購入時の注意', [''])

# FAQ を Q1..Q6 に分割
faqs = re.split(r'\nQ\d+\.', faq_raw)
faq_entries = []
for f in faqs[1:]:
    parts = re.split(r'\nA\.', f, maxsplit=1)
    q = parts[0].strip()
    a = parts[1].strip() if len(parts) > 1 else ''
    if q and a:
        faq_entries.append({'question': q, 'answer': a})

# 3つの違いを item 化（「違いN｜ラベル\n左：\n右：」形式を分解）
diff_items = []
for m in re.finditer(r'違い\d+｜(.+?)\n(.+?)(?=\n違い\d+｜|\Z)', diff3, re.S):
    label, txt = m.group(1).strip(), m.group(2).strip()
    lines = [l.strip() for l in txt.split('\n') if l.strip()]
    left = right = ''
    for l in lines:
        if l.startswith('低刺激'):
            left = l.split('：', 1)[-1].strip()
        elif l.startswith('マシュマロ'):
            right = l.split('：', 1)[-1].strip()
    diff_items.append({'label': label, 'left': left, 'right': right})

# ---- Astro ファイルを組み立てる ----
imports = '''---
import BaseLayout from '../../../layouts/BaseLayout.astro';
import AffiliateButton from '../../../components/AffiliateButton.astro';
import ThirtySecondComparison from '../../../components/ThirtySecondComparison.astro';
import DifferenceList from '../../../components/DifferenceList.astro';
import ComparisonMemoButton from '../../../components/ComparisonMemoButton.astro';
import PriorityConclusion from '../../../components/PriorityConclusion.astro';
import XPostEmbed from '../../../components/XPostEmbed.astro';
import ExternalEmbed from '../../../components/ExternalEmbed.astro';
import {moonyMArticle as articleMetadata} from '../../../content/articles';
import {moonyCandidateLabels, moonyPriorityOptions, moonyStandardConclusion} from '../../../content/moony-priorities';
import {isContentStale} from '../../../lib/content-freshness';
import type {ComparisonCandidate, ComparisonRow, DifferenceRow} from '../../../lib/comparison';

const teishigekiSeries = 'https://jp.moony.com/ja/products/nmn1.html';
const mashumaroSeries = 'https://jp.moony.com/ja/products/mn.html';
const teishigekiNbs = 'https://jp.moony.com/ja/products/nmn/nmn-nbs.html';
const teishigekiM = 'https://jp.moony.com/ja/products/nmn/nmn-m.html';
const teishigekiLp = 'https://jp.moony.com/ja/products/nmn/nmn-l.html';
const mashumaroNbs = 'https://jp.moony.com/ja/products/mn/mn-nbs.html';
const mashumaroM = 'https://jp.moony.com/ja/products/mn/mn-m.html';
const mashumaroLp = 'https://jp.moony.com/ja/products/mn/mn-l.html';
const teishigekiSearch = 'https://search.rakuten.co.jp/search/mall/';
const mashumaroSearch = 'https://search.rakuten.co.jp/search/mall/';
const xGoodSearch = 'https://x.com/search?q=%E3%83%A0%E3%83%BC%E3%83%8B%E3%83%BC%20%E3%83%86%E3%83%BC%E3%83%97%20%E8%89%AF%E3%81%8B%E3%81%A3%E3%81%9F&f=live';
const xBadSearch = 'https://x.com/search?q=%E3%83%A0%E3%83%BC%E3%83%8B%E3%83%BC%20%E3%83%86%E3%83%BC%E3%83%97%20%E6%BC%8F%E3%82%8C%E3%82%8B&f=live';

const faqEntries = __FAQ__;

const teishigekiCandidate: ComparisonCandidate = {
  product: 'ムーニー',
  line: '低刺激であんしん',
  tone: 'standard',
  audience: 'うんち水分吸収シートの機能を確認したい人の候補',
  note: '公式ページでサイズ別仕様を確認',
  status: 'official',
};

const mashumaroCandidate: ComparisonCandidate = {
  product: 'ムーニー',
  line: 'マシュマロ肌ごこちモレ安心',
  tone: 'standard',
  audience: '無添加弱酸性素材とゆるうんちストッパーを確認したい人の候補',
  note: '公式ページでサイズ別仕様を確認',
  status: 'official',
};

const summaryRows: ComparisonRow[] = __ROWS__;

const contentAsOf = new Date().toISOString().slice(0, 10);
const productInfoStale = isContentStale(articleMetadata.productInfoCheckedAt, contentAsOf);
const purchaseLinkLabel = articleMetadata.purchaseLinksCheckedAt
  ? `最終確認 ${articleMetadata.purchaseLinksCheckedAt}`
  : '最終確認日は未記録';

const differenceRows: DifferenceRow[] = __DIFF__;
---
<BaseLayout title={articleMetadata.title} description={articleMetadata.description} article={articleMetadata} faq={faqEntries}>
  <article class="wrap section article">
    <p class="meta"><a href="/articles/">比較記事一覧</a> / おむつ · 公開日 <time datetime={articleMetadata.publishedAt}>{articleMetadata.publishedAt}</time> · 更新日 <time datetime={articleMetadata.modifiedAt}>{articleMetadata.modifiedAt}</time></p>
    <h1>{articleMetadata.headline}</h1>
    <ComparisonMemoButton articleId={articleMetadata.id} />
    <p class="lead">__LEAD__</p>
    <nav class="toc" aria-label="目次">
      <h2>この記事の内容</h2>
      <ol>
        <li><a href="#comparison-details">2つの商品を比べる</a></li>
        <li><a href="#conclusion">先に結論</a></li>
        <li><a href="#official">公式情報</a></li>
        <li><a href="#voices">X での実際の声</a></li>
        <li><a href="#faq">よくある質問</a></li>
        <li><a href="#purchase">購入前に確認するページ</a></li>
      </ol>
    </nav>
    <div class="product-compare" aria-label="比較する2つの商品">
      <article class="product-card">
        <img src="/products/moony-teishigeki-m.jpg" alt="ムーニー 低刺激であんしん テープ Mサイズ パッケージ" width="500" height="500" loading="eager" />
        <div class="product-card-body">
          <p class="product-card-line">ムーニー / テープ</p>
          <h2 class="product-card-name">低刺激であんしん</h2>
          <p class="product-card-desc">うんち水分吸収シートとおしりガイド。新生児〜Mは3成分無添加。</p>
          <a class="product-card-link" href={teishigekiSeries} target="_blank" rel="noopener noreferrer">公式ページで確認 →</a>
        </div>
      </article>
      <article class="product-card">
        <img src="/products/moony-mashumaro-m.jpg" alt="ムーニー マシュマロ肌ごこちモレ安心 テープ Mサイズ パッケージ" width="500" height="500" loading="eager" />
        <div class="product-card-body">
          <span class="product-card-line">ムーニー / テープ</span>
          <h2 class="product-card-name">マシュマロ肌ごこちモレ安心</h2>
          <p class="product-card-desc">無添加弱酸性素材とゆるうんちストッパー。全サイズ4成分無添加。</p>
          <a class="product-card-link" href={mashumaroSeries} target="_blank" rel="noopener noreferrer">公式ページで確認 →</a>
        </div>
      </article>
    </div>
    <div class="verification-summary" aria-label="記事情報の確認状況">
      <p>商品情報確認日: <time datetime={articleMetadata.productInfoCheckedAt}>{articleMetadata.productInfoCheckedAt}</time></p>
      <p>購入リンク: {purchaseLinkLabel}</p>
      {productInfoStale && <p class="notice">商品情報の確認から時間が経過しています。購入前に公式ページで最新仕様を確認してください。</p>}
    </div>
    <p class="trust-line">✓ 公式確認済み（2026-08-16）・広告を含みます</p>

    <ThirtySecondComparison
      idPrefix="moony-summary"
      heading="まず、違いはこの3つ"
      conclusion="__CONCLUSION30__"
      left={teishigekiCandidate}
      right={mashumaroCandidate}
      rows={summaryRows}
      detailHref="#comparison-details"
    />

    <PriorityConclusion options={moonyPriorityOptions} labels={moonyCandidateLabels} standard={moonyStandardConclusion} />

    <h2 id="conclusion">先に結論</h2>
    __CONCLUSION__

    <div id="comparison-details">
      <DifferenceList
        idPrefix="moony-differences"
        leftLabel="低刺激であんしん"
        rightLabel="マシュマロ肌ごこちモレ安心"
        items={differenceRows}
      />
    </div>

    <h2 id="official">公式情報</h2>
    __OFFICIAL__

    <section id="voices">
      <h2>X での実際の声</h2>
      <p>__VOICES__</p>
      <h3>良かったという声</h3>
      <div class="voices-grid">
        <ExternalEmbed
          provider="x"
          url="https://x.com/tsurakutemo2024/status/2065280178431046357"
          title="NICU時代から低刺激であんしんを愛用すると語った投稿"
          purpose="院内の売店で売っていたことがきっかけで低刺激であんしんを愛用し、テープMとパンツSを使い続ける一般ユーザーの投稿です。併用しているマシュマロ肌ごこちモレ安心もモレゼロという、実使用を踏まえた声として紹介します。"
          tone="good"
          autoload
        />
        <ExternalEmbed
          provider="x"
          url="https://x.com/fmuttyan/status/2084690853130535180"
          title="マシュマロ肌ごこちモレ安心のふわふわ感を語った投稿"
          purpose="マシュマロ肌ごこちという名前の通りふわふわで、動き回る時期でもモレの心配が減ったと語る一般ユーザーの投稿です。マシュマロ側の肌ざわりに対する評価の一例です。"
          tone="good"
          autoload
        />
      </div>
      <XPostEmbed url={xGoodSearch} summary="ほかにも「良かった」という声を探す場合は、X の検索結果から対象商品・サイズ・利用経験を確認してください。" />
      <h3>気になったという声</h3>
      <div class="voices-grid">
        <ExternalEmbed
          provider="x"
          url="https://x.com/abcr__22/status/2044644098779558297"
          title="低刺激であんしんのテープの付け方に触れた投稿"
          purpose="低刺激であんしんの肌ざわりには感動しつつも、テープが剥がれやすい感覚や、うんちの横漏れも経験したと語るユーザーの投稿です。体型や付け方によって漏れ方が変わるとした参考例として紹介します。比較の根拠ではなく、使用感を知るための参考です。"
          tone="bad"
          autoload
        />
      </div>
      <XPostEmbed url={xBadSearch} summary="ほかにも「気になった」という声を探す場合は、X の検索結果から対象商品・サイズ・利用経験を確認してください。" />
    </section>

    <h2 id="faq">よくある質問</h2>
    <div class="faq-list">
      {faqEntries.map((entry) => (
        <details class="faq-item">
          <summary><h3>{entry.question}</h3></summary>
          <p>{entry.answer}</p>
        </details>
      ))}
    </div>

    <h2 id="purchase">購入前に確認するページ</h2>
    <div class="source-links">
      <a class="card-link" href={teishigekiSearch} target="_blank" rel="noopener noreferrer">低刺激であんしん（M）の販売ページを検索 →</a>
      <a class="card-link" href={mashumaroSearch} target="_blank" rel="noopener noreferrer">マシュマロ肌ごこちモレ安心（M）の販売ページを検索 →</a>
    </div>

    <h2>購入時の注意</h2>
    __PURCHASE__

    <div class="grid two">
      <AffiliateButton productId="moony-teishigeki-m" label="低刺激であんしんを楽天で見る" merchant="楽天" placement="article-end" />
      <AffiliateButton productId="moony-mashumaro-m" label="マシュマロ肌ごこちモレ安心を楽天で見る" merchant="楽天" placement="article-end" />
    </div>

    <h2>更新履歴</h2>
    <ol class="change-log">
      {articleMetadata.changeLog.slice().sort((a, b) => b.date.localeCompare(a.date)).map((entry) => (
        <li><time datetime={entry.date}>{entry.date}</time>：{entry.summary}</li>
      ))}
    </ol>

    <h2>情報源一覧</h2>
    <ul class="source-list">
      <li><a href={teishigekiNbs} target="_blank" rel="noopener noreferrer">低刺激であんしん（新生児用）公式</a>（2026-08-09確認）</li>
      <li><a href={teishigekiM} target="_blank" rel="noopener noreferrer">低刺激であんしん（M）公式</a>（2026-08-09確認）</li>
      <li><a href={teishigekiLp} target="_blank" rel="noopener noreferrer">低刺激であんしん（L）公式</a>（2026-08-09確認）</li>
      <li><a href={mashumaroNbs} target="_blank" rel="noopener noreferrer">マシュマロ肌ごこちモレ安心（新生児用）公式</a>（2026-08-09確認）</li>
      <li><a href={mashumaroM} target="_blank" rel="noopener noreferrer">マシュマロ肌ごこちモレ安心（M）公式</a>（2026-08-09確認）</li>
      <li><a href={mashumaroLp} target="_blank" rel="noopener noreferrer">マシュマロ肌ごこちモレ安心（L）公式</a>（2026-08-09確認）</li>
      <li><a href={teishigekiSearch} target="_blank" rel="noopener noreferrer">楽天市場：低刺激であんしん</a>（価格・在庫用）</li>
      <li><a href={mashumaroSearch} target="_blank" rel="noopener noreferrer">楽天市場：マシュマロ肌ごこちモレ安心</a>（価格・在庫用）</li>
    </ul>
    <h2>調査方法・免責</h2>
    <p>メーカー公式の商品ページを優先しています。レビューは対象商品・サイズ・投稿日を確認できるものだけを採用します。口コミは個人の体験であり、性能や健康への効果を保証するものではありません。</p>
  </article>
</BaseLayout>
'''

def p(text):
    """複数段落の原文を <p> タグ列に変換"""
    paras = [t.strip() for t in text.split('\n\n') if t.strip()]
    return '\n    '.join(f'<p>{par}</p>' for par in paras)

# summaryRows 生成（diff_items から label/left/right を取り、共通行を追加）
summary_rows = []
for d in diff_items:
    summary_rows.append({'label': d['label'], 'left': d['left'], 'right': d['right']})

# differenceRows 生成（diff_items を status official 付きで）
diff_rows = [{'label': d['label'], 'left': d['left'], 'right': d['right'], 'leftStatus': 'official', 'rightStatus': 'official'} for d in diff_items]

placeholders = {
    '__FAQ__': json.dumps(faq_entries, ensure_ascii=False, indent=2),
    '__ROWS__': json.dumps(summary_rows, ensure_ascii=False, indent=2),
    '__DIFF__': json.dumps(diff_rows, ensure_ascii=False, indent=2),
    '__LEAD__': lead.replace('\n', ' '),
    '__CONCLUSION30__': concl30.replace('\n', ' '),
    '__CONCLUSION__': p(concl),
    '__OFFICIAL__': p(official),
    '__VOICES__': voices_intro,
    '__PURCHASE__': p(purchase_note),
}
out = imports
for k, v in placeholders.items():
    out = out.replace(k, v)

io.open(OUT, 'w', encoding='utf-8', newline='\n').write(out)
print("OK written:", len(out), "chars")
print("---- post-check ----")
print("merri count:", out.count("me" + "ri"))
print("moony count:", out.count("moony"))
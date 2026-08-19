/**
 * config/article-templates.mjs
 *
 * 記事テンプレートのコンポーネント順序を定義する。
 * 品質ゲート (scripts/check-rendered-html.mjs) がレンダリング済みHTMLと
 * 照合し、意図しない構成の変更を検出する。
 */

export const COMPARISON_MANUAL_TEMPLATE = {
  type: "comparison-manual",
  label: "手動比較記事",
  required: [
    { marker: "class:meta", description: "バックリンク・日付" },
    { marker: "h1", description: "記事見出し" },
    { marker: "class:article-comparison-v2", description: "比較コア" },
    { marker: "id:faq|よくある質問", description: "FAQセクション" },
    { marker: "class:purchase-cards", description: "購入カード" },
  ],
  optional: [
    {
      marker: "id:official|id:specs|公式情報",
      description: "公式情報セクション",
    },
    { marker: "class:lead", description: "リード文" },
    { marker: "class:jump-nav", description: "ページ内ジャンプ" },
    { marker: "class:sns-embeds|ArticleSocialProof", description: "SNS投稿" },
    { marker: "購入時の注意", description: "購入時の注意セクション" },
    { marker: "更新履歴", description: "更新履歴セクション" },
    { marker: "情報源一覧", description: "情報源一覧セクション" },
  ],
  forbidden: [
    {
      pattern: "class:quick-verdict",
      reason: "ArticleQuickVerdict は統合済み",
    },
    {
      pattern: "class:thirty-second",
      reason: "ArticleThirtySecondComparison は統合済み",
    },
  ],
};

export const COMPARISON_COMMERCIAL_TEMPLATE = {
  type: "comparison-commercial",
  label: "自動生成比較記事",
  required: [
    { marker: "class:meta", description: "バックリンク・日付" },
    { marker: "h1", description: "記事見出し" },
    {
      marker:
        "id:key-differences|id:conclusion|違いを確認|比較テーブル|conclusion",
      description: "違い・結論セクション",
    },
    { marker: "id:faq|よくある質問", description: "FAQセクション" },
    { marker: "class:purchase-cards", description: "購入カード" },
  ],
  optional: [
    {
      marker: "id:official|公式の確認先|公式情報",
      description: "公式情報セクション",
    },
    {
      marker: "id:decision-guide|選ぶときの確認順",
      description: "選び方セクション",
    },
  ],
  forbidden: [
    {
      pattern: "class:article-comparison-v2",
      reason: "自動記事に ArticleComparisonV2 は不要",
    },
  ],
};

export const GUIDE_TEMPLATE = {
  type: "guide",
  label: "商品ガイド",
  required: [
    { marker: "class:meta", description: "バックリンク・日付" },
    { marker: "h1", description: "記事見出し" },
    {
      marker:
        "id:key-differences|id:conclusion|違いを確認|比較テーブル|conclusion",
      description: "違い・結論セクション",
    },
  ],
  optional: [
    {
      marker: "id:official|公式の確認先|公式情報",
      description: "公式情報セクション",
    },
    { marker: "id:faq|よくある質問", description: "FAQセクション" },
    { marker: "class:purchase-cards", description: "購入カード" },
  ],
  forbidden: [
    {
      pattern: "class:article-comparison-v2",
      reason: "商品ガイドに ArticleComparisonV2 は不要",
    },
  ],
};

export const ARTICLE_TEMPLATES = {
  "comparison-manual": COMPARISON_MANUAL_TEMPLATE,
  "comparison-commercial": COMPARISON_COMMERCIAL_TEMPLATE,
  guide: GUIDE_TEMPLATE,
};

export function validateArticleTemplate(html, template) {
  const found = [];
  const missing = [];

  for (const { marker } of template.required) {
    if (marker.includes("|")) {
      const patterns = marker.split("|");
      const matched = patterns.some((p) => htmlMatchesMarker(html, p));
      if (matched) found.push(marker);
      else missing.push(marker);
    } else if (htmlMatchesMarker(html, marker)) {
      found.push(marker);
    } else {
      missing.push(marker);
    }
  }

  const positions = found.map((m) => findMarkerPosition(html, m));
  const orderOk =
    positions.length === found.length &&
    positions.every((pos, i) => i === 0 || pos >= positions[i - 1]);

  const forbiddenHits = [];
  for (const { pattern, reason } of template.forbidden ?? []) {
    if (htmlMatchesMarker(html, pattern)) {
      forbiddenHits.push({ pattern, reason });
    }
  }

  return { found, missing, orderOk, forbiddenHits };
}

function htmlMatchesMarker(html, marker) {
  if (marker.startsWith("class:")) {
    const cls = marker.slice(6);
    // Check if class attribute contains the class name
    // Handles: class="foo", class="foo bar", class="bar foo"
    const dq1 = html.indexOf('class="' + cls + '"');
    const dq2 = html.indexOf('class="' + cls + " ");
    const dq3 = html.indexOf(" " + cls + '"');
    const sq1 = html.indexOf("class='" + cls + "'");
    const sq2 = html.indexOf("class='" + cls + " ");
    const sq3 = html.indexOf(" '" + cls + "'");
    return (
      dq1 !== -1 ||
      dq2 !== -1 ||
      dq3 !== -1 ||
      sq1 !== -1 ||
      sq2 !== -1 ||
      sq3 !== -1
    );
  }
  if (marker.startsWith("id:")) {
    const id = marker.slice(3);
    return html.indexOf('id="' + id + '"') !== -1;
  }
  return html.indexOf(marker) !== -1;
}

function findMarkerPosition(html, marker) {
  if (marker.includes("|")) {
    const patterns = marker.split("|");
    let minPos = Infinity;
    for (const p of patterns) {
      const pos = findSingleMarkerPosition(html, p);
      if (pos < minPos) minPos = pos;
    }
    return minPos;
  }
  return findSingleMarkerPosition(html, marker);
}

function findSingleMarkerPosition(html, marker) {
  if (marker.startsWith("class:")) {
    const cls = marker.slice(6);
    let minPos = Infinity;
    const positions = [
      html.indexOf('class="' + cls + '"'),
      html.indexOf('class="' + cls + " "),
      html.indexOf(" " + cls + '"'),
    ];
    for (const pos of positions) {
      if (pos !== -1 && pos < minPos) minPos = pos;
    }
    return minPos;
  }
  if (marker.startsWith("id:")) {
    const id = marker.slice(3);
    const idx = html.indexOf('id="' + id + '"');
    return idx === -1 ? Infinity : idx;
  }
  const idx = html.indexOf(marker);
  return idx === -1 ? Infinity : idx;
}

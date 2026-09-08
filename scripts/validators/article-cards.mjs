// 記事カード・トップ検索・ヘッダ・比較ラベル等の検査（#702 で分離）。

function collectArticleCards(html) {
  const cards = [];
  for (const match of html.matchAll(
    /<article\b[^>]*class="[^"]*\barticle-list-card\b[^"]*"[^>]*>[\s\S]*?<\/article>/gi,
  )) {
    const card = match[0];
    if (!/\bdata-content-type="(?:guide|comparison)"/.test(card)) continue;
    cards.push(card);
  }
  return cards;
}

export function validateArticleCardThumbnails(relative, html) {
  const errors = [];
  for (const card of collectArticleCards(html)) {
    const thumb = card.match(/\bdata-thumb="([^"]+)"/)?.[1] ?? null;
    const hasImg = /<img\b[^>]*class="[^"]*\bcard-thumb\b[^"]*"/.test(card);
    const tileMatch = card.match(
      /<div\b[^>]*class="[^"]*\bcard-tile\b[^"]*"[^>]*>[\s\S]*?<span\b[^>]*class="[^"]*\bcard-tile-label\b[^"]*"[^>]*>([\s\S]*?)<\/span>[\s\S]*?<\/div>/,
    );
    const hasTile = tileMatch !== null;
    const tileLabel = tileMatch?.[1]?.trim() ?? "";

    if (thumb !== "image" && thumb !== "tile") {
      errors.push(
        `${relative}: article card must declare data-thumb="image|tile", found ${JSON.stringify(thumb)}`,
      );
      continue;
    }
    if (thumb === "image" && (!hasImg || hasTile)) {
      errors.push(
        `${relative}: data-thumb="image" card must render exactly one img.card-thumb (img=${hasImg}, tile=${hasTile})`,
      );
    }
    if (thumb === "tile" && (hasImg || !hasTile || tileLabel.length === 0)) {
      errors.push(
        `${relative}: data-thumb="tile" card must render a card-tile with a non-empty label (img=${hasImg}, tile=${hasTile}, label=${JSON.stringify(tileLabel)})`,
      );
    }
  }
  return errors;
}

// トップページのファーストビューには商品検索フォームが必須。
// 送信先は記事一覧の /articles/?q=…（article-discovery.js が URL パラメータを読む）。
export function validateTopSearch(relative, html) {
  if (relative !== "index.html") return [];
  const errors = [];
  const form = html.match(
    /<form\b[^>]*\bdata-top-search\b[^>]*>([\s\S]*?)<\/form>/i,
  );
  if (!form) {
    errors.push(
      "index.html: top page must render a search form with data-top-search",
    );
    return errors;
  }
  if (
    !/<form\b[^>]*\bdata-top-search\b[^>]*action="\/articles\/"/i.test(html)
  ) {
    errors.push(
      'index.html: top search form must submit to action="/articles/"',
    );
  }
  if (!/<input\b[^>]*name="q"/.test(form[1])) {
    errors.push("index.html: top search form must contain an input named q");
  }
  if (!/<button\b[^>]*type="submit"/.test(form[1])) {
    errors.push("index.html: top search form must contain a submit button");
  }
  return errors;
}

// 記事カードには「向き」（選び分け）の1行が必須（audiences 由来）。
// 記事一覧の検索結果カード（article-discovery.js の createCard）も同じ行を
// 描画するため、静的カード側の欠落を fail-closed で検出する。
export function validateArticleCardAudiences(relative, html) {
  const errors = [];
  for (const card of collectArticleCards(html)) {
    const line =
      card.match(
        /<p\b[^>]*class="[^"]*\bcard-audiences\b[^"]*"[^>]*>([\s\S]*?)<\/p>/,
      )?.[1] ?? "";
    if (!line.trim()) {
      errors.push(
        `${relative}: article card must render a card-audiences line with the 向き selection`,
      );
    }
  }
  return errors;
}

// 比較記事カードには「型番行」（card-subjects）が必須。
// comparisonSubjects 由来の A/B 商品名（型番・シリーズ名）を欠落させると、
// 「探す場所」としてのカードが成立しないため fail-closed で検出する。
// 商品ガイド（productCount = 1）はペアを持たないため対象外。
export function validateArticleCardSubjects(relative, html) {
  const errors = [];
  for (const card of collectArticleCards(html)) {
    if (!/\bdata-content-type="comparison"/.test(card)) continue;
    const line =
      card.match(
        /<p\b[^>]*class="[^"]*\bcard-subjects\b[^"]*"[^>]*>([\s\S]*?)<\/p>/,
      )?.[1] ?? "";
    if (!line.trim()) {
      errors.push(
        `${relative}: comparison article card must render a card-subjects line with the A/B model numbers`,
      );
    }
  }
  return errors;
}

// 全ページのヘッダーは「ロゴ + ハンバーガー（details.nav-toggle） + リンク群（nav.navlinks）」
// 構造であることが必須。スマホ（<560px）では details のネイティブ開閉でドロワー表示に
// なるため、この構造が無いページはモバイルメニューを持たない（fail-closed）。
export function validateHeaderNav(relative, html) {
  const errors = [];
  const header = html.match(/<header\b[^>]*>[\s\S]*?<\/header>/i)?.[0] ?? "";
  if (!header) {
    errors.push(`${relative}: page must render a header`);
    return errors;
  }
  // details の内側だけを対象に summary / navlinks の有無を判定する
  // （<summary> が details の外に置かれた場合を検出するため）。
  const toggle =
    header.match(
      /<details\b[^>]*class="[^"]*\bnav-toggle\b[^"]*"[^>]*>([\s\S]*?)<\/details>/i,
    )?.[1] ?? null;
  if (toggle === null) {
    errors.push(
      `${relative}: header must render the mobile menu (<details class="nav-toggle">)`,
    );
    return errors;
  }
  if (!/<summary/i.test(toggle)) {
    errors.push(
      `${relative}: nav-toggle must contain a <summary> (hamburger trigger)`,
    );
  }
  if (!/<nav\b[^>]*class="[^"]*\bnavlinks\b[^"]*"[^>]*>/i.test(toggle)) {
    errors.push(
      `${relative}: nav-toggle must contain the nav.navlinks link group`,
    );
  }
  return errors;
}

// 比較表（table.comparison）を描画するページは、スマホの比較カード表示で各セルに
// 商品名ラベル（data-label）を付与するスクリプト（BaseLayout の comparison-card-labels）
// が必ず同梱されている必要がある（fail-closed）。
export function validateComparisonCardLabels(relative, html) {
  const errors = [];
  const tables = [
    ...html.matchAll(
      /<table\b[^>]*class="[^"]*\bcomparison\b[^"]*"[^>]*>[\s\S]*?<\/table>/gi,
    ),
  ];
  if (tables.length === 0) {
    return errors;
  }
  if (!/comparison-card-labels/.test(html)) {
    errors.push(
      `${relative}: pages with a comparison table must include the comparison-card-labels script`,
    );
  }
  // スマホの縦カード表示は静的 HTML の data-label で成立させる（JS はフォールバック）。
  // 全セルに data-label が焼き込まれていることを fail-closed で検証する。
  for (const table of tables) {
    const body = table[0].match(/<tbody>([\s\S]*?)<\/tbody>/i)?.[1] ?? "";
    for (const row of body.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
      const cells = [...row[1].matchAll(/<td\b[^>]*>/gi)];
      for (const cell of cells) {
        if (!/\bdata-label\s*=\s*"/.test(cell[0])) {
          errors.push(
            `${relative}: comparison table cells must carry a data-label (mobile card view needs it)`,
          );
          break;
        }
      }
    }
  }
  return errors;
}

// 「根拠・確認先」列（4列目）を持つ比較表は、スマホでは
export function validateSourceToggle(_relative, _html) {
  // source-toggle was removed in P2-2 (empty <details> with no content).
  // This function is kept for backward compatibility but is now a no-op.
  void _relative;
  void _html;
  return [];
}

// 期待 CTA 枚数は、記事メタデータの商品数（productCount）と
// config/article-layout.mjs（ARTICLE_LAYOUT.ctaSets）から記事ごとに導出する。
// 比較記事（productCount=2）→ 2枚、単一商品記事（productCount=1）→ 1枚（v3）。
// レイアウト変更時は config だけを直し、ここに枚数をハードコードしない。

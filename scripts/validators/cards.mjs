/**
 * scripts/validators/cards.mjs
 *
 * 記事カード・ヘッダー・比較表・トップページのゲート。
 * カード収集は DOM ベース（正規表現の非貪欲マッチより堅牢）。
 * 振る舞い（件数・メッセージ）は従来どおり。
 */
import { parseDocument } from "./html-dom.mjs";

// 記事カード（ArticleCard.astro）は常に 132px のサムネイル枠を持つ。
// 画像あり = <img class="card-thumb">、画像なし = カテゴリ名のテキストタイル
// （<div class="card-tile">）。data-thumb 属性と実際の要素を照合し、
// サムネイル欠落・二重表示を fail-closed で検出する。
// 対象は ArticleCard.astro が出力するカード（data-content-type を持つ）のみ。
// 関連記事（RelatedArticles.astro）・比較メモ・商品診断カードは別コンポーネントのため対象外。
function collectArticleCards(html) {
  return parseDocument(html)
    .querySelectorAll("article.article-list-card")
    .filter((card) => {
      const contentType = card.getAttribute("data-content-type") ?? "";
      return contentType === "guide" || contentType === "comparison";
    });
}

export function validateArticleCardThumbnails(relative, html) {
  const errors = [];
  for (const card of collectArticleCards(html)) {
    const thumb = card.getAttribute("data-thumb");
    const hasImg = card.querySelector("img.card-thumb") !== null;
    const tile = card.querySelector("div.card-tile");
    const hasTile = tile !== null;
    const tileLabel =
      tile?.querySelector("span.card-tile-label")?.text.trim() ?? "";

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
  const root = parseDocument(html);
  const form = root.querySelector("form[data-top-search]");
  if (!form) {
    errors.push(
      "index.html: top page must render a search form with data-top-search",
    );
    return errors;
  }
  if (form.getAttribute("action") !== "/articles/") {
    errors.push(
      'index.html: top search form must submit to action="/articles/"',
    );
  }
  if (!form.querySelector('input[name="q"]')) {
    errors.push("index.html: top search form must contain an input named q");
  }
  if (!form.querySelector('button[type="submit"]')) {
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
    const line = card.querySelector("p.card-audiences")?.text.trim() ?? "";
    if (!line) {
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
    if (card.getAttribute("data-content-type") !== "comparison") continue;
    const line = card.querySelector("p.card-subjects")?.text.trim() ?? "";
    if (!line) {
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
  const root = parseDocument(html);
  const header = root.querySelector("header");
  if (!header) {
    errors.push(`${relative}: page must render a header`);
    return errors;
  }
  // details の内側だけを対象に summary / navlinks の有無を判定する
  // （<summary> が details の外に置かれた場合を検出するため）。
  const toggle = header.querySelector("details.nav-toggle");
  if (toggle === null) {
    errors.push(
      `${relative}: header must render the mobile menu (<details class="nav-toggle">)`,
    );
    return errors;
  }
  if (!toggle.querySelector("summary")) {
    errors.push(
      `${relative}: nav-toggle must contain a <summary> (hamburger trigger)`,
    );
  }
  if (!toggle.querySelector("nav.navlinks")) {
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
  const root = parseDocument(html);
  const tables = root.querySelectorAll("table.comparison");
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
    const body = table.querySelector("tbody");
    const rows = body ? body.querySelectorAll("tr") : [];
    for (const row of rows) {
      const cells = row.querySelectorAll("td");
      for (const cell of cells) {
        if (cell.getAttribute("data-label") === null) {
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

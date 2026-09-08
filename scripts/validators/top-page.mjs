// トップページ検査（#702 で分離）。

export function validateTopPageCategories(topHtml, articlesIndexHtml) {
  const errors = [];
  const categoryLinks = [
    ...topHtml.matchAll(/href="\/articles\/\?category=([^"]+)"/g),
  ].map((match) => decodeURIComponent(match[1]));
  const knownCategories = [
    ...articlesIndexHtml.matchAll(/<option value="([^"]+)">/g),
  ].map((match) => match[1]);
  if (!knownCategories.length) {
    errors.push(
      "top page: cannot validate categories: no category options found in /articles/",
    );
    return errors;
  }
  for (const category of categoryLinks) {
    if (!knownCategories.includes(category)) {
      errors.push(
        `top page: category entry points to an unknown category: ${category}`,
      );
    }
  }
  return errors;
}

// トップページ（dist/index.html）の新着比較セクションを検証する。
export function validateTopPageLatest(topHtml) {
  return /<section\b[^>]*data-top-latest[^>]*>[\s\S]*?<\/section\s*>/i.test(
    topHtml,
  )
    ? []
    : ["top page: missing data-top-latest section"];
}

// 見出しの直後に本文（テキスト・要素）が無い「空セクション」を検出する。
// 次のいずれかに該当する見出しを空セクションとみなす。
// - 見出しの直後に別の見出し（h1〜h6）が続く
// - 見出しの直後に構造的な閉じタグ（main / article / section / details / body / html）が続く
// - 見出しの直後に空要素（例: <p></p>）が続く
// - 見出しが文書末尾にある
// FAQ の <summary><h3>…</h3></summary> は見出しの直後に閉じタグが来るが、
// summary 自体が本文を持つため検出対象から除外する。

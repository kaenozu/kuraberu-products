// テンプレートトークン・日本語表記ゆれ検査（#702 で分離）。

export const TEMPLATE_TOKEN_PATTERNS = [
  { pattern: /\{\{[^{}]{0,200}\}\}/, label: "{{...}}" },
  { pattern: /\$\{[^}]{0,200}\}/, label: "${...}" },
  // %TOKEN% は URL エンコード断片（%E3%81…）を誤検知しないよう
  // 内側 4 文字以上の大文字スネークケースに限定する（エンコードは常に 2 桁）。
  // ただし `%BB6142%` のように、エンコード済みバイト（%BB）へ
  // 商品番号が続く形もあるため、先頭2文字が16進数の断片は除外する。
  {
    pattern: /%(?![0-9A-F]{2}[A-Z0-9_])[A-Z][A-Z0-9_]{3,}%/,
    label: "%TOKEN%",
  },
  { pattern: /\[object Object\]/, label: "[object Object]" },
];

function stripScriptAndStyleContents(html) {
  return html.replace(
    /<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,
    (_match, tagName) => `<${tagName}></${tagName}>`,
  );
}

export function findUnresolvedTemplateTokens(html) {
  const body = stripScriptAndStyleContents(html);
  const found = [];
  for (const { pattern, label } of TEMPLATE_TOKEN_PATTERNS) {
    const match = pattern.exec(body);
    if (match) found.push({ token: match[0], label });
  }
  return found;
}

export function validateNoUnresolvedTemplateTokens(relative, html) {
  return findUnresolvedTemplateTokens(html).map(
    ({ token, label }) =>
      `${relative}: [template-token] unresolved template token (${label}) remains in rendered HTML: ${JSON.stringify(token.slice(0, 80))}`,
  );
}

export function validateRepeatedJapanesePunctuation(relative, html) {
  const body = stripScriptAndStyleContents(html);
  const matches = body.match(/[。！？]{2,}/g) ?? [];
  return matches.length === 0
    ? []
    : [
        `${relative}: [punctuation] repeated Japanese punctuation remains in rendered HTML: ${matches.slice(0, 3).join(", ")}`,
      ];
}

export const REPEATED_JAPANESE_WORDS =
  /(確認|公式|商品|購入|楽天|情報源|ページ)\1+/g;

export function validateRepeatedJapaneseWords(relative, html) {
  const body = stripScriptAndStyleContents(html);
  const matches = body.match(REPEATED_JAPANESE_WORDS) ?? [];
  return matches.length === 0
    ? []
    : [
        `${relative}: [word-duplication] repeated Japanese wording remains in rendered HTML: ${matches.slice(0, 5).join(", ")}`,
      ];
}

// 記事ページの商品数を、BaseLayout が出力する
// <meta name="article:product-count" content="N"> から読み取る。
// 商品数の唯一の情報源は記事メタデータ（src/content/articles.ts の productCount）。
// 記事ページなのに meta が無い・値が不正な場合は null を返し、エラーを errors に積む。

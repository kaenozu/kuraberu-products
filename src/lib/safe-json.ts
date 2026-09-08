/**
 * インライン <script> へ JSON を埋め込むときの共通エスケープ。
 *
 * JSON 中の "<" を "\u003c" へ置換し、記事本文などに含まれる
 * "</script>"（タグ早終端）や HTML パーサーの誤解釈を防ぐ。
 * 加えて ">"・"&"・U+2028/U+2029 もエスケープし、
 * "]]>"・"<!--"・"&" 実体参照・旧式パーサーの行区切り問題に備える。
 * いずれも JSON.parse で元値に復元できる。BaseLayout の JSON-LD と
 * ArticleListPage の discovery index で共用する。
 */
export function safeJsonForScript(value: unknown): string {
  return JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}

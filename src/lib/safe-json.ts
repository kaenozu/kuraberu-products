/**
 * インライン <script> へ JSON を埋め込むときの共通エスケープ。
 *
 * JSON 中の "<" を "\u003c" へ置換し、記事本文などに含まれる
 * "</script>"（タグ早終端）や HTML パーサーの誤解釈を防ぐ。
 * JSON.stringify は制御文字を \uXXXX へエスケープするため、
 * 置換は "<" だけで足りる。BaseLayout の JSON-LD と
 * ArticleListPage の discovery index で共用する。
 */
export function safeJsonForScript(value: unknown): string {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

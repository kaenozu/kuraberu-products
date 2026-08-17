/**
 * 理由の生成。
 *
 * 判定ロジック（reasonCode の収集）と表示文言（reasonMessages 辞書）を
 * 分離する。UIはこのモジュールを通して reasonCode を日本語へ変換する。
 * 自由生成AIは使わず、辞書に存在しないコードはコードそのものを返す。
 */

import type { ReasonDictionary } from "./types";

export const defaultReasonMessages: ReasonDictionary = {};

/** reasonCode を表示文言へ変換する。辞書に無ければコードをそのまま返す。 */
export function reasonMessage(
  code: string,
  dictionary: ReasonDictionary,
): string {
  return dictionary[code] ?? code;
}

/** 重複を除いた理由コード列を文言へ変換する */
export function reasonMessages(
  codes: readonly string[],
  dictionary: ReasonDictionary,
): string[] {
  const seen = new Set<string>();
  const messages: string[] = [];
  for (const code of codes) {
    if (seen.has(code)) continue;
    seen.add(code);
    messages.push(reasonMessage(code, dictionary));
  }
  return messages;
}

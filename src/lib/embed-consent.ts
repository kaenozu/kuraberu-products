/**
 * embed-consent.ts — 外部コンテンツ（X/YouTube/TikTok/Pinterest）の
 * ユーザー同意を管理するモジュール。
 *
 * 同意状態は localStorage に保存され、同一ブラウザで再訪問時にも
 * 同意状態が維持される。
 *
 * - 未設定: consent is unknown, prompt the user
 * - granted: user accepted, autoload embeds may proceed
 * - denied: user declined, embeds remain in manual-load mode
 */

const CONSENT_KEY = "embed-consent";
export type EmbedConsent = "granted" | "denied";

declare global {
  interface Window {
    __embedConsent?: EmbedConsent;
    __embedConsentCallbacks?: Set<(consent: EmbedConsent | undefined) => void>;
  }
}

function getLocalStorage(): Storage | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

/**
 * 現在の同意状態を返す。未設定なら undefined。
 */
export function getConsent(): EmbedConsent | undefined {
  const ls = getLocalStorage();
  if (!ls) return undefined;
  try {
    const stored = ls.getItem(CONSENT_KEY);
    if (stored === "granted" || stored === "denied") {
      return stored;
    }
  } catch {
    // silently fail
  }
  return undefined;
}

/**
 * 同意状態を設定する。設定後、リスナーに通知する。
 */
export function setConsent(consent: EmbedConsent): void {
  const ls = getLocalStorage();
  if (ls) {
    try {
      ls.setItem(CONSENT_KEY, consent);
    } catch {
      // silently fail
    }
  }
  // Update in-memory cache
  if (typeof window !== "undefined") {
    window.__embedConsent = consent;
    window.__embedConsentCallbacks?.forEach((cb) => cb(consent));
  }
}

/**
 * 同意状態をクリアする（再同意が必要になる）。
 */
export function clearConsent(): void {
  const ls = getLocalStorage();
  if (ls) {
    try {
      ls.removeItem(CONSENT_KEY);
    } catch {
      // silently fail
    }
  }
  if (typeof window !== "undefined") {
    window.__embedConsent = undefined;
    window.__embedConsentCallbacks?.forEach((cb) => cb(undefined));
  }
}

/**
 * 同意状態の変更をリッスンする関数を登録する。
 * クリーンアップ関数を返す。
 */
export function onConsentChange(
  callback: (consent: EmbedConsent | undefined) => void,
): () => void {
  if (typeof window === "undefined") return () => {};
  if (!window.__embedConsentCallbacks) {
    window.__embedConsentCallbacks = new Set();
  }
  window.__embedConsentCallbacks.add(callback);
  return () => {
    window.__embedConsentCallbacks?.delete(callback);
  };
}

/**
 * キャッシュされた同意状態を返す（DOMから読み取る前に使う）。
 * localStorage read を避けてパフォーマンスを向上させる。
 */
export function getCachedConsent(): EmbedConsent | undefined {
  if (typeof window !== "undefined" && window.__embedConsent !== undefined) {
    return window.__embedConsent;
  }
  const consent = getConsent();
  if (typeof window !== "undefined") {
    window.__embedConsent = consent;
  }
  return consent;
}

export const STORAGE_KEY = CONSENT_KEY;

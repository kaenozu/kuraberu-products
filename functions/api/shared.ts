// Pages Functions 間で共用する小さなヘルパー。
// 各 Function ファイルは独立にバンドルされるため、依存は軽量に保つ。

const RATE_LIMIT_FALLBACK_RETRY_SECONDS = 60;

export type RateLimitResult =
  | { allowed: true }
  | {
      allowed: false;
      retryAfterSeconds: number;
      reason?: "rate-limited" | "unavailable";
    };

/**
 * 送信元IPとして妥当な形（IPv4/IPv6 の文字種）かを簡易検証する。
 * 長さ上限45は IPv6 最大表記に収まる。
 */
function looksLikeIp(value: string): boolean {
  return /^[0-9a-fA-F:.]{1,45}$/.test(value);
}

/**
 * クライアントIPを取り出す。Cloudflare 経由の CF-Connecting-IP を優先し、
 * フォールバックは X-Forwarded-For の「末尾」を使う。
 *
 * XFF はクライアントが先頭に任意の偽値を挿入でき、信頼するプロキシ
 * （Cloudflare）は訪問者IPを右端に追記する挙動のため、左端ではなく
 * 右側から最初の妥当な値を採用する。これによりレート制限キーの
 * 偽造による無限生成を防ぐ。形式検証に通る値が無い場合は一律
 * "unknown"（単一バケット）に倒して安全側に寄せる。
 */
export function clientIp(request: Request): string {
  const direct = request.headers.get("CF-Connecting-IP")?.trim();
  if (direct && looksLikeIp(direct)) return direct;
  const forwarded = request.headers.get("X-Forwarded-For");
  if (forwarded) {
    const entries = forwarded.split(",").map((entry) => entry.trim());
    for (let i = entries.length - 1; i >= 0; i--) {
      const candidate = entries[i];
      if (candidate && looksLikeIp(candidate)) return candidate;
    }
  }
  return "unknown";
}

export function json(
  data: unknown,
  status: number,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...headers },
  });
}

/**
 * 同一キー（例: 同一IP）からの連続リクエストを制限する。
 * レート制限カウンタは Cloudflare ロケーション単位・結果整合性（permissive）のため、
 * 厳密な会計ではなくスパム抑止として使う。
 *
 * failClosed=false（デフォルト）: バインディング未設定・エラー時は制限なしで続行
 *   （可用性優先。楽天APIのフォールバック方針と同じ）
 * failClosed=true: バインディング未設定・エラー時は 503 を返す
 *   （副作用のあるAPI: 問い合わせ等で使う）
 */
export async function enforceRateLimit(
  limiter: ContactRateLimiter | undefined,
  key: string,
  label: string,
  options: { failClosed?: boolean } = {},
): Promise<RateLimitResult> {
  const failClosed = options.failClosed ?? false;
  if (!limiter) {
    if (failClosed) {
      console.error(
        `${label}: レート制限バインディング未設定。fail-closed で 503 を返します`,
      );
      return { allowed: false, retryAfterSeconds: 60, reason: "unavailable" };
    }
    console.warn(
      `${label}: レート制限バインディング未設定のため制限なしで続行します`,
    );
    return { allowed: true };
  }
  try {
    const result = await limiter.limit({ key });
    if (result.success) return { allowed: true };
    const retryAfterSeconds =
      typeof result.reset_after === "number" && result.reset_after > 0
        ? result.reset_after
        : RATE_LIMIT_FALLBACK_RETRY_SECONDS;
    return { allowed: false, retryAfterSeconds, reason: "rate-limited" };
  } catch (error) {
    if (failClosed) {
      console.error(
        `${label}: レート制限API エラー。fail-closed で 503 を返します`,
        error,
      );
      return { allowed: false, retryAfterSeconds: 60, reason: "unavailable" };
    }
    console.warn(`${label}: エラーのため制限なしで続行します`, error);
    return { allowed: true };
  }
}

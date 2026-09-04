// Cloudflare Pages Functions の型定義（@cloudflare/workers-types をプロジェクトに導入せず軽量に済ませる）

// レート制限バインディング（Workers Rate Limiting API）。
// 実装は Cloudflare 側が提供するため、必要な形状だけを構造的に宣言する。
interface ContactRateLimiter {
  limit(options: { key: string }): Promise<{
    success: boolean;
    reset_after?: number;
  }>;
}

// クリック計測の保存先（Workers KV）。バインディング未設定でも
// エンドポイントは動作する（イベントを破棄して続行する）。
interface AnalyticsKv {
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number },
  ): Promise<void>;
}

interface Env {
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
  PUBLIC_SITE_URL?: string;
  RAKUTEN_PERF_FLUSH_TOKEN?: string;
  CONTACT_RATE_LIMITER?: ContactRateLimiter;
  ANALYTICS_RATE_LIMITER?: ContactRateLimiter;
  ANALYTICS_KV?: AnalyticsKv;
}

interface PagesFunction<EnvType = Env> {
  (context: {
    request: Request;
    env: EnvType;
    params: Record<string, string>;
    data: Record<string, unknown>;
  }): Promise<Response> | Response;
}

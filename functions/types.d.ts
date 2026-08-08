// Cloudflare Pages Functions の型定義（@cloudflare/workers-types をプロジェクトに導入せず軽量に済ませる）
interface Env {
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
  PUBLIC_SITE_URL?: string;
}

interface PagesFunction<EnvType = Env> {
  (context: {
    request: Request;
    env: EnvType;
    params: Record<string, string>;
    data: Record<string, unknown>;
  }): Promise<Response> | Response;
}

export const EXTERNAL_EMBED_PROVIDERS = [
  "x",
  "youtube",
  "tiktok",
  "pinterest",
] as const;

export type ExternalEmbedProvider = (typeof EXTERNAL_EMBED_PROVIDERS)[number];

export type ExternalEmbedConfig = {
  provider: ExternalEmbedProvider;
  canonicalUrl: string;
  renderer: "iframe" | "widget";
  embedUrl?: string;
  scriptSrc?: string;
  minimumHeight: number;
};

const providerLabels: Record<ExternalEmbedProvider, string> = {
  x: "X",
  youtube: "YouTube",
  tiktok: "TikTok",
  pinterest: "Pinterest",
};

function parseHttpsUrl(input: string): URL {
  let url: URL;

  try {
    url = new URL(input);
  } catch {
    throw new Error("外部埋め込みURLが正しいURLではありません。");
  }

  if (url.protocol !== "https:") {
    throw new Error("外部埋め込みURLはhttpsのみ使用できます。");
  }

  if (url.username || url.password) {
    throw new Error("認証情報を含む外部埋め込みURLは使用できません。");
  }

  url.hash = "";
  return url;
}

function hasHostname(url: URL, hostnames: readonly string[]): boolean {
  return hostnames.includes(url.hostname.toLowerCase());
}

function youtubeVideoId(url: URL): string | null {
  if (url.hostname.toLowerCase() === "youtu.be") {
    return url.pathname.split("/").filter(Boolean)[0] ?? null;
  }

  if (
    !hasHostname(url, [
      "youtube.com",
      "www.youtube.com",
      "m.youtube.com",
      "music.youtube.com",
    ])
  ) {
    return null;
  }

  if (url.pathname === "/watch") {
    return url.searchParams.get("v");
  }

  const match = url.pathname.match(
    /^\/(?:shorts|embed)\/([A-Za-z0-9_-]{11})(?:\/|$)/,
  );
  return match?.[1] ?? null;
}

function assertYoutubeVideoId(value: string | null): string {
  if (!value || !/^[A-Za-z0-9_-]{11}$/.test(value)) {
    throw new Error("YouTube動画URLから動画IDを確認できません。");
  }

  return value;
}

export function externalEmbedProviderLabel(
  provider: ExternalEmbedProvider,
): string {
  return providerLabels[provider];
}

export function createExternalEmbedConfig(
  provider: ExternalEmbedProvider,
  input: string,
): ExternalEmbedConfig {
  const url = parseHttpsUrl(input);

  if (provider === "youtube") {
    const videoId = assertYoutubeVideoId(youtubeVideoId(url));
    return {
      provider,
      canonicalUrl: `https://www.youtube.com/watch?v=${videoId}`,
      renderer: "iframe",
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
      minimumHeight: 315,
    };
  }

  if (provider === "x") {
    if (
      !hasHostname(url, [
        "x.com",
        "www.x.com",
        "twitter.com",
        "www.twitter.com",
      ])
    ) {
      throw new Error("Xの公式ホスト以外は埋め込みできません。");
    }

    const match = url.pathname.match(
      /^\/([A-Za-z0-9_]{1,15})\/status\/(\d+)(?:\/|$)/,
    );
    if (!match) {
      throw new Error("Xの公開ポストURLを指定してください。");
    }

    return {
      provider,
      canonicalUrl: `https://x.com/${match[1]}/status/${match[2]}`,
      renderer: "widget",
      scriptSrc: "https://platform.twitter.com/widgets.js",
      minimumHeight: 260,
    };
  }

  if (provider === "tiktok") {
    if (!hasHostname(url, ["tiktok.com", "www.tiktok.com"])) {
      throw new Error("TikTokの公式ホスト以外は埋め込みできません。");
    }

    const match = url.pathname.match(/^\/@[^/]+\/video\/(\d+)(?:\/|$)/);
    if (!match) {
      throw new Error("TikTokの公開動画URLを指定してください。");
    }

    return {
      provider,
      canonicalUrl: `https://www.tiktok.com${url.pathname.replace(/\/$/, "")}`,
      renderer: "iframe",
      embedUrl: `https://www.tiktok.com/player/v1/${match[1]}`,
      minimumHeight: 560,
    };
  }

  if (
    !hasHostname(url, [
      "pinterest.com",
      "www.pinterest.com",
      "pinterest.jp",
      "www.pinterest.jp",
    ])
  ) {
    throw new Error("Pinterestの公式ホスト以外は埋め込みできません。");
  }

  const match = url.pathname.match(/^\/pin\/(\d+)(?:\/|$)/);
  if (!match) {
    throw new Error("Pinterestの公開Pin URLを指定してください。");
  }

  return {
    provider,
    canonicalUrl: `https://www.pinterest.com/pin/${match[1]}/`,
    renderer: "widget",
    scriptSrc: "https://assets.pinterest.com/js/pinit.js",
    minimumHeight: 420,
  };
}

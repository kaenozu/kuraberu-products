import type { ExternalEmbedConfig } from "./external-embeds";

export type EmbedState = "idle" | "loading" | "loaded" | "failed";

export interface EmbedTargetAdapter {
  clear(): void;
  renderIframe(config: ExternalEmbedConfig, title: string): Promise<void>;
  renderWidget(config: ExternalEmbedConfig): Promise<void>;
}

export interface ExternalLoadEventSource {
  addEventListener(type: "load" | "error", listener: () => void): void;
  removeEventListener(type: "load" | "error", listener: () => void): void;
}

export interface TimerAdapter {
  setTimeout(callback: () => void, delay: number): unknown;
  clearTimeout(handle: unknown): void;
}

export interface ConditionObserver {
  observe(onChange: () => void): void;
  disconnect(): void;
}

export interface ProviderRenderScope {
  readonly isConnected: boolean;
  querySelector(selectors: string): { readonly isConnected: boolean } | null;
}

export interface PinterestRenderScope {
  isConnected(): boolean;
  apiReady(): boolean;
  callBuild(): unknown;
  hasRenderedDom(): boolean;
  observeDom(onChange: () => void): () => void;
}

const PROVIDER_DOM_SELECTORS = {
  x: ".twitter-tweet-rendered, iframe, [data-tweet-id], [data-testid='tweet']",
  // The official widget replaces the source anchor with an inline card whose
  // wrapper carries both data-pin-href and data-pin-id. Requiring both
  // attributes prevents a partially processed source anchor from being
  // mistaken for a rendered card.
  pinterest:
    "[data-pin-href][data-pin-id], iframe[src*='assets.pinterest.com']",
} as const;

export function hasConnectedProviderDom(
  provider: keyof typeof PROVIDER_DOM_SELECTORS,
  scope: ProviderRenderScope,
): boolean {
  if (!scope.isConnected) return false;
  return Boolean(
    scope.querySelector(PROVIDER_DOM_SELECTORS[provider])?.isConnected,
  );
}

const defaultTimers: TimerAdapter = {
  setTimeout: (callback, delay) => globalThis.setTimeout(callback, delay),
  clearTimeout: (handle) => globalThis.clearTimeout(handle as number),
};

export function createExternalLoadWaiter(
  source: ExternalLoadEventSource,
  timeoutMs: number,
  timers: TimerAdapter = defaultTimers,
): { promise: Promise<void>; cancel: () => void } {
  let settled = false;
  let timeoutHandle: unknown;
  let resolvePromise: () => void = () => undefined;
  let rejectPromise: (error: Error) => void = () => undefined;

  const cleanup = () => {
    source.removeEventListener("load", onLoad);
    source.removeEventListener("error", onError);
    if (timeoutHandle !== undefined) timers.clearTimeout(timeoutHandle);
  };

  const settle = (error?: Error) => {
    if (settled) return;
    settled = true;
    cleanup();
    if (error) rejectPromise(error);
    else resolvePromise();
  };

  const onLoad = () => settle();
  const onError = () => settle(new Error("external resource failed to load"));

  const promise = new Promise<void>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
    source.addEventListener("load", onLoad);
    source.addEventListener("error", onError);
    timeoutHandle = timers.setTimeout(
      () => settle(new Error("external resource load timed out")),
      timeoutMs,
    );
  });

  return {
    promise,
    cancel: () => settle(new Error("external resource load cancelled")),
  };
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { then?: unknown }).then === "function"
  );
}

export async function assertProviderCallResult(result: unknown): Promise<void> {
  if (result === undefined) return;
  if (!isPromiseLike(result)) {
    throw new Error("provider returned an invalid result");
  }

  const resolved = await result;
  if (resolved !== undefined) {
    throw new Error("provider returned an invalid result");
  }
}

export function createExternalPollingWaiter(
  condition: () => boolean,
  intervalMs: number,
  timeoutMs: number,
  timers: TimerAdapter = defaultTimers,
): { promise: Promise<void>; cancel: () => void } {
  let settled = false;
  let pollHandle: unknown;
  let timeoutHandle: unknown;
  let resolvePromise: () => void = () => undefined;
  let rejectPromise: (error: Error) => void = () => undefined;

  const cleanup = () => {
    if (pollHandle !== undefined) timers.clearTimeout(pollHandle);
    if (timeoutHandle !== undefined) timers.clearTimeout(timeoutHandle);
  };

  const settle = (error?: Error) => {
    if (settled) return;
    settled = true;
    cleanup();
    if (error) rejectPromise(error);
    else resolvePromise();
  };

  const check = () => {
    if (settled) return;
    let ready = false;
    try {
      ready = condition();
    } catch (error) {
      settle(error instanceof Error ? error : new Error("condition failed"));
      return;
    }
    if (ready) {
      settle();
      return;
    }
    pollHandle = timers.setTimeout(check, intervalMs);
  };

  const promise = new Promise<void>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
    timeoutHandle = timers.setTimeout(
      () => settle(new Error("external provider API timed out")),
      timeoutMs,
    );
    check();
  });

  return {
    promise,
    cancel: () => settle(new Error("external provider API cancelled")),
  };
}

export async function renderPinterestWidget(
  scope: PinterestRenderScope,
  apiPollIntervalMs: number,
  remainingTimeout: () => number,
  timers: TimerAdapter = defaultTimers,
  registerCancel: (
    cancel: (() => void) | undefined,
    expected?: () => void,
  ) => void = () => undefined,
): Promise<void> {
  if (!scope.apiReady()) {
    // pinit.js loads pinit_main.js asynchronously, so PinUtils.build may not
    // exist yet when the script load event fires. Poll for it within a
    // bounded budget instead of failing immediately.
    const apiWaiter = createExternalPollingWaiter(
      scope.apiReady,
      apiPollIntervalMs,
      remainingTimeout(),
      timers,
    );
    registerCancel(apiWaiter.cancel);
    try {
      await apiWaiter.promise;
    } finally {
      registerCancel(undefined, apiWaiter.cancel);
      apiWaiter.cancel();
    }
    if (!scope.isConnected()) {
      throw new Error("external widget render cancelled");
    }
  }

  if (!scope.apiReady()) {
    throw new Error("Pinterest widget API is unavailable");
  }
  await assertProviderCallResult(scope.callBuild());

  const observer: ConditionObserver = {
    observe(onChange) {
      const unsubscribe = scope.observeDom(onChange);
      observer.disconnect = unsubscribe;
    },
    disconnect() {},
  };
  const domWaiter = createExternalConditionWaiter(
    () => scope.isConnected() && scope.hasRenderedDom(),
    observer,
    remainingTimeout(),
    timers,
  );
  registerCancel(domWaiter.cancel);
  try {
    await domWaiter.promise;
  } finally {
    registerCancel(undefined, domWaiter.cancel);
    domWaiter.cancel();
  }
}

export function createExternalConditionWaiter(
  condition: () => boolean,
  observer: ConditionObserver,
  timeoutMs: number,
  timers: TimerAdapter = defaultTimers,
): { promise: Promise<void>; cancel: () => void } {
  let settled = false;
  let timeoutHandle: unknown;
  let resolvePromise: () => void = () => undefined;
  let rejectPromise: (error: Error) => void = () => undefined;

  const cleanup = () => {
    observer.disconnect();
    if (timeoutHandle !== undefined) timers.clearTimeout(timeoutHandle);
  };

  const settle = (error?: Error) => {
    if (settled) return;
    settled = true;
    cleanup();
    if (error) rejectPromise(error);
    else resolvePromise();
  };

  const check = () => {
    try {
      if (condition()) settle();
    } catch (error) {
      settle(error instanceof Error ? error : new Error("condition failed"));
    }
  };

  const promise = new Promise<void>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
    try {
      observer.observe(check);
      timeoutHandle = timers.setTimeout(
        () => settle(new Error("external provider render timed out")),
        timeoutMs,
      );
      check();
    } catch (error) {
      settle(error instanceof Error ? error : new Error("observer failed"));
    }
  });

  return {
    promise,
    cancel: () => settle(new Error("external provider render cancelled")),
  };
}

export function createExternalEmbedRuntime(
  config: ExternalEmbedConfig,
  title: string,
  target: EmbedTargetAdapter,
): {
  readonly state: EmbedState;
  load: () => Promise<void>;
  dispose: () => void;
} {
  let state: EmbedState = "idle";
  let current: Promise<void> | undefined;
  let generation = 0;
  let disposed = false;

  const load = (): Promise<void> => {
    if (disposed) return Promise.reject(new Error("external embed disposed"));
    if (current) return current;

    const run = ++generation;
    state = "loading";
    target.clear();

    const operation = Promise.resolve()
      .then(() => {
        if (disposed || run !== generation) {
          throw new Error("external embed disposed");
        }
        return config.renderer === "iframe"
          ? target.renderIframe(config, title)
          : target.renderWidget(config);
      })
      .then(() => {
        if (run === generation) state = "loaded";
      })
      .catch((error: unknown) => {
        if (run === generation) state = "failed";
        throw error;
      })
      .finally(() => {
        if (current === operation) current = undefined;
      });

    current = operation;
    return operation;
  };

  const dispose = (): void => {
    if (disposed) return;
    disposed = true;
    generation += 1;
    target.clear();
    state = "idle";
  };

  return {
    get state() {
      return state;
    },
    load,
    dispose,
  };
}

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
} {
  let state: EmbedState = "idle";
  let current: Promise<void> | undefined;
  let generation = 0;

  const load = (): Promise<void> => {
    if (current) return current;

    const run = ++generation;
    state = "loading";
    target.clear();

    const operation = Promise.resolve()
      .then(() =>
        config.renderer === "iframe"
          ? target.renderIframe(config, title)
          : target.renderWidget(config),
      )
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

  return {
    get state() {
      return state;
    },
    load,
  };
}

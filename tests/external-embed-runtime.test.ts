import { describe, expect, it } from "vitest";
import {
  assertProviderCallResult,
  createExternalEmbedRuntime,
  createExternalConditionWaiter,
  createExternalLoadWaiter,
  hasConnectedProviderDom,
  type ConditionObserver,
  type EmbedTargetAdapter,
  type ExternalLoadEventSource,
  type TimerAdapter,
} from "../src/lib/external-embed-runtime";
import type { ExternalEmbedConfig } from "../src/lib/external-embeds";

const iframeConfig: ExternalEmbedConfig = {
  provider: "youtube",
  canonicalUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  renderer: "iframe",
  embedUrl: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
  minimumHeight: 315,
};

class FakeEventSource implements ExternalLoadEventSource {
  private listeners = new Map<string, Set<() => void>>();

  addEventListener(type: "load" | "error", listener: () => void): void {
    const listeners = this.listeners.get(type) ?? new Set<() => void>();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type: "load" | "error", listener: () => void): void {
    this.listeners.get(type)?.delete(listener);
  }

  emit(type: "load" | "error"): void {
    for (const listener of this.listeners.get(type) ?? []) listener();
  }
}

function fakeTimers(): {
  timers: TimerAdapter;
  fireTimeout: () => void;
  clearCalls: number;
} {
  let callback: (() => void) | undefined;
  let clearCalls = 0;
  return {
    timers: {
      setTimeout: (next) => {
        callback = next;
        return 1;
      },
      clearTimeout: () => {
        clearCalls += 1;
      },
    },
    fireTimeout: () => callback?.(),
    get clearCalls() {
      return clearCalls;
    },
  };
}

type FakeTarget = EmbedTargetAdapter & {
  clearCalls: number;
  iframeCalls: number;
  iframePromise: Promise<void>;
  widgetPromise: Promise<void>;
};

class FakeConditionObserver implements ConditionObserver {
  callback: (() => void) | undefined;
  disconnectCalls = 0;

  observe(onChange: () => void): void {
    this.callback = onChange;
  }

  disconnect(): void {
    this.disconnectCalls += 1;
    this.callback = undefined;
  }

  emit(): void {
    this.callback?.();
  }
}

function fakeTarget(): FakeTarget {
  let iframePromise: Promise<void> = Promise.resolve();
  let widgetPromise: Promise<void> = Promise.resolve();
  const target: FakeTarget = {
    clearCalls: 0,
    iframeCalls: 0,
    clear() {
      this.clearCalls += 1;
    },
    renderIframe() {
      this.iframeCalls += 1;
      return iframePromise;
    },
    renderWidget() {
      return widgetPromise;
    },
    set iframePromise(value: Promise<void>) {
      iframePromise = value;
    },
    set widgetPromise(value: Promise<void>) {
      widgetPromise = value;
    },
  };
  return target;
}

describe("external embed load waiter", () => {
  it("resolves on load and removes event listeners", async () => {
    const source = new FakeEventSource();
    const timerState = fakeTimers();
    const waiter = createExternalLoadWaiter(source, 1000, timerState.timers);

    source.emit("load");
    await expect(waiter.promise).resolves.toBeUndefined();
    expect(timerState.clearCalls).toBe(1);
    source.emit("error");
    await expect(waiter.promise).resolves.toBeUndefined();
  });

  it.each(["error", "timeout"] as const)("rejects on %s", async (failure) => {
    const source = new FakeEventSource();
    const timerState = fakeTimers();
    const waiter = createExternalLoadWaiter(source, 1000, timerState.timers);

    if (failure === "error") source.emit("error");
    else timerState.fireTimeout();

    await expect(waiter.promise).rejects.toThrow();
    source.emit("load");
    await expect(waiter.promise).rejects.toThrow();
  });

  it("can be cancelled during retry cleanup", async () => {
    const source = new FakeEventSource();
    const waiter = createExternalLoadWaiter(source, 1000, fakeTimers().timers);
    waiter.cancel();
    await expect(waiter.promise).rejects.toThrow("cancelled");
  });
});

describe("provider result validation", () => {
  it("accepts void and Promise<void> provider results", async () => {
    await expect(assertProviderCallResult(undefined)).resolves.toBeUndefined();
    await expect(
      assertProviderCallResult(Promise.resolve()),
    ).resolves.toBeUndefined();
  });

  it("rejects invalid and rejected provider results", async () => {
    await expect(assertProviderCallResult(false)).rejects.toThrow();
    await expect(
      assertProviderCallResult(Promise.resolve(false)),
    ).rejects.toThrow();
    await expect(
      assertProviderCallResult(Promise.reject(new Error("provider"))),
    ).rejects.toThrow("provider");
  });
});

describe("provider DOM render waiter", () => {
  it("detects connected X DOM in the stable container after the source is detached", () => {
    const generated = { isConnected: true };
    const stableContainer = {
      isConnected: true,
      querySelector: (selector: string) =>
        selector.includes("twitter-tweet-rendered") ? generated : null,
    };

    expect(hasConnectedProviderDom("x", stableContainer)).toBe(true);
  });

  it("does not accept detached provider DOM", () => {
    const detached = { isConnected: false };
    const stableContainer = {
      isConnected: true,
      querySelector: () => detached,
    };

    expect(hasConnectedProviderDom("x", stableContainer)).toBe(false);
    expect(hasConnectedProviderDom("pinterest", stableContainer)).toBe(false);
  });

  it("requires generated Pinterest DOM instead of the build call result", () => {
    const emptyContainer = {
      isConnected: true,
      querySelector: () => null,
    };
    const generatedContainer = {
      isConnected: true,
      querySelector: (selector: string) =>
        selector.includes("data-pin-href") ? { isConnected: true } : null,
    };

    expect(hasConnectedProviderDom("pinterest", emptyContainer)).toBe(false);
    expect(hasConnectedProviderDom("pinterest", generatedContainer)).toBe(true);
  });

  it("does not treat an undefined X API result as rendered DOM", async () => {
    await expect(assertProviderCallResult(undefined)).resolves.toBeUndefined();
    const observer = new FakeConditionObserver();
    const timerState = fakeTimers();
    const waiter = createExternalConditionWaiter(
      () => false,
      observer,
      1000,
      timerState.timers,
    );

    timerState.fireTimeout();
    await expect(waiter.promise).rejects.toThrow("timed out");
    expect(observer.disconnectCalls).toBe(1);
  });

  it("resolves on generated DOM and ignores late mutation after cancellation", async () => {
    let generated = false;
    const observer = new FakeConditionObserver();
    const waiter = createExternalConditionWaiter(
      () => generated,
      observer,
      1000,
      fakeTimers().timers,
    );

    generated = true;
    observer.emit();
    await expect(waiter.promise).resolves.toBeUndefined();
    expect(observer.disconnectCalls).toBe(1);

    const retryObserver = new FakeConditionObserver();
    const retry = createExternalConditionWaiter(
      () => false,
      retryObserver,
      1000,
      fakeTimers().timers,
    );
    retry.cancel();
    retryObserver.emit();
    await expect(retry.promise).rejects.toThrow("cancelled");
    expect(retryObserver.disconnectCalls).toBe(1);
  });
});

describe("external embed runtime", () => {
  it("stays loading until the iframe load promise resolves", async () => {
    let resolveIframe!: () => void;
    const iframePromise = new Promise<void>((resolve) => {
      resolveIframe = resolve;
    });
    const target = fakeTarget();
    target.iframePromise = iframePromise;
    const runtime = createExternalEmbedRuntime(iframeConfig, "video", target);

    const first = runtime.load();
    expect(runtime.state).toBe("loading");
    await Promise.resolve();
    expect(target.iframeCalls).toBe(1);
    resolveIframe();
    await expect(first).resolves.toBeUndefined();
    expect(runtime.state).toBe("loaded");
  });

  it("marks failures and permits a clean retry without duplicate loading", async () => {
    let rejectIframe!: (error: Error) => void;
    const firstPromise = new Promise<void>((_, reject) => {
      rejectIframe = reject;
    });
    const target = fakeTarget();
    target.iframePromise = firstPromise;
    const runtime = createExternalEmbedRuntime(iframeConfig, "video", target);

    const first = runtime.load();
    rejectIframe(new Error("network"));
    await expect(first).rejects.toThrow("network");
    expect(runtime.state).toBe("failed");

    target.iframePromise = Promise.resolve();
    await expect(runtime.load()).resolves.toBeUndefined();
    expect(runtime.state).toBe("loaded");
    expect(target.iframeCalls).toBe(2);
    expect(target.clearCalls).toBe(2);
  });

  it("shares one in-flight operation across duplicate clicks", async () => {
    let resolveIframe!: () => void;
    const iframePromise = new Promise<void>((resolve) => {
      resolveIframe = resolve;
    });
    const target = fakeTarget();
    target.iframePromise = iframePromise;
    const runtime = createExternalEmbedRuntime(iframeConfig, "video", target);

    const first = runtime.load();
    const second = runtime.load();
    expect(first).toBe(second);
    await Promise.resolve();
    expect(target.iframeCalls).toBe(1);
    resolveIframe();
    await expect(first).resolves.toBeUndefined();
  });
});

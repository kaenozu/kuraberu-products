import { describe, expect, it } from "vitest";
import {
  assertProviderCallResult,
  createExternalEmbedRuntime,
  createExternalConditionWaiter,
  createExternalLoadWaiter,
  createExternalPollingWaiter,
  hasConnectedProviderDom,
  renderPinterestWidget,
  type ConditionObserver,
  type EmbedTargetAdapter,
  type ExternalLoadEventSource,
  type PinterestRenderScope,
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

// Multi-handle fake timer for the polling waiter. The timeout handle is
// always scheduled before the first poll, so the first scheduled entry is the
// timeout and the last scheduled entry is the newest poll.
function pollingTimers(): {
  timers: TimerAdapter;
  fireTimeout: () => void;
  firePoll: () => void;
  peekPoll: () => () => void;
  delays: () => number[];
  scheduled: () => number;
  clearCalls: number;
} {
  let nextHandle = 1;
  const scheduled = new Map<number, { callback: () => void; delay: number }>();
  let clearCalls = 0;
  const fire = (index: number) => {
    const entries = [...scheduled.entries()];
    const entry = entries[index];
    if (!entry) throw new Error(`no scheduled timer at index ${index}`);
    scheduled.delete(entry[0]);
    entry[1].callback();
  };
  return {
    timers: {
      setTimeout: (callback, delay) => {
        const handle = nextHandle++;
        scheduled.set(handle, { callback, delay });
        return handle;
      },
      clearTimeout: (handle) => {
        clearCalls += 1;
        scheduled.delete(handle as number);
      },
    },
    fireTimeout: () => fire(0),
    firePoll: () => fire(scheduled.size - 1),
    peekPoll: () => {
      const entries = [...scheduled.entries()];
      const entry = entries[entries.length - 1];
      if (!entry) throw new Error("no poll scheduled");
      return entry[1].callback;
    },
    delays: () => [...scheduled.values()].map((entry) => entry.delay),
    scheduled: () => scheduled.size,
    get clearCalls() {
      return clearCalls;
    },
  };
}

function pinterestScope(): PinterestRenderScope & {
  set apiReadyValue(value: boolean);
  set domReadyValue(value: boolean);
  set connectedValue(value: boolean);
  readonly buildCalls: number;
  emitDom: () => void;
} {
  let apiReady = false;
  let domReady = false;
  let connected = true;
  let buildCalls = 0;
  let observerCallback: (() => void) | undefined;

  const scope = {
    isConnected: () => connected,
    apiReady: () => apiReady,
    callBuild: () => {
      buildCalls += 1;
      return undefined;
    },
    hasRenderedDom: () => domReady,
    observeDom(onChange: () => void) {
      observerCallback = onChange;
      return () => {
        observerCallback = undefined;
      };
    },
    set apiReadyValue(value: boolean) {
      apiReady = value;
    },
    set domReadyValue(value: boolean) {
      domReady = value;
    },
    set connectedValue(value: boolean) {
      connected = value;
    },
    get buildCalls() {
      return buildCalls;
    },
    emitDom() {
      observerCallback?.();
    },
  };
  return scope;
}

// Minimal selector matcher that honors the strict [data-pin-href][data-pin-id]
// compound selector used by the Pinterest provider DOM check.
function pinterestContainer(
  nodes: Array<{ attrs: Record<string, string>; connected: boolean }>,
) {
  return {
    isConnected: true,
    querySelector(selector: string) {
      const firstSelector = selector.split(",")[0]?.trim() ?? "";
      const required = [...firstSelector.matchAll(/\[data-([a-z-]+)\]/g)].map(
        (match) => `data-${match[1]}`,
      );
      const found = nodes.find(
        (node) =>
          node.connected &&
          required.every((attr) => node.attrs[attr] !== undefined),
      );
      return found ? { isConnected: found.connected } : null;
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

  it("does not treat a source anchor as rendered Pinterest DOM", () => {
    const sourceAnchor = pinterestContainer([
      {
        attrs: {
          "data-pin-do": "embedPin",
          href: "https://www.pinterest.com/pin/1/",
        },
        connected: true,
      },
    ]);
    const partiallyProcessed = pinterestContainer([
      {
        attrs: { "data-pin-href": "https://www.pinterest.com/pin/1/" },
        connected: true,
      },
    ]);

    expect(hasConnectedProviderDom("pinterest", sourceAnchor)).toBe(false);
    expect(hasConnectedProviderDom("pinterest", partiallyProcessed)).toBe(
      false,
    );
  });

  it("accepts connected Pinterest inline card DOM with both attributes", () => {
    const renderedCard = pinterestContainer([
      {
        attrs: {
          "data-pin-href": "https://www.pinterest.com/pin/1095922890543405483/",
          "data-pin-id": "1095922890543405483",
        },
        connected: true,
      },
    ]);
    const detachedCard = pinterestContainer([
      {
        attrs: {
          "data-pin-href": "https://www.pinterest.com/pin/1095922890543405483/",
          "data-pin-id": "1095922890543405483",
        },
        connected: false,
      },
    ]);

    expect(hasConnectedProviderDom("pinterest", renderedCard)).toBe(true);
    expect(hasConnectedProviderDom("pinterest", detachedCard)).toBe(false);
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

describe("external provider polling waiter", () => {
  it("evaluates the condition immediately and cleans up both timers", async () => {
    const timerState = pollingTimers();
    const waiter = createExternalPollingWaiter(
      () => true,
      100,
      1000,
      timerState.timers,
    );

    await expect(waiter.promise).resolves.toBeUndefined();
    expect(timerState.scheduled()).toBe(0);
    expect(timerState.clearCalls).toBe(1);
  });

  it("resolves once the condition becomes true after several polls", async () => {
    let ready = false;
    let evaluations = 0;
    const timerState = pollingTimers();
    const waiter = createExternalPollingWaiter(
      () => {
        evaluations += 1;
        return ready;
      },
      100,
      1000,
      timerState.timers,
    );

    expect(evaluations).toBe(1); // immediate evaluation
    timerState.firePoll();
    timerState.firePoll();
    expect(evaluations).toBe(3);
    ready = true;
    timerState.firePoll();
    await expect(waiter.promise).resolves.toBeUndefined();
    expect(evaluations).toBe(4);
    expect(timerState.scheduled()).toBe(0);
    expect(timerState.clearCalls).toBe(2); // poll + timeout
  });

  it("rejects on timeout and ignores late callbacks", async () => {
    const timerState = pollingTimers();
    const waiter = createExternalPollingWaiter(
      () => false,
      100,
      1000,
      timerState.timers,
    );
    const latePoll = timerState.peekPoll();

    timerState.fireTimeout();
    await expect(waiter.promise).rejects.toThrow("timed out");
    expect(timerState.scheduled()).toBe(0); // timeout and poll were cleared
    latePoll(); // a stale callback must be ignored
    await expect(waiter.promise).rejects.toThrow("timed out");
    expect(timerState.scheduled()).toBe(0);
  });

  it("rejects on cancel and stops polling", async () => {
    const timerState = pollingTimers();
    const waiter = createExternalPollingWaiter(
      () => false,
      100,
      1000,
      timerState.timers,
    );
    const latePoll = timerState.peekPoll();

    waiter.cancel();
    await expect(waiter.promise).rejects.toThrow("cancelled");
    expect(timerState.scheduled()).toBe(0);
    latePoll();
    await expect(waiter.promise).rejects.toThrow("cancelled");
    expect(timerState.scheduled()).toBe(0);
  });

  it("rejects safely when the condition throws", async () => {
    const timerState = pollingTimers();
    const waiter = createExternalPollingWaiter(
      () => {
        throw new Error("broken condition");
      },
      100,
      1000,
      timerState.timers,
    );

    await expect(waiter.promise).rejects.toThrow("broken condition");
    expect(timerState.scheduled()).toBe(0);
  });
});

describe("Pinterest widget render", () => {
  it("polls until PinUtils.build appears and calls build exactly once", async () => {
    const scope = pinterestScope();
    const timerState = pollingTimers();
    const promise = renderPinterestWidget(
      scope,
      100,
      () => 1000,
      timerState.timers,
    );

    expect(scope.buildCalls).toBe(0);
    scope.apiReadyValue = true;
    timerState.firePoll();
    scope.domReadyValue = true;
    scope.emitDom();
    await expect(promise).resolves.toBeUndefined();
    expect(scope.buildCalls).toBe(1);
    expect(timerState.scheduled()).toBe(0);
  });

  it("times out before the API appears, allows retry, and never builds late", async () => {
    const scope = pinterestScope();
    const timerState = pollingTimers();
    const first = renderPinterestWidget(
      scope,
      100,
      () => 1000,
      timerState.timers,
    );

    timerState.fireTimeout();
    await expect(first).rejects.toThrow("timed out");
    expect(scope.buildCalls).toBe(0);

    // The API appearing after the timeout must not trigger build from the old
    // attempt: the poll and timeout handles were already cleaned up.
    scope.apiReadyValue = true;
    await Promise.resolve();
    expect(scope.buildCalls).toBe(0);

    // A fresh attempt renders normally and calls build once.
    scope.domReadyValue = true;
    const retry = renderPinterestWidget(
      scope,
      100,
      () => 1000,
      timerState.timers,
    );
    await expect(retry).resolves.toBeUndefined();
    expect(scope.buildCalls).toBe(1);
    expect(timerState.scheduled()).toBe(0);
  });

  it("does not build when cancelled while waiting for the API", async () => {
    const scope = pinterestScope();
    const timerState = pollingTimers();
    let cancel: (() => void) | undefined;
    const promise = renderPinterestWidget(
      scope,
      100,
      () => 1000,
      timerState.timers,
      (next) => {
        if (next) cancel = next;
      },
    );

    cancel?.();
    scope.apiReadyValue = true;
    await Promise.resolve();
    await expect(promise).rejects.toThrow("cancelled");
    expect(scope.buildCalls).toBe(0);
  });

  it("does not build when the component is disconnected during the API wait", async () => {
    const scope = pinterestScope();
    const timerState = pollingTimers();
    const promise = renderPinterestWidget(
      scope,
      100,
      () => 1000,
      timerState.timers,
    );

    scope.apiReadyValue = true;
    scope.connectedValue = false;
    timerState.firePoll();
    await expect(promise).rejects.toThrow("cancelled");
    expect(scope.buildCalls).toBe(0);
  });

  it("rejects when the rendered card never appears and cleans up timers", async () => {
    const scope = pinterestScope();
    scope.apiReadyValue = true;
    const timerState = pollingTimers();
    const promise = renderPinterestWidget(
      scope,
      100,
      () => 1000,
      timerState.timers,
    );

    await Promise.resolve();
    expect(scope.buildCalls).toBe(1);
    timerState.fireTimeout();
    await expect(promise).rejects.toThrow("render timed out");
    expect(timerState.scheduled()).toBe(0);
  });

  it("rejects when cancelled during the card render wait", async () => {
    const scope = pinterestScope();
    scope.apiReadyValue = true;
    const timerState = pollingTimers();
    let cancel: (() => void) | undefined;
    const promise = renderPinterestWidget(
      scope,
      100,
      () => 1000,
      timerState.timers,
      (next) => {
        if (next) cancel = next;
      },
    );

    await Promise.resolve();
    expect(scope.buildCalls).toBe(1);
    cancel?.();
    scope.domReadyValue = true;
    scope.emitDom();
    await expect(promise).rejects.toThrow("cancelled");
    expect(scope.buildCalls).toBe(1);
  });

  it("shares one deadline between the API wait and the render wait", async () => {
    const scope = pinterestScope();
    const timerState = pollingTimers();
    let remaining = 1000;
    const promise = renderPinterestWidget(
      scope,
      100,
      () => remaining,
      timerState.timers,
    );

    // API waiter schedules its timeout first, then the first poll.
    expect(timerState.delays()).toEqual([1000, 100]);
    scope.apiReadyValue = true;
    remaining = 400; // the API wait consumed 600ms of the shared budget
    timerState.firePoll();
    await Promise.resolve();
    await Promise.resolve();
    expect(scope.buildCalls).toBe(1);
    // The render wait must use the remaining budget, not a fresh full timeout.
    expect(timerState.delays()).toEqual([400]);
    timerState.fireTimeout();
    await expect(promise).rejects.toThrow("render timed out");
    expect(timerState.scheduled()).toBe(0);
  });

  it("calls build at most once per attempt across sequential attempts", async () => {
    const scope = pinterestScope();
    scope.apiReadyValue = true;
    const timerState = pollingTimers();

    scope.domReadyValue = true;
    await renderPinterestWidget(scope, 100, () => 1000, timerState.timers);
    scope.domReadyValue = false;
    const second = renderPinterestWidget(
      scope,
      100,
      () => 1000,
      timerState.timers,
    );
    scope.domReadyValue = true;
    scope.emitDom();
    await expect(second).resolves.toBeUndefined();
    expect(scope.buildCalls).toBe(2);
    expect(timerState.scheduled()).toBe(0);
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

  it("disposes an in-flight attempt and rejects future retries", async () => {
    let rejectIframe!: (error: Error) => void;
    const iframePromise = new Promise<void>((_, reject) => {
      rejectIframe = reject;
    });
    const target = fakeTarget();
    target.iframePromise = iframePromise;
    const runtime = createExternalEmbedRuntime(iframeConfig, "video", target);

    const attempt = runtime.load();
    await Promise.resolve();
    runtime.dispose();
    rejectIframe(new Error("late iframe"));
    await expect(attempt).rejects.toThrow();
    expect(runtime.state).toBe("idle");
    await expect(runtime.load()).rejects.toThrow("disposed");
    expect(target.clearCalls).toBe(2);
  });
});

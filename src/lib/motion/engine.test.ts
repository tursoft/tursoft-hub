import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Engine = typeof import("./engine");

/** Manual frame queue standing in for requestAnimationFrame. Ids start at 1, like browsers. */
function installFrameDriver() {
  const pending = new Map<number, FrameRequestCallback>();
  let nextId = 1;
  let now = 0;

  vi.stubGlobal("window", {
    innerWidth: 1280,
    innerHeight: 720,
    scrollY: 0,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
  vi.stubGlobal("document", {
    hidden: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    const id = nextId++;
    pending.set(id, callback);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => {
    pending.delete(id);
  });

  return {
    pendingFrames: () => pending.size,
    /** Runs every callback queued so far, like the browser does at the start of a frame. */
    runFrame() {
      now += 16;
      const callbacks = [...pending.values()];
      pending.clear();
      callbacks.forEach((callback) => callback(now));
    },
  };
}

describe("shared frame loop", () => {
  let driver: ReturnType<typeof installFrameDriver>;
  let engine: Engine;

  beforeEach(async () => {
    vi.resetModules();
    driver = installFrameDriver();
    engine = await import("./engine");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("keeps calling healthy listeners after another listener throws", () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const thrower = vi.fn(() => {
      throw new Error("boom");
    });
    const healthy = vi.fn();
    engine.subscribeFrame(thrower);
    engine.subscribeFrame(healthy);

    driver.runFrame();
    driver.runFrame();
    driver.runFrame();

    expect(healthy).toHaveBeenCalledTimes(3);
    expect(thrower).toHaveBeenCalledTimes(3);
    expect(errors).toHaveBeenCalled();
    expect(driver.pendingFrames()).toBe(1);
  });

  it("runs a single loop when the last listener unsubscribes inside its own frame and another subscribes later", () => {
    let unsubscribeFirst = () => {};
    const first = vi.fn(() => unsubscribeFirst());
    unsubscribeFirst = engine.subscribeFrame(first);

    driver.runFrame();
    expect(first).toHaveBeenCalledTimes(1);
    expect(driver.pendingFrames()).toBe(0);

    const second = vi.fn();
    engine.subscribeFrame(second);
    expect(driver.pendingFrames()).toBe(1);

    driver.runFrame();
    expect(second).toHaveBeenCalledTimes(1);
    expect(driver.pendingFrames()).toBe(1);

    driver.runFrame();
    expect(second).toHaveBeenCalledTimes(2);
    expect(first).toHaveBeenCalledTimes(1);
    expect(driver.pendingFrames()).toBe(1);
  });

  it("runs a single loop when a listener swaps itself for a new subscription within one frame", () => {
    const replacement = vi.fn();
    let unsubscribeFirst = () => {};
    const first = vi.fn(() => {
      unsubscribeFirst();
      engine.subscribeFrame(replacement);
    });
    unsubscribeFirst = engine.subscribeFrame(first);

    driver.runFrame();
    expect(driver.pendingFrames()).toBe(1);

    // A Set visits entries added during iteration, so the replacement may already have run once in that frame.
    replacement.mockClear();
    driver.runFrame();
    expect(replacement).toHaveBeenCalledTimes(1);
    expect(driver.pendingFrames()).toBe(1);
  });
});

import { afterEach, describe, expect, it } from "vitest";
import { resolveAgentRuntime } from "./runtime-select.js";

describe("resolveAgentRuntime", () => {
  const originalEnv = process.env.OPENCLAW_RUNTIME;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.OPENCLAW_RUNTIME;
    } else {
      process.env.OPENCLAW_RUNTIME = originalEnv;
    }
  });

  it("defaults to copilot when env is unset", () => {
    delete process.env.OPENCLAW_RUNTIME;
    expect(resolveAgentRuntime()).toBe("copilot");
  });

  it('returns pi when env is "pi"', () => {
    process.env.OPENCLAW_RUNTIME = "pi";
    expect(resolveAgentRuntime()).toBe("pi");
  });

  it('returns pi when env is "pi-embedded"', () => {
    process.env.OPENCLAW_RUNTIME = "pi-embedded";
    expect(resolveAgentRuntime()).toBe("pi");
  });

  it("is case-insensitive for pi", () => {
    process.env.OPENCLAW_RUNTIME = "PI";
    expect(resolveAgentRuntime()).toBe("pi");
  });

  it("trims whitespace", () => {
    process.env.OPENCLAW_RUNTIME = "  pi  ";
    expect(resolveAgentRuntime()).toBe("pi");
  });

  it("defaults to copilot for unknown values", () => {
    process.env.OPENCLAW_RUNTIME = "something-else";
    expect(resolveAgentRuntime()).toBe("copilot");
  });
});

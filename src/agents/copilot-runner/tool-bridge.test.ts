import { describe, expect, it } from "vitest";
import { bridgeTool, bridgeTools } from "./tool-bridge.js";

function fakeAgentTool(
  overrides: Partial<{
    name: string;
    description: string;
    label: string;
    parameters: Record<string, unknown>;
    execute: (
      id: string,
      params: unknown,
    ) => Promise<{ content: { type: string; text: string }[]; details: unknown }>;
  }> = {},
) {
  return {
    name: overrides.name ?? "test_tool",
    description: overrides.description ?? "A test tool",
    label: overrides.label ?? "Test Tool",
    parameters: overrides.parameters ?? {
      type: "object",
      properties: { input: { type: "string" } },
    },
    execute:
      overrides.execute ??
      (async () => ({
        content: [{ type: "text" as const, text: "tool result" }],
        details: {},
      })),
  };
}

describe("bridgeTool", () => {
  it("converts name, description, and parameters", () => {
    const agentTool = fakeAgentTool({ name: "message", description: "Send a message" });
    const sdkTool = bridgeTool(agentTool as never);

    expect(sdkTool.name).toBe("message");
    expect(sdkTool.description).toBe("Send a message");
    expect(sdkTool.overridesBuiltInTool).toBe(true);
  });

  it("handler returns ToolResultObject on success", async () => {
    const agentTool = fakeAgentTool({
      execute: async () => ({
        content: [
          { type: "text" as const, text: "Hello " },
          { type: "text" as const, text: "world" },
        ],
        details: {},
      }),
    });
    const sdkTool = bridgeTool(agentTool as never);
    const result = await sdkTool.handler(
      {},
      { sessionId: "s1", toolCallId: "tc1", toolName: "test_tool", arguments: {} },
    );

    expect(result).toEqual({ textResultForLlm: "Hello \nworld", resultType: "success" });
  });

  it("handler returns failure on execute error", async () => {
    const agentTool = fakeAgentTool({
      execute: async () => {
        throw new Error("tool broke");
      },
    });
    const sdkTool = bridgeTool(agentTool as never);
    const result = await sdkTool.handler(
      {},
      { sessionId: "s1", toolCallId: "tc1", toolName: "test_tool", arguments: {} },
    );

    expect(result).toEqual({ textResultForLlm: "", resultType: "failure", error: "tool broke" });
  });
});

describe("bridgeTools", () => {
  it("deduplicates tools by name", () => {
    const tools = [
      fakeAgentTool({ name: "web_search" }),
      fakeAgentTool({ name: "web_search" }),
      fakeAgentTool({ name: "cron" }),
    ];
    const sdkTools = bridgeTools(tools as never[]);

    expect(sdkTools.map((t) => t.name)).toEqual(["web_search", "cron"]);
  });

  it("sets overridesBuiltInTool on all tools", () => {
    const tools = [fakeAgentTool({ name: "bash" }), fakeAgentTool({ name: "message" })];
    const sdkTools = bridgeTools(tools as never[]);

    expect(sdkTools.every((t) => t.overridesBuiltInTool)).toBe(true);
  });

  it("returns empty array for empty input", () => {
    expect(bridgeTools([])).toEqual([]);
  });
});

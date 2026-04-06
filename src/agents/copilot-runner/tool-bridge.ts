/**
 * Bridge OpenClaw's AgentTool format to the Copilot SDK's Tool format.
 *
 * OpenClaw AgentTool:
 *   { name, description, parameters, label, execute(id, params, signal) → {content, details} }
 *
 * Copilot SDK Tool:
 *   { name, description, parameters, handler(args, invocation) → ToolResultObject }
 */
import type { Tool, ToolInvocation, ToolResultObject } from "@github/copilot-sdk";
import type { AnyAgentTool } from "../pi-tools.types.js";

/**
 * Convert an OpenClaw AgentTool into a Copilot SDK Tool definition.
 *
 * Sets `overridesBuiltInTool` so OpenClaw's tools take precedence when names
 * collide with the Copilot runtime's built-in tools.
 */
export function bridgeTool(agentTool: AnyAgentTool): Tool {
  return {
    name: agentTool.name,
    description: agentTool.description,
    parameters: agentTool.parameters as Record<string, unknown> | undefined,
    overridesBuiltInTool: true,
    handler: async (args: unknown, invocation: ToolInvocation): Promise<ToolResultObject> => {
      const preparedArgs = agentTool.prepareArguments ? agentTool.prepareArguments(args) : args;

      try {
        const result = await agentTool.execute(
          invocation.toolCallId,
          preparedArgs,
          undefined, // AbortSignal — not available from SDK invocation
        );

        const textParts = result.content
          .filter((c): c is { type: "text"; text: string } => c.type === "text")
          .map((c) => c.text);

        return {
          textResultForLlm: textParts.join("\n") || "OK",
          resultType: "success",
        };
      } catch (err) {
        return {
          textResultForLlm: "",
          resultType: "failure",
          error: err instanceof Error ? err.message : String(err),
        };
      }
    },
  };
}

/**
 * Convert an array of OpenClaw AgentTools into Copilot SDK Tools.
 *
 * Deduplicates by name (first wins) to avoid "Tool names must be unique" errors.
 */
export function bridgeTools(agentTools: AnyAgentTool[]): Tool[] {
  const seen = new Set<string>();
  const result: Tool[] = [];
  for (const t of agentTools) {
    if (!seen.has(t.name)) {
      seen.add(t.name);
      result.push(bridgeTool(t));
    }
  }
  return result;
}

/**
 * Runtime selector: choose between pi-embedded and copilot-sdk agent runners.
 *
 * Controlled by the `OPENCLAW_RUNTIME` environment variable:
 * - "copilot" → use @github/copilot-sdk (CopilotClient → JSON-RPC → Copilot CLI)
 * - "pi" (default) → use @mariozechner/pi-* (in-process agent loop)
 *
 * This module re-exports the run function matching the active runtime so
 * callers can switch without code changes.
 */
import type { RunEmbeddedPiAgentParams } from "./pi-embedded-runner/run/params.js";
import type { EmbeddedPiRunResult } from "./pi-embedded-runner/types.js";

export type AgentRuntime = "pi" | "copilot";

export function resolveAgentRuntime(): AgentRuntime {
  const env = process.env.OPENCLAW_RUNTIME?.trim().toLowerCase();
  if (env === "copilot" || env === "copilot-sdk") {
    return "copilot";
  }
  return "pi";
}

/**
 * Run an agent turn using the active runtime.
 *
 * Same interface as `runEmbeddedPiAgent` — callers don't need to know which
 * runtime is active.
 */
export async function runAgent(params: RunEmbeddedPiAgentParams): Promise<EmbeddedPiRunResult> {
  const runtime = resolveAgentRuntime();

  if (runtime === "copilot") {
    const { runCopilotAgent } = await import("./copilot-runner/run.js");
    return runCopilotAgent(params);
  }

  // Default: pi-embedded (existing behavior).
  const { runEmbeddedPiAgent } = await import("./pi-embedded.js");
  return runEmbeddedPiAgent(params);
}

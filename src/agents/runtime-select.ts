/**
 * Runtime selector: choose between copilot-sdk and pi-embedded agent runners.
 *
 * Controlled by the `OPENCLAW_RUNTIME` environment variable:
 * - "copilot" (default) → use @github/copilot-sdk (CopilotClient → JSON-RPC → Copilot CLI)
 * - "pi" → use @mariozechner/pi-* (in-process agent loop, legacy fallback)
 *
 * This module re-exports the run function matching the active runtime so
 * callers can switch without code changes.
 */
import type { RunEmbeddedPiAgentParams } from "./pi-embedded-runner/run/params.js";
import type { EmbeddedPiRunResult } from "./pi-embedded-runner/types.js";

export type AgentRuntime = "pi" | "copilot";

export function resolveAgentRuntime(): AgentRuntime {
  const env = process.env.OPENCLAW_RUNTIME?.trim().toLowerCase();
  if (env === "pi" || env === "pi-embedded") {
    return "pi";
  }
  return "copilot";
}

/**
 * Run an agent turn using the active runtime.
 *
 * Same interface as `runEmbeddedPiAgent` — callers don't need to know which
 * runtime is active.
 */
export async function runAgent(params: RunEmbeddedPiAgentParams): Promise<EmbeddedPiRunResult> {
  const runtime = resolveAgentRuntime();

  if (runtime === "pi") {
    const { runEmbeddedPiAgent } = await import("./pi-embedded.js");
    return runEmbeddedPiAgent(params);
  }

  // Default: Copilot SDK.
  const { runCopilotAgent } = await import("./copilot-runner/run.js");
  return runCopilotAgent(params);
}

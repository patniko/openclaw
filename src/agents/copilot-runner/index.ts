/**
 * Copilot SDK agent runner — public API.
 *
 * Drop-in replacement for `src/agents/pi-embedded.ts` when using the Copilot
 * SDK runtime instead of pi-mono.
 */
export { runCopilotAgent } from "./run.js";
export { getCopilotClient, disposeCopilotClient } from "./client.js";
export type {
  EmbeddedPiAgentMeta,
  EmbeddedPiCompactResult,
  EmbeddedPiRunMeta,
  EmbeddedPiRunResult,
} from "../pi-embedded-runner/types.js";

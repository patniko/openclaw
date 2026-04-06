/**
 * Copilot SDK client lifecycle management.
 *
 * Maintains a singleton CopilotClient and provides session creation/resumption.
 * Follows the Conduit coding-agent pattern: lazy init, reconnection on expiration.
 */
import {
  CopilotClient,
  type CopilotSession,
  type SessionConfig,
  approveAll,
} from "@github/copilot-sdk";

let _client: CopilotClient | null = null;
let _clientToken: string | undefined;

/**
 * Get or create the singleton CopilotClient.
 * Recreates if the GitHub token changes (e.g. re-login).
 */
export function getCopilotClient(githubToken?: string): CopilotClient {
  const token = githubToken || process.env.GITHUB_TOKEN || process.env.GH_TOKEN;

  if (_client && _clientToken === token) {
    return _client;
  }

  // Dispose previous client if token changed.
  if (_client) {
    _client.stop().catch(() => {});
    _client = null;
  }

  const options: ConstructorParameters<typeof CopilotClient>[0] = {};

  if (token) {
    options.githubToken = token;
    options.useLoggedInUser = false;
  }

  _client = new CopilotClient(options);
  _clientToken = token;
  return _client;
}

/**
 * Create a new Copilot session for an agent run.
 */
export async function createCopilotSession(opts: {
  githubToken?: string;
  model?: string;
  streaming?: boolean;
  systemMessage?: SessionConfig["systemMessage"];
  tools?: SessionConfig["tools"];
  workingDirectory?: string;
}): Promise<CopilotSession> {
  const client = getCopilotClient(opts.githubToken);

  const config: SessionConfig = {
    onPermissionRequest: approveAll,
    streaming: opts.streaming ?? true,
    ...(opts.model ? { model: opts.model } : {}),
    ...(opts.systemMessage ? { systemMessage: opts.systemMessage } : {}),
    ...(opts.tools ? { tools: opts.tools } : {}),
    ...(opts.workingDirectory ? { workingDirectory: opts.workingDirectory } : {}),
  };

  return client.createSession(config);
}

/**
 * Resume an existing Copilot session by ID.
 */
export async function resumeCopilotSession(opts: {
  sessionId: string;
  githubToken?: string;
  model?: string;
  streaming?: boolean;
}): Promise<CopilotSession> {
  const client = getCopilotClient(opts.githubToken);

  return client.resumeSession(opts.sessionId, {
    onPermissionRequest: approveAll,
    streaming: opts.streaming ?? true,
    ...(opts.model ? { model: opts.model } : {}),
  });
}

/**
 * Detect "session not found" errors (CLI server evicted the session).
 */
export function isSessionExpired(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return /session not found/i.test(msg);
}

/** Dispose the singleton client (for clean shutdown). */
export async function disposeCopilotClient(): Promise<void> {
  if (_client) {
    await _client.stop();
    _client = null;
    _clientToken = undefined;
  }
}

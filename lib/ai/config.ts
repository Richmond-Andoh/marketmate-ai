/**
 * AI provider configuration.
 * Reads server-only env vars — never import this from client components.
 */

export type AiProvider = "backboard" | "openai_compatible";

export interface AiConfig {
  provider: AiProvider;
  model: string;
  baseUrl: string;
  apiKey: string;
  timeoutMs: number;
}

export class AiConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiConfigError";
  }
}

function requiredEnv(env: NodeJS.ProcessEnv, key: string, hint: string): string {
  const value = env[key]?.trim();
  if (!value) {
    throw new AiConfigError(`Missing ${key}. ${hint}`);
  }
  return value;
}

export function getAiConfig(env: NodeJS.ProcessEnv = process.env): AiConfig {
  const rawProvider = (env.AI_PROVIDER?.trim() || "backboard") as string;
  if (rawProvider !== "backboard" && rawProvider !== "openai_compatible") {
    throw new AiConfigError(
      `Unknown AI_PROVIDER "${rawProvider}". Expected "backboard" or "openai_compatible".`,
    );
  }
  const provider = rawProvider as AiProvider;

  const model = env.AI_MODEL?.trim() || "openai/gpt-oss-20b";

  const parsedTimeout = Number.parseInt(env.AI_TIMEOUT_MS ?? "20000", 10);
  const timeoutMs =
    Number.isFinite(parsedTimeout) && parsedTimeout > 0
      ? Math.min(parsedTimeout, 120_000)
      : 20_000;

  if (provider === "backboard") {
    const apiKey = requiredEnv(
      env,
      "BACKBOARD_API_KEY",
      "Set it in .env.local (local) or the Render dashboard (prod).",
    );
    // Overridable for tests / self-hosted gateways; not listed in .env.example
    // to keep the default setup simple.
    const baseUrl = env.BACKBOARD_BASE_URL?.trim() || "https://api.backboard.io/v1";
    return { provider, model, baseUrl, apiKey, timeoutMs };
  }

  const baseUrl = requiredEnv(
    env,
    "AI_BASE_URL",
    "Example: https://api.groq.com/openai/v1",
  );
  const apiKey = requiredEnv(env, "AI_API_KEY", "Set your provider API key.");
  return { provider, model, baseUrl, apiKey, timeoutMs };
}

export function chatCompletionsUrl(baseUrl: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/chat/completions`;
}

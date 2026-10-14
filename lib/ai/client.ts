import type { ChatMessage } from "@/lib/prompt";
import { chatCompletionsUrl, type AiConfig } from "@/lib/ai/config";

export type AiErrorCode = "config" | "timeout" | "upstream" | "parse";

export class AiError extends Error {
  code: AiErrorCode;
  status: number;
  retryable: boolean;

  constructor(
    code: AiErrorCode,
    message: string,
    opts: { status?: number; retryable?: boolean; cause?: unknown } = {},
  ) {
    super(message, { cause: opts.cause });
    this.name = "AiError";
    this.code = code;
    this.status = opts.status ?? (code === "timeout" ? 504 : 502);
    this.retryable = opts.retryable ?? code === "timeout";
  }
}

interface OpenAIChatResponse {
  choices?: Array<{ message?: { content?: string | null } }>;
}

type FetchImpl = typeof fetch;

/**
 * Call any OpenAI-compatible chat-completions endpoint (Backboard and
 * `openai_compatible` providers share this shape) and return the raw
 * assistant content string. Parsing/validation happens in `parse.ts`.
 */
export async function chatCompletion(
  messages: ChatMessage[],
  config: AiConfig,
  fetchImpl: FetchImpl = fetch,
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    let res: Response;
    try {
      res = await fetchImpl(chatCompletionsUrl(config.baseUrl), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages,
          temperature: 0.7,
          response_format: { type: "json_object" },
        }),
        signal: controller.signal,
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        throw new AiError(
          "timeout",
          `AI request timed out after ${config.timeoutMs}ms`,
          { status: 504, retryable: true },
        );
      }
      throw new AiError("upstream", "AI request failed to reach the provider", {
        cause: err,
      });
    }

    if (!res.ok) {
      const detail = (await res.text().catch(() => "")).slice(0, 500);
      throw new AiError(
        "upstream",
        `AI provider returned ${res.status}${detail ? `: ${detail}` : ""}`,
        { status: 502, retryable: res.status === 429 || res.status >= 500 },
      );
    }

    const data = (await res.json().catch((cause: unknown) => {
      throw new AiError("parse", "AI provider returned invalid JSON", {
        cause,
      });
    })) as OpenAIChatResponse;

    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      throw new AiError("parse", "AI provider returned an empty response");
    }
    return content;
  } finally {
    clearTimeout(timer);
  }
}

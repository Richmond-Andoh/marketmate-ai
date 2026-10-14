import { describe, expect, it, vi, afterEach } from "vitest";
import { getAiConfig, AiConfigError } from "@/lib/ai/config";
import { chatCompletion, AiError } from "@/lib/ai/client";
import { extractJsonObject, parseGenerationOutput } from "@/lib/ai/parse";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  resetRateLimit();
});

describe("getAiConfig", () => {
  it("resolves backboard defaults and requires its key", () => {
    vi.stubEnv("AI_PROVIDER", "backboard");
    vi.stubEnv("BACKBOARD_API_KEY", "");
    expect(() => getAiConfig()).toThrow(AiConfigError);

    vi.stubEnv("BACKBOARD_API_KEY", "secret");
    vi.stubEnv("AI_MODEL", "");
    const cfg = getAiConfig();
    expect(cfg.provider).toBe("backboard");
    expect(cfg.model).toBe("openai/gpt-oss-20b");
    expect(cfg.baseUrl).toContain("backboard");
    expect(cfg.timeoutMs).toBe(20_000);
  });

  it("resolves an openai_compatible endpoint and clamps the timeout", () => {
    vi.stubEnv("AI_PROVIDER", "openai_compatible");
    vi.stubEnv("AI_BASE_URL", "https://api.example.com/v1/");
    vi.stubEnv("AI_API_KEY", "k");
    vi.stubEnv("AI_TIMEOUT_MS", "999999");
    const cfg = getAiConfig();
    expect(cfg.baseUrl).toBe("https://api.example.com/v1/");
    expect(cfg.timeoutMs).toBe(120_000);
  });

  it("rejects unknown providers", () => {
    vi.stubEnv("AI_PROVIDER", "nope");
    expect(() => getAiConfig()).toThrow(/Unknown AI_PROVIDER/);
  });
});

describe("parseGenerationOutput", () => {
  const valid = JSON.stringify({
    description: "A".repeat(60),
    whatsappMessage: "Hello! Reply to order this great product today.",
    captions: ["one #a", "two #b", "three #c"],
    callToAction: "Message us now to order.",
  });

  it("parses raw JSON and fenced JSON", () => {
    expect(parseGenerationOutput(valid).callToAction).toContain("Message us");
    expect(parseGenerationOutput("```json\n" + valid + "\n```").description).toHaveLength(60);
  });

  it("throws AiError on non-JSON or wrong shape", () => {
    expect(() => extractJsonObject("no braces here")).toThrow(AiError);
    expect(() => parseGenerationOutput('{"description":"x"}')).toThrow(AiError);
  });
});

describe("chatCompletion", () => {
  const cfg = {
    provider: "backboard" as const,
    model: "openai/gpt-oss-20b",
    baseUrl: "https://api.example.com/v1",
    apiKey: "secret",
    timeoutMs: 1000,
  };

  it("returns assistant content on success", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ choices: [{ message: { content: "  hello  " } }] }),
        { status: 200 },
      ),
    );
    await expect(
      chatCompletion([{ role: "user", content: "hi" }], cfg, fetchMock),
    ).resolves.toBe("hello");
    expect(fetchMock.mock.calls[0][0]).toContain("/chat/completions");
  });

  it("maps upstream errors and empty responses", async () => {
    const bad = vi.fn().mockResolvedValue(new Response("nope", { status: 500 }));
    await expect(chatCompletion([], cfg, bad)).rejects.toMatchObject({
      code: "upstream",
      status: 502,
    });

    const empty = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ choices: [] }), { status: 200 }),
    );
    await expect(chatCompletion([], cfg, empty)).rejects.toMatchObject({
      code: "parse",
    });
  });
});

describe("checkRateLimit", () => {
  it("allows `limit` hits then blocks with retry-after", () => {
    expect(checkRateLimit("ip-1", 2, 1000).limited).toBe(false);
    expect(checkRateLimit("ip-1", 2, 2000).limited).toBe(false);
    const blocked = checkRateLimit("ip-1", 2, 3000);
    expect(blocked.limited).toBe(true);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });
});

import { describe, expect, it, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/generate/route";
import { resetRateLimit } from "@/lib/rate-limit";

const validOutput = {
  description: "A quality handmade wallet crafted for everyday carry. ".repeat(3).slice(0, 120),
  whatsappMessage: "Hi! Our handmade leather wallet is back in stock. Reply to order yours today!",
  captions: ["Carry in style #wallet #handmade #style", "Built to last #leather #edc #craft", "Your new essential #shop #gift #sale"],
  callToAction: "Message us now to order yours.",
};

function openAiResponse(content: string) {
  return new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  resetRateLimit();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  vi.stubEnv("AI_PROVIDER", "backboard");
  vi.stubEnv("BACKBOARD_API_KEY", "test-key");
  vi.stubEnv("RATE_LIMIT_PER_MINUTE", "10");
});

describe("POST /api/generate", () => {
  it("returns 400 with fieldErrors for invalid input", async () => {
    const res = await POST(
      new Request("http://localhost/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName: "A", features: "short" }),
      }),
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.fieldErrors.productName).toBeDefined();
  });

  it("returns generated content for valid input", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(openAiResponse(JSON.stringify(validOutput))),
    );
    const res = await POST(
      new Request("http://localhost/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: "Handmade Leather Wallet",
          features: "Full-grain leather, 6 card slots, RFID blocking, slim profile.",
        }),
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.callToAction).toBe(validOutput.callToAction);
    expect(json.captions).toHaveLength(3);
  });

  it("returns 502 when the model output fails validation", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(openAiResponse('{"wrong":"shape"}')),
    );
    const res = await POST(
      new Request("http://localhost/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: "Handmade Leather Wallet",
          features: "Full-grain leather, 6 card slots, RFID blocking, slim profile.",
        }),
      }),
    );
    expect(res.status).toBe(502);
  });

  it("rate-limits after the configured quota", async () => {
    vi.stubEnv("RATE_LIMIT_PER_MINUTE", "1");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(openAiResponse(JSON.stringify(validOutput))),
    );
    const body = JSON.stringify({
      productName: "Handmade Leather Wallet",
      features: "Full-grain leather, 6 card slots, RFID blocking, slim profile.",
    });
    const first = await POST(
      new Request("http://localhost/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": "1.2.3.4" },
        body,
      }),
    );
    expect(first.status).toBe(200);
    const second = await POST(
      new Request("http://localhost/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": "1.2.3.4" },
        body,
      }),
    );
    expect(second.status).toBe(429);
  });

  it("rejects oversized bodies with 413", async () => {
    const res = await POST(
      new Request("http://localhost/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: "Handmade Leather Wallet",
          features: "x".repeat(20_000),
        }),
      }),
    );
    expect(res.status).toBe(413);
  });
});

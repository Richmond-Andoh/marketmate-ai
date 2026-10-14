import { describe, expect, it, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/describe/route";
import { buildDescribeMessages } from "@/lib/prompt";
import { resetRateLimit } from "@/lib/rate-limit";

const validDescribe = {
  productName: "Blue Ceramic Vase",
  category: "Home decor",
  features: "Hand-glazed blue ceramic vase, narrow neck, about 25cm tall.",
};

function openAiResponse(content: string) {
  return new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function photoRequest(file: File | null, name = "image") {
  const form = new FormData();
  if (file) form.append(name, file, "photo.png");
  return new Request("http://localhost/api/describe", {
    method: "POST",
    body: form,
  });
}

const png = new File([new Uint8Array([137, 80, 78, 71])], "photo.png", {
  type: "image/png",
});

beforeEach(() => {
  resetRateLimit();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  vi.stubEnv("AI_PROVIDER", "openai_compatible");
  vi.stubEnv("AI_BASE_URL", "https://api.example.com/v1");
  vi.stubEnv("AI_API_KEY", "test-key");
  vi.stubEnv("RATE_LIMIT_PER_MINUTE", "10");
});

describe("buildDescribeMessages", () => {
  it("sends system guidance plus a text+image user message", () => {
    const [system, user] = buildDescribeMessages("data:image/png;base64,AAA");
    expect(system.role).toBe("system");
    expect(typeof user.content).not.toBe("string");
    const parts = user.content as Array<{ type: string }>;
    expect(parts.map((p) => p.type)).toEqual(["text", "image_url"]);
  });
});

describe("POST /api/describe", () => {
  it("returns prefill data for a valid photo", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(openAiResponse(JSON.stringify(validDescribe))),
    );
    const res = await POST(photoRequest(png));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.productName).toBe("Blue Ceramic Vase");
    expect(json.features).toContain("ceramic");
  });

  it("returns 400 when no image is attached", async () => {
    const res = await POST(photoRequest(null));
    expect(res.status).toBe(400);
  });

  it("returns 400 for non-image files", async () => {
    const txt = new File(["hello"], "notes.txt", { type: "text/plain" });
    const res = await POST(photoRequest(txt));
    expect(res.status).toBe(400);
  });

  it("returns 413 for oversized photos", async () => {
    const big = new File([new Uint8Array(6 * 1024 * 1024)], "big.jpg", {
      type: "image/jpeg",
    });
    const res = await POST(photoRequest(big));
    expect(res.status).toBe(413);
  });

  it("returns 422 when no product is visible", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(openAiResponse('{"error":"no_product"}')),
    );
    const res = await POST(photoRequest(png));
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.error).toMatch(/clearer/i);
  });

  it("returns 502 when the vision output is garbage", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(openAiResponse("not json at all!!!")),
    );
    const res = await POST(photoRequest(png));
    expect(res.status).toBe(502);
  });
});

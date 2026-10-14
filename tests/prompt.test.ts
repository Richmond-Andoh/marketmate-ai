import { describe, expect, it } from "vitest";
import {
  OUTPUT_FIELDS,
  SYSTEM_PROMPT,
  buildMessages,
  buildUserPrompt,
} from "@/lib/prompt";
import { ProductInputSchema, TONES } from "@/lib/schemas";

const fullInput = ProductInputSchema.parse({
  productName: "Aroma Candle Set",
  category: "Home decor",
  features: "Three soy-wax candles, lavender, vanilla and cedar scents, 40h burn time each.",
  price: "$29.99",
  targetAudience: "Gift shoppers and home decor lovers",
  businessName: "Glow Studio",
  tone: "luxury",
});

describe("SYSTEM_PROMPT", () => {
  it("names every required output key", () => {
    for (const key of OUTPUT_FIELDS) {
      expect(SYSTEM_PROMPT).toContain(`"${key}"`);
    }
  });

  it("demands raw JSON and forbids invented facts", () => {
    expect(SYSTEM_PROMPT).toMatch(/single JSON object/i);
    expect(SYSTEM_PROMPT).toMatch(/no code fences/i);
    expect(SYSTEM_PROMPT).toMatch(/never invent prices/i);
  });
});

describe("buildUserPrompt", () => {
  it("includes every provided field value", () => {
    const prompt = buildUserPrompt(fullInput);
    expect(prompt).toContain("Aroma Candle Set");
    expect(prompt).toContain("Home decor");
    expect(prompt).toContain("40h burn time");
    expect(prompt).toContain("$29.99");
    expect(prompt).toContain("Gift shoppers");
    expect(prompt).toContain("Glow Studio");
    expect(prompt).toContain("Tone: luxury");
  });

  it("omits labels for fields that were not provided", () => {
    const minimal = ProductInputSchema.parse({
      productName: "Plain Tee",
      features: "100% cotton, unisex fit, available in five colours.",
    });
    const prompt = buildUserPrompt(minimal);
    expect(prompt).not.toContain("Price:");
    expect(prompt).not.toContain("Category:");
    expect(prompt).not.toContain("Business name:");
    expect(prompt).toContain("Tone: friendly");
  });

  it("produces distinct guidance for each tone", () => {
    const prompts = TONES.map((tone) =>
      buildUserPrompt({ ...fullInput, tone }),
    );
    expect(new Set(prompts).size).toBe(TONES.length);
  });
});

describe("buildMessages", () => {
  it("returns a system message followed by the user message", () => {
    const messages = buildMessages(fullInput);
    expect(messages).toHaveLength(2);
    expect(messages[0]).toEqual({ role: "system", content: SYSTEM_PROMPT });
    expect(messages[1].role).toBe("user");
    expect(messages[1].content).toBe(buildUserPrompt(fullInput));
  });
});

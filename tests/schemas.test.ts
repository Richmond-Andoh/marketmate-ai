import { describe, expect, it } from "vitest";
import {
  GenerationOutputSchema,
  ProductInputSchema,
  TONES,
  fieldErrors,
} from "@/lib/schemas";

const validInput = {
  productName: "Handmade Leather Wallet",
  features: "Full-grain leather, 6 card slots, RFID blocking, slim profile.",
};

describe("ProductInputSchema", () => {
  it("accepts a minimal valid input and applies the tone default", () => {
    const parsed = ProductInputSchema.parse(validInput);
    expect(parsed.tone).toBe("friendly");
    expect(parsed.category).toBeUndefined();
  });

  it("trims whitespace and turns empty optional strings into undefined", () => {
    const parsed = ProductInputSchema.parse({
      ...validInput,
      productName: "  Wallet  ",
      price: "   ",
      category: "",
    });
    expect(parsed.productName).toBe("Wallet");
    expect(parsed.price).toBeUndefined();
    expect(parsed.category).toBeUndefined();
  });

  it("rejects a too-short product name", () => {
    const result = ProductInputSchema.safeParse({ ...validInput, productName: "A" });
    expect(result.success).toBe(false);
  });

  it("rejects features that are too short or too long", () => {
    expect(
      ProductInputSchema.safeParse({ ...validInput, features: "short" }).success,
    ).toBe(false);
    expect(
      ProductInputSchema.safeParse({ ...validInput, features: "x".repeat(1001) })
        .success,
    ).toBe(false);
  });

  it("rejects unknown tones and accepts every listed tone", () => {
    expect(
      ProductInputSchema.safeParse({ ...validInput, tone: "sarcastic" }).success,
    ).toBe(false);
    for (const tone of TONES) {
      expect(ProductInputSchema.safeParse({ ...validInput, tone }).success).toBe(
        true,
      );
    }
  });

  it("rejects non-object and missing-field payloads", () => {
    expect(ProductInputSchema.safeParse(null).success).toBe(false);
    expect(ProductInputSchema.safeParse({}).success).toBe(false);
    expect(ProductInputSchema.safeParse("wallet").success).toBe(false);
  });
});

describe("GenerationOutputSchema", () => {
  const validOutput = {
    description: "A".repeat(60),
    whatsappMessage: "Hi! Our handmade wallet is now available. Reply to order.",
    captions: ["Caption one #a", "Caption two #b", "Caption three #c"],
    callToAction: "Message us now to order yours.",
  };

  it("accepts a well-formed model response", () => {
    expect(GenerationOutputSchema.safeParse(validOutput).success).toBe(true);
  });

  it("requires exactly three captions", () => {
    expect(
      GenerationOutputSchema.safeParse({
        ...validOutput,
        captions: validOutput.captions.slice(0, 2),
      }).success,
    ).toBe(false);
    expect(
      GenerationOutputSchema.safeParse({
        ...validOutput,
        captions: [...validOutput.captions, "extra"],
      }).success,
    ).toBe(false);
  });

  it("rejects missing or empty fields", () => {
    const { callToAction: _omit, ...missing } = validOutput;
    void _omit;
    expect(GenerationOutputSchema.safeParse(missing).success).toBe(false);
    expect(
      GenerationOutputSchema.safeParse({ ...validOutput, description: "" }).success,
    ).toBe(false);
  });
});

describe("fieldErrors", () => {
  it("maps the first issue per field to a message", () => {
    const result = ProductInputSchema.safeParse({ productName: "", features: "" });
    expect(result.success).toBe(false);
    if (result.success) return;
    const errors = fieldErrors(result.error);
    expect(errors.productName).toMatch(/at least 2/);
    expect(errors.features).toMatch(/at least 10/);
  });
});

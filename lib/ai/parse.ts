import {
  DescribeOutputSchema,
  GenerationOutputSchema,
  type DescribeOutput,
  type GenerationOutput,
} from "@/lib/schemas";
import { AiError } from "@/lib/ai/client";

/** Strip markdown fences / commentary and return the JSON object substring. */
export function extractJsonObject(text: string): string {
  let cleaned = text.trim();
  // Remove ```json ... ``` or ``` ... ``` wrappers if present.
  const fence = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fence?.[1]) cleaned = fence[1].trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new AiError("parse", "AI response did not contain a JSON object");
  }
  return cleaned.slice(start, end + 1);
}

/** Parse raw model text into validated GenerationOutput. Throws AiError on failure. */
export function parseGenerationOutput(raw: string): GenerationOutput {
  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJsonObject(raw));
  } catch (cause) {
    throw new AiError("parse", "AI response was not valid JSON", { cause });
  }
  const result = GenerationOutputSchema.safeParse(parsed);
  if (!result.success) {
    throw new AiError(
      "parse",
      "AI response did not match the expected shape",
      { cause: result.error },
    );
  }
  return result.data;
}

export type DescribeResult =
  | { ok: true; data: DescribeOutput }
  | { ok: false; reason: "no_product" };

/**
 * Parse raw vision-model text into validated prefill data.
 * Returns { ok: false } when the model reports no visible product or the
 * details are too vague to prefill — the caller maps that to a 422 asking
 * for a clearer photo. Throws AiError on malformed responses.
 */
export function parseDescribeOutput(raw: string): DescribeResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJsonObject(raw));
  } catch (cause) {
    throw new AiError("parse", "AI response was not valid JSON", { cause });
  }
  if (
    typeof parsed === "object" &&
    parsed !== null &&
    (parsed as Record<string, unknown>).error === "no_product"
  ) {
    return { ok: false, reason: "no_product" };
  }
  const result = DescribeOutputSchema.safeParse(parsed);
  if (!result.success) {
    return { ok: false, reason: "no_product" };
  }
  return { ok: true, data: result.data };
}

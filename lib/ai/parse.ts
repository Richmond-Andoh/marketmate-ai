import { GenerationOutputSchema, type GenerationOutput } from "@/lib/schemas";
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

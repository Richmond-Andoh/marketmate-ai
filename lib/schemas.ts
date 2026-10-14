import { z } from "zod";

/**
 * Shared validation schemas.
 * Imported by both the client form (instant feedback) and the API route
 * (the real gate), so limits only have to be defined once.
 */

export const TONES = [
  "professional",
  "friendly",
  "playful",
  "luxury",
  "urgent",
] as const;
export type Tone = (typeof TONES)[number];

export const TONE_LABELS: Record<Tone, string> = {
  professional: "Professional",
  friendly: "Friendly",
  playful: "Playful",
  luxury: "Luxury",
  urgent: "Urgent / limited offer",
};

const trimmed = (min: number, max: number, label: string) =>
  z
    .string()
    .trim()
    .min(min, `${label} must be at least ${min} characters`)
    .max(max, `${label} must be at most ${max} characters`);

const optionalTrimmed = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be at most ${max} characters`)
    .optional()
    .transform((v) => (v === "" ? undefined : v));

export const ProductInputSchema = z.object({
  productName: trimmed(2, 80, "Product name"),
  category: optionalTrimmed(60, "Category"),
  features: trimmed(10, 1000, "Features / details"),
  price: optionalTrimmed(40, "Price"),
  targetAudience: optionalTrimmed(120, "Target audience"),
  businessName: optionalTrimmed(80, "Business name"),
  tone: z.enum(TONES).default("friendly"),
});

export type ProductInput = z.infer<typeof ProductInputSchema>;
/** Shape before defaults are applied (what the form submits). */
export type ProductInputRaw = z.input<typeof ProductInputSchema>;

export const GenerationOutputSchema = z.object({
  description: trimmed(40, 1500, "Description"),
  whatsappMessage: trimmed(20, 800, "WhatsApp message"),
  captions: z
    .array(trimmed(5, 400, "Caption"))
    .length(3, "Exactly three captions are required"),
  callToAction: trimmed(5, 300, "Call to action"),
});

export type GenerationOutput = z.infer<typeof GenerationOutputSchema>;

/** Flatten Zod issues into { fieldName: firstMessage } for form display. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.length ? String(issue.path[0]) : "_form";
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}

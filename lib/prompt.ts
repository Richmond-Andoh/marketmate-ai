import type { ProductInput, Tone } from "@/lib/schemas";

/**
 * Prompt construction for the sales-content generator.
 * Pure functions, no I/O, so they are trivially unit-testable.
 */

const TONE_GUIDANCE: Record<Tone, string> = {
  professional:
    "Polished, confident and clear. No slang, minimal emojis, focus on value and reliability.",
  friendly:
    "Warm and conversational, like a helpful shop owner talking to a regular customer. A few emojis are fine.",
  playful:
    "Light, witty and energetic. Short punchy sentences, tasteful humour, emojis welcome.",
  luxury:
    "Refined, aspirational and understated. Emphasise craftsmanship, exclusivity and experience. No emojis.",
  urgent:
    "Direct and action-driven. Highlight scarcity or a time-limited offer without sounding pushy or dishonest.",
};

export const OUTPUT_FIELDS = [
  "description",
  "whatsappMessage",
  "captions",
  "callToAction",
] as const;

export const SYSTEM_PROMPT = `You are MarketMate, an expert sales copywriter for small businesses and online sellers.

You write persuasive, honest marketing copy from the product details the user provides.

Rules:
- Use ONLY the facts given. Never invent prices, discounts, specifications, awards, reviews or guarantees that were not provided.
- If no price is given, do not mention a price.
- Write in the same language the product details are written in.
- Match the requested tone exactly.
- Keep every piece of copy ready to paste and use without editing.
- Do not include placeholders such as [Your Name] or [Link].

Respond with a single JSON object and nothing else: no markdown, no code fences, no commentary before or after.
The JSON object must have exactly these keys:
{
  "description": string,        // 2-4 short paragraphs, professional product description for a shop listing or website
  "whatsappMessage": string,    // one ready-to-send WhatsApp sales message, max ~600 characters, may use line breaks and 1-3 emojis
  "captions": [string, string, string],  // three distinct social media captions (Instagram / Facebook / TikTok style), each with 2-5 relevant hashtags
  "callToAction": string        // one or two sentences that tell the customer exactly what to do next
}`;

function line(label: string, value: string | undefined): string | null {
  return value ? `${label}: ${value}` : null;
}

export function buildUserPrompt(input: ProductInput): string {
  const lines = [
    line("Product name", input.productName),
    line("Category", input.category),
    line("Features and details", input.features),
    line("Price", input.price),
    line("Target audience", input.targetAudience),
    line("Business name", input.businessName),
    `Tone: ${input.tone} — ${TONE_GUIDANCE[input.tone]}`,
  ].filter((l): l is string => l !== null);

  return `Create sales content for the following product.\n\n${lines.join("\n")}\n\nReturn only the JSON object.`;
}

export interface ChatMessage {
  role: "system" | "user";
  content: string;
}

export function buildMessages(input: ProductInput): ChatMessage[] {
  return [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: buildUserPrompt(input) },
  ];
}

import { NextResponse } from "next/server";
import { ProductInputSchema, fieldErrors } from "@/lib/schemas";
import { buildMessages } from "@/lib/prompt";
import { getAiConfig, AiConfigError } from "@/lib/ai/config";
import { chatCompletion, AiError } from "@/lib/ai/client";
import { parseGenerationOutput } from "@/lib/ai/parse";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  // 1. Rate limit per IP.
  const ip = clientIp(request);
  const { limited, retryAfterSec } = checkRateLimit(ip);
  if (limited) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(retryAfterSec) } },
    );
  }

  // 2. Parse + validate input (the real gate; client validation is UX only).
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }
  const input = ProductInputSchema.safeParse(body);
  if (!input.success) {
    return NextResponse.json(
      { error: "Invalid product details.", fieldErrors: fieldErrors(input.error) },
      { status: 400 },
    );
  }

  // 3. Resolve server-side AI config (keys never leave the server).
  try {
    const config = getAiConfig();
    const raw = await chatCompletion(buildMessages(input.data), config);
    const output = parseGenerationOutput(raw);
    return NextResponse.json(output);
  } catch (err) {
    if (err instanceof AiConfigError) {
      console.error("[generate] misconfigured:", err.message);
      return NextResponse.json(
        { error: "The AI service is not configured. Please try again later." },
        { status: 500 },
      );
    }
    if (err instanceof AiError) {
      console.error(`[generate] ${err.code}:`, err.message);
      if (err.code === "timeout") {
        return NextResponse.json(
          { error: "The AI service took too long. Please try again." },
          { status: 504 },
        );
      }
      return NextResponse.json(
        { error: "The AI service returned an unexpected result. Please try again." },
        { status: 502 },
      );
    }
    console.error("[generate] unexpected:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}

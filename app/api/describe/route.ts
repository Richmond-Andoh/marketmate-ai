import { NextResponse } from "next/server";
import { buildDescribeMessages } from "@/lib/prompt";
import { getAiConfig, getVisionModel, AiConfigError } from "@/lib/ai/config";
import { chatCompletion, AiError } from "@/lib/ai/client";
import { parseDescribeOutput } from "@/lib/ai/parse";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

/**
 * POST /api/describe — photo → form prefill.
 * Accepts multipart/form-data with a single `image` file, asks the vision
 * model for visible-only facts, and returns them for the user to review.
 * The form stays the gate: nothing here generates sales copy directly.
 */

// Client compresses to ~1024px JPEG first; 5MB comfortably covers that while
// keeping free-tier token usage and memory bounded (provider max is 20MB).
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: Request) {
  // 1. Rate limit per IP (shared bucket with /api/generate).
  const ip = clientIp(request);
  const { limited, retryAfterSec } = checkRateLimit(ip);
  if (limited) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(retryAfterSec) } },
    );
  }

  // 2. Extract + validate the upload.
  let image: File;
  try {
    const form = await request.formData();
    const file = form.get("image");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { error: "Attach a photo first (field name: image)." },
        { status: 400 },
      );
    }
    image = file;
  } catch {
    return NextResponse.json(
      { error: "Request must be multipart form data with an image." },
      { status: 400 },
    );
  }
  if (!ALLOWED_TYPES.includes(image.type)) {
    return NextResponse.json(
      { error: "Photo must be a JPEG, PNG or WebP image." },
      { status: 400 },
    );
  }
  if (image.size > MAX_IMAGE_BYTES) {
    return NextResponse.json(
      { error: "Photo is too large. Please use an image under 5MB." },
      { status: 413 },
    );
  }

  // 3. Ask the vision model (same provider/key, vision model id).
  try {
    const config = getAiConfig();
    const bytes = Buffer.from(await image.arrayBuffer());
    const dataUrl = `data:${image.type};base64,${bytes.toString("base64")}`;
    const raw = await chatCompletion(
      buildDescribeMessages(dataUrl),
      { ...config, model: getVisionModel() },
      fetch,
      { temperature: 0.2 },
    );
    const described = parseDescribeOutput(raw);
    if (!described.ok) {
      return NextResponse.json(
        {
          error:
            "Couldn't spot a product in that photo. Try a clearer, well-lit shot of the item itself.",
        },
        { status: 422 },
      );
    }
    return NextResponse.json(described.data);
  } catch (err) {
    if (err instanceof AiConfigError) {
      console.error("[describe] misconfigured:", err.message);
      return NextResponse.json(
        { error: "The AI service is not configured. Please try again later." },
        { status: 500 },
      );
    }
    if (err instanceof AiError) {
      console.error(`[describe] ${err.code}:`, err.message);
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
    console.error("[describe] unexpected:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}

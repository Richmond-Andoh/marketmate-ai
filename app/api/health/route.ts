import { NextResponse } from "next/server";

// Used by Render's health check. Must stay dependency-free and fast.
export function GET() {
  return NextResponse.json({ status: "ok" });
}

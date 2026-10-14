"use client";

import { useRef, useState } from "react";
import type { DescribeOutput } from "@/lib/schemas";

const ANALYZE_TIMEOUT_MS = 30_000;
/** Client-side downscale target: keeps uploads fast and vision tokens fixed. */
const MAX_DIM = 1024;

/** Downscale to a ≤1024px JPEG; falls back to the original on any failure. */
async function prepareImage(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIM / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.82),
    );
    return blob ?? file;
  } catch {
    return file;
  }
}

export default function PhotoFill({
  onPrefill,
  disabled = false,
}: {
  onPrefill: (data: DescribeOutput) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSelect(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("That file isn't a photo. Please choose an image.");
      return;
    }
    const prepared = await prepareImage(file);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(prepared));
    setBlob(prepared);
  }

  function clear() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setBlob(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function analyze() {
    if (!blob || busy) return;
    setBusy(true);
    setError(null);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ANALYZE_TIMEOUT_MS);
    try {
      const form = new FormData();
      form.append("image", blob, "photo.jpg");
      const res = await fetch("/api/describe", {
        method: "POST",
        body: form,
        signal: controller.signal,
      });
      const data = (await res.json().catch(() => null)) as
        | (Partial<DescribeOutput> & { error?: string })
        | null;
      if (!res.ok) {
        setError(data?.error ?? `Photo analysis failed (${res.status}).`);
        return;
      }
      onPrefill(data as DescribeOutput);
      clear();
    } catch (err) {
      setError(
        err instanceof DOMException && err.name === "AbortError"
          ? "Photo analysis timed out. Try again on a better connection."
          : "Could not reach the server. Check your connection.",
      );
    } finally {
      clearTimeout(timer);
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/50 p-3 dark:border-emerald-900 dark:bg-emerald-950/30">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        aria-label="Take or upload a product photo"
        disabled={disabled || busy}
        onChange={(e) => void onSelect(e.target.files?.[0])}
        className="hidden"
      />
      {!preview ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || busy}
          className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-emerald-700 transition hover:bg-emerald-100/60 active:scale-[0.99] disabled:opacity-50 dark:text-emerald-300 dark:hover:bg-emerald-900/40"
        >
          <span aria-hidden>📷</span> Fill from a photo — snap it, we read it
        </button>
      ) : (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Product photo preview"
            className="h-16 w-16 shrink-0 rounded-xl border border-zinc-200 object-cover dark:border-zinc-700"
          />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:flex-row">
            <button
              type="button"
              onClick={analyze}
              disabled={disabled || busy}
              className="min-h-[44px] flex-1 rounded-xl bg-emerald-600 px-3 text-sm font-bold text-white shadow-md shadow-emerald-600/25 transition hover:brightness-110 active:scale-[0.99] disabled:opacity-50"
            >
              {busy ? "Reading photo…" : "Analyze photo → fill form"}
            </button>
            <button
              type="button"
              onClick={clear}
              disabled={busy}
              className="min-h-[44px] rounded-xl border border-zinc-300 px-3 text-sm font-semibold text-zinc-600 transition hover:bg-white disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300"
            >
              Remove
            </button>
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      <p className="mt-1.5 text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
        AI drafts from visible details only — review and edit before
        generating. Photos go to your AI provider for analysis.
      </p>
    </div>
  );
}

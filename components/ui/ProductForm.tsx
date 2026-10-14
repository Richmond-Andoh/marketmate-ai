"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import {
  ProductInputSchema,
  TONES,
  TONE_LABELS,
  fieldErrors,
  type GenerationOutput,
  type ProductInput,
} from "@/lib/schemas";
import Results from "@/components/ui/Results";

/** Client timeout: longer than the server AI_TIMEOUT_MS so a 504 surfaces first. */
const CLIENT_TIMEOUT_MS = 30_000;

const EMPTY = {
  productName: "",
  category: "",
  features: "",
  price: "",
  targetAudience: "",
  businessName: "",
  tone: "friendly",
};

type Values = typeof EMPTY;

const inputClass = (invalid: boolean) =>
  // text-base (16px) prevents iOS Safari auto-zoom on focus; min-h hits the
  // 44px recommended touch target.
  `w-full rounded-lg border bg-white px-3 py-3 min-h-[44px] text-base text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-400 dark:focus:ring-zinc-800 ${
    invalid
      ? "border-red-500 dark:border-red-500"
      : "border-zinc-300 dark:border-zinc-700"
  }`;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
      {message}
    </p>
  );
}

export default function ProductForm() {
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [output, setOutput] = useState<GenerationOutput | null>(null);
  const [lastPayload, setLastPayload] = useState<ProductInput | null>(null);

  function update(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((prev) => {
      if (!(name in prev)) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }

  async function submitPayload(payload: ProductInput) {
    setFormError(null);
    setOutput(null);
    setPending(true);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      const data = (await res.json().catch(() => null)) as {
        error?: string;
        fieldErrors?: Record<string, string>;
      } | null;

      if (!res.ok) {
        if (data?.fieldErrors) setErrors(data.fieldErrors);
        setFormError(
          data?.error ?? `Request failed (${res.status}). Please try again.`,
        );
        return;
      }
      setOutput(data as unknown as GenerationOutput);
      setLastPayload(null);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setFormError(
          "The request timed out. Please check your connection and try again.",
        );
      } else {
        setFormError("Could not reach the server. Check your connection.");
      }
    } finally {
      clearTimeout(timer);
      setPending(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();

    // Client-side instant feedback; the API route re-validates authoritatively.
    const checked = ProductInputSchema.safeParse(values);
    if (!checked.success) {
      setErrors(fieldErrors(checked.error));
      return;
    }
    setErrors({});
    setLastPayload(checked.data);
    await submitPayload(checked.data);
  }

  async function onRetry() {
    if (pending || !lastPayload) return;
    await submitPayload(lastPayload);
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <form
        onSubmit={onSubmit}
        noValidate
        className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 text-left shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950"
      >
        <div>
          <label
            htmlFor="productName"
            className="mb-1 block text-sm font-medium"
          >
            Product name *
          </label>
          <input
            id="productName"
            name="productName"
            value={values.productName}
            onChange={update}
            placeholder="e.g. Handmade Leather Wallet"
            maxLength={80}
            required
            autoComplete="off"
            enterKeyHint="next"
            className={inputClass(!!errors.productName)}
          />
          <FieldError message={errors.productName} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="category" className="mb-1 block text-sm font-medium">
              Category
            </label>
            <input
              id="category"
              name="category"
              value={values.category}
              onChange={update}
              placeholder="e.g. Fashion"
              maxLength={60}
              autoComplete="off"
              enterKeyHint="next"
              className={inputClass(!!errors.category)}
            />
            <FieldError message={errors.category} />
          </div>
          <div>
            <label htmlFor="price" className="mb-1 block text-sm font-medium">
              Price
            </label>
            <input
              id="price"
              name="price"
              value={values.price}
              onChange={update}
              placeholder="e.g. $29.99"
              maxLength={40}
              inputMode="text"
              autoComplete="off"
              enterKeyHint="next"
              className={inputClass(!!errors.price)}
            />
            <FieldError message={errors.price} />
          </div>
        </div>

        <div>
          <label htmlFor="features" className="mb-1 block text-sm font-medium">
            Features / details *
          </label>
          <textarea
            id="features"
            name="features"
            value={values.features}
            onChange={update}
            placeholder="Materials, sizes, what's included, delivery info…"
            rows={4}
            maxLength={1000}
            required
            className={`${inputClass(!!errors.features)} resize-y`}
          />
          <FieldError message={errors.features} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="targetAudience"
              className="mb-1 block text-sm font-medium"
            >
              Target audience
            </label>
            <input
              id="targetAudience"
              name="targetAudience"
              value={values.targetAudience}
              onChange={update}
              placeholder="e.g. Gift shoppers"
              maxLength={120}
              autoComplete="off"
              enterKeyHint="next"
              className={inputClass(!!errors.targetAudience)}
            />
            <FieldError message={errors.targetAudience} />
          </div>
          <div>
            <label
              htmlFor="businessName"
              className="mb-1 block text-sm font-medium"
            >
              Business name
            </label>
            <input
              id="businessName"
              name="businessName"
              value={values.businessName}
              onChange={update}
              placeholder="e.g. Glow Studio"
              maxLength={80}
              autoComplete="organization"
              enterKeyHint="done"
              className={inputClass(!!errors.businessName)}
            />
            <FieldError message={errors.businessName} />
          </div>
        </div>

        <div>
          <label htmlFor="tone" className="mb-1 block text-sm font-medium">
            Tone
          </label>
          <select
            id="tone"
            name="tone"
            value={values.tone}
            onChange={update}
            className={inputClass(!!errors.tone)}
          >
            {TONES.map((tone) => (
              <option key={tone} value={tone}>
                {TONE_LABELS[tone]}
              </option>
            ))}
          </select>
          <FieldError message={errors.tone} />
        </div>

        {formError && (
          <div
            role="alert"
            className="flex flex-col gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between sm:gap-3 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
          >
            <p className="break-words">{formError}</p>
            {lastPayload && (
              <button
                type="button"
                onClick={onRetry}
                disabled={pending}
                className="shrink-0 self-stretch rounded-md border border-red-300 px-3 min-h-[44px] text-sm font-semibold transition hover:bg-red-100 disabled:opacity-50 sm:self-auto dark:border-red-800 dark:hover:bg-red-900"
              >
                Try again
              </button>
            )}
          </div>
        )}

        <div className="sticky bottom-0 -mx-1 bg-white/95 pt-2 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:bg-zinc-950/95">
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-zinc-900 px-4 min-h-[48px] py-3 text-base font-semibold text-white transition hover:bg-zinc-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            {pending ? "Generating…" : "Generate sales content"}
          </button>
        </div>
      </form>

      {pending && (
        <div
          aria-live="polite"
          className="rounded-xl border border-dashed border-zinc-300 p-4 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
        >
          Writing your product description, WhatsApp message and captions…
        </div>
      )}

      {output && <Results output={output} />}
    </div>
  );
}

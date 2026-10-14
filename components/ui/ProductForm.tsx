"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
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

const EXAMPLE: typeof EMPTY = {
  productName: "Handmade Leather Wallet",
  category: "Fashion Accessories",
  features:
    "Full-grain leather, 6 card slots plus ID window, RFID blocking lining, slim bifold profile, hand-stitched edges, gift box included.",
  price: "$29.99",
  targetAudience: "Young professionals and gift shoppers",
  businessName: "Glow Studio",
  tone: "friendly",
};

type Values = typeof EMPTY;

const TONE_DOT: Record<Values["tone"], string> = {
  professional: "bg-slate-500",
  friendly: "bg-emerald-500",
  playful: "bg-amber-500",
  luxury: "bg-purple-500",
  urgent: "bg-red-500",
};

const inputClass = (invalid: boolean) =>
  // text-base (16px) prevents iOS Safari auto-zoom on focus; min-h hits the
  // 44px recommended touch target.
  `w-full rounded-xl border bg-zinc-50/50 px-3.5 py-3 min-h-[44px] text-base text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 dark:bg-zinc-900/60 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-emerald-400 dark:focus:ring-emerald-950 ${
    invalid
      ? "border-red-500 dark:border-red-500"
      : "border-zinc-200 dark:border-zinc-800"
  }`;

const labelClass = "mb-1.5 block text-sm font-semibold";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">
      {message}
    </p>
  );
}

function LoadingSkeleton() {
  return (
    <div aria-live="polite" className="flex w-full flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="skeleton h-5 w-5 rounded-full" />
        <div className="skeleton h-4 w-56 rounded" />
      </div>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
        >
          <div className="skeleton mb-2 h-4 w-32 rounded" />
          <div className="skeleton mb-1.5 h-3.5 w-full rounded" />
          <div className="skeleton h-3.5 w-3/4 rounded" />
        </div>
      ))}
    </div>
  );
}

export default function ProductForm() {
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [output, setOutput] = useState<GenerationOutput | null>(null);
  const [lastPayload, setLastPayload] = useState<ProductInput | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (output && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [output]);

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

  function fillExample() {
    setValues(EXAMPLE);
    setErrors({});
    setFormError(null);
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
        className="flex flex-col gap-5 overflow-hidden rounded-3xl border border-zinc-200 bg-white text-left shadow-xl shadow-zinc-200/50 dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-black/40"
      >
        <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-400" />
        <div className="flex flex-col gap-5 p-5 sm:p-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold tracking-tight">
                Your product
              </h2>
              <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                One minute of typing, a full sales kit out.
              </p>
            </div>
            <button
              type="button"
              onClick={fillExample}
              className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-3 min-h-[36px] text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 active:scale-[0.97] dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 dark:hover:bg-emerald-900"
            >
              Try an example
            </button>
          </div>

          <div>
            <label htmlFor="productName" className={labelClass}>
              Product name <span className="text-emerald-600">*</span>
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

          <div className="grid gap-5 sm:grid-cols-2 sm:gap-4">
            <div>
              <label htmlFor="category" className={labelClass}>
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
              <label htmlFor="price" className={labelClass}>
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
            <label htmlFor="features" className={labelClass}>
              Features / details <span className="text-emerald-600">*</span>
            </label>
            <textarea
              id="features"
              name="features"
              value={values.features}
              onChange={update}
              placeholder="Materials, sizes, what's included, delivery info… The more detail, the better the copy."
              rows={4}
              maxLength={1000}
              required
              className={`${inputClass(!!errors.features)} resize-y`}
            />
            <div className="mt-1 flex items-center justify-between">
              <FieldError message={errors.features} />
              <span className="ml-auto text-[11px] tabular-nums text-zinc-400">
                {values.features.length}/1000
              </span>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 sm:gap-4">
            <div>
              <label htmlFor="targetAudience" className={labelClass}>
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
              <label htmlFor="businessName" className={labelClass}>
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

          <fieldset>
            <legend className={labelClass}>Tone</legend>
            <div role="radiogroup" aria-label="Tone" className="flex flex-wrap gap-2">
              {TONES.map((tone) => {
                const active = values.tone === tone;
                return (
                  <button
                    key={tone}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => {
                      setValues((v) => ({ ...v, tone }));
                      setErrors((prev) => {
                        if (!("tone" in prev)) return prev;
                        const next = { ...prev };
                        delete next.tone;
                        return next;
                      });
                    }}
                    className={`flex min-h-[44px] items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition active:scale-[0.97] ${
                      active
                        ? "border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-600/25"
                        : "border-zinc-200 bg-white text-zinc-700 hover:border-emerald-300 hover:bg-emerald-50/50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-emerald-800"
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`h-2 w-2 rounded-full ${active ? "bg-white" : TONE_DOT[tone]}`}
                    />
                    {TONE_LABELS[tone]}
                  </button>
                );
              })}
            </div>
            <FieldError message={errors.tone} />
          </fieldset>

          {formError && (
            <div
              role="alert"
              className="flex flex-col gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between sm:gap-3 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
            >
              <p className="break-words">{formError}</p>
              {lastPayload && (
                <button
                  type="button"
                  onClick={onRetry}
                  disabled={pending}
                  className="shrink-0 self-stretch rounded-lg border border-red-300 px-3 min-h-[44px] text-sm font-semibold transition hover:bg-red-100 disabled:opacity-50 sm:self-auto dark:border-red-800 dark:hover:bg-red-900"
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
              className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 min-h-[52px] py-3 text-base font-bold text-white shadow-lg shadow-emerald-600/25 transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? "✨ Writing your sales kit…" : "Generate my sales kit →"}
            </button>
            <p className="mt-2 text-center text-[11px] text-zinc-400">
              Listing + WhatsApp message + 3 captions + call to action
            </p>
          </div>
        </div>
      </form>

      {pending && <LoadingSkeleton />}

      {output && (
        <div ref={resultsRef} className="scroll-mt-20">
          <Results output={output} />
        </div>
      )}
    </div>
  );
}

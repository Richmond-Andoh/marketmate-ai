"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import {
  ProductInputSchema,
  TONES,
  TONE_LABELS,
  fieldErrors,
  type GenerationOutput,
} from "@/lib/schemas";
import Results from "@/components/ui/Results";

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
  `w-full rounded-lg border bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-400 dark:focus:ring-zinc-800 ${
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

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setOutput(null);

    // Client-side instant feedback; the API route re-validates authoritatively.
    const checked = ProductInputSchema.safeParse(values);
    if (!checked.success) {
      setErrors(fieldErrors(checked.error));
      return;
    }
    setErrors({});

    setPending(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(checked.data),
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
    } catch {
      setFormError("Could not reach the server. Check your connection.");
    } finally {
      setPending(false);
    }
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
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
          >
            {formError}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          {pending ? "Generating…" : "Generate sales content"}
        </button>
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

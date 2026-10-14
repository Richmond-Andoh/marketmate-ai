"use client";

import { useState } from "react";
import type { GenerationOutput } from "@/lib/schemas";

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for non-secure contexts: select via textarea.
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      el.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy ${label}`}
      className="shrink-0 rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function ResultCard({
  title,
  body,
  mono = false,
}: {
  title: string;
  body: string;
  mono?: boolean;
}) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 text-left shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        <CopyButton text={body} label={title} />
      </div>
      <p
        className={`whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 ${mono ? "" : ""}`}
      >
        {body}
      </p>
    </section>
  );
}

export default function Results({ output }: { output: GenerationOutput }) {
  const all = [
    output.description,
    output.whatsappMessage,
    ...output.captions,
    output.callToAction,
  ].join("\n\n");

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">
          Your sales content
        </h2>
        <CopyButton text={all} label="all content" />
      </div>
      <ResultCard title="Product description" body={output.description} />
      <ResultCard title="WhatsApp message" body={output.whatsappMessage} />
      <section className="rounded-xl border border-zinc-200 bg-white p-4 text-left shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold tracking-tight">
            Social captions
          </h3>
          <CopyButton text={output.captions.join("\n\n")} label="captions" />
        </div>
        <ol className="flex flex-col gap-3">
          {output.captions.map((caption, i) => (
            <li key={i} className="flex items-start justify-between gap-2">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                <span className="mr-1 font-semibold">{i + 1}.</span>
                {caption}
              </p>
              <CopyButton text={caption} label={`caption ${i + 1}`} />
            </li>
          ))}
        </ol>
      </section>
      <ResultCard title="Call to action" body={output.callToAction} />
    </div>
  );
}

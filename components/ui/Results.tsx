"use client";

import { useState } from "react";
import type { GenerationOutput } from "@/lib/schemas";

function CopyButton({ text, label }: { text: string; label: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      setState("failed");
    }
    setTimeout(() => setState("idle"), 1500);
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy ${label}`}
      className="shrink-0 rounded-md border border-zinc-300 px-3 min-h-[36px] py-1 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 active:scale-[0.97] dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
    >
      {state === "copied" ? "Copied!" : state === "failed" ? "Copy failed" : "Copy"}
    </button>
  );
}

function ResultCard({ title, body }: { title: string; body: string }) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 text-left shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        <CopyButton text={body} label={title} />
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
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
        <ol className="flex flex-col gap-4 sm:gap-3">
          {output.captions.map((caption, i) => (
            <li
              key={i}
              className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"
            >
              <p className="min-w-0 flex-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
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

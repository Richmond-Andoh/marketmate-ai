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
      className="shrink-0 rounded-full border border-zinc-200 bg-white px-3 min-h-[36px] py-1 text-xs font-semibold text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.97] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
    >
      {state === "copied" ? "✓ Copied!" : state === "failed" ? "Copy failed" : "Copy"}
    </button>
  );
}

function WhatsAppShare({ text }: { text: string }) {
  const href = `https://wa.me/?text=${encodeURIComponent(text)}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-[#25D366] px-3 py-1 text-xs font-bold text-white shadow-md shadow-green-600/20 transition hover:brightness-105 active:scale-[0.97]"
    >
      <span aria-hidden>↗</span> Send via WhatsApp
    </a>
  );
}

function ResultCard({
  icon,
  title,
  body,
  footer,
}: {
  icon: string;
  title: string;
  body: string;
  footer?: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 text-left shadow-sm sm:p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-sm font-bold tracking-tight">
          <span aria-hidden>{icon}</span> {title}
        </h3>
        <CopyButton text={body} label={title} />
      </div>
      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-700 sm:text-[15px] dark:text-zinc-300">
        {body}
      </p>
      {footer && <div className="mt-3 flex flex-wrap gap-2">{footer}</div>}
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
    <div className="animate-fade-up flex w-full flex-col gap-3" aria-live="polite">
      <div className="flex flex-col gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 p-4 text-white shadow-lg shadow-emerald-600/20 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <h2 className="text-lg font-bold tracking-tight">
            🎉 Your sales kit is ready
          </h2>
          <p className="text-sm text-emerald-50">
            Copy, share, post — go make the sale.
          </p>
        </div>
        <CopyButton text={all} label="all content" />
      </div>

      <ResultCard icon="📝" title="Product description" body={output.description} />
      <ResultCard
        icon="💬"
        title="WhatsApp message"
        body={output.whatsappMessage}
        footer={
          <>
            <WhatsAppShare text={output.whatsappMessage} />
            <span className="inline-flex min-h-[36px] items-center rounded-full bg-zinc-100 px-3 text-xs tabular-nums text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              {output.whatsappMessage.length} chars
            </span>
          </>
        }
      />
      <section className="rounded-2xl border border-zinc-200 bg-white p-4 text-left shadow-sm sm:p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="flex items-center gap-1.5 text-sm font-bold tracking-tight">
            <span aria-hidden>📣</span> Social captions
          </h3>
          <CopyButton text={output.captions.join("\n\n")} label="captions" />
        </div>
        <ol className="flex flex-col gap-4 sm:gap-3">
          {output.captions.map((caption, i) => (
            <li
              key={i}
              className="flex flex-col gap-2 rounded-xl bg-zinc-50 p-3 sm:flex-row sm:items-start sm:justify-between dark:bg-zinc-900/60"
            >
              <p className="min-w-0 flex-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                <span className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  {i + 1}
                </span>
                {caption}
              </p>
              <CopyButton text={caption} label={`caption ${i + 1}`} />
            </li>
          ))}
        </ol>
      </section>
      <ResultCard icon="📢" title="Call to action" body={output.callToAction} />
    </div>
  );
}

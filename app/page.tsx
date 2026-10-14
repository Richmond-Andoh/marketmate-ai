import ProductForm from "@/components/ui/ProductForm";

const STEPS = [
  {
    n: "1",
    title: "Describe it once",
    body: "Name, details, price, who it's for.",
  },
  {
    n: "2",
    title: "Pick a tone",
    body: "Friendly, luxury, urgent — your call.",
  },
  {
    n: "3",
    title: "Copy, send, sell",
    body: "Listing, WhatsApp text, captions, CTA.",
  },
];

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center bg-zinc-50 px-4 pb-16 dark:bg-black">
      {/* Hero */}
      <div className="relative flex w-full max-w-3xl flex-col items-center gap-4 overflow-hidden pt-10 text-center sm:pt-16">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[42rem] max-w-none -translate-x-1/2 rounded-full bg-gradient-to-r from-emerald-200/60 via-teal-100/50 to-amber-100/60 blur-3xl dark:from-emerald-900/40 dark:via-teal-900/30 dark:to-amber-900/20"
        />
        <p className="animate-fade-up relative rounded-full border border-zinc-200 bg-white/80 px-3 py-1 text-xs font-medium text-zinc-600 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-zinc-300">
          ✨ Free sales copy for small sellers
        </p>
        <h1 className="animate-fade-up-1 relative max-w-xl text-balance text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
          Sell it like you mean it,{" "}
          <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent dark:from-emerald-400 dark:via-teal-300 dark:to-emerald-400">
            in seconds
          </span>
        </h1>
        <p className="animate-fade-up-2 relative max-w-md text-balance text-sm leading-relaxed text-zinc-600 sm:text-base dark:text-zinc-400">
          Describe your product once — get a shop listing, a ready-to-send
          WhatsApp message, three social captions and a call to action.
        </p>
      </div>

      {/* How it works */}
      <ol className="animate-fade-up-2 mt-8 grid w-full max-w-3xl gap-2 sm:grid-cols-3 sm:gap-3">
        {STEPS.map((s) => (
          <li
            key={s.n}
            className="flex items-start gap-3 rounded-xl border border-zinc-200/80 bg-white/70 p-3 text-left backdrop-blur dark:border-zinc-800/80 dark:bg-zinc-950/70"
          >
            <span
              aria-hidden
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white"
            >
              {s.n}
            </span>
            <span>
              <span className="block text-sm font-semibold">{s.title}</span>
              <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                {s.body}
              </span>
            </span>
          </li>
        ))}
      </ol>

      {/* Form */}
      <div className="mt-8 flex w-full max-w-2xl flex-col">
        <ProductForm />
      </div>
    </main>
  );
}

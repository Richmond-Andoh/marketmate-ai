import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MarketMate AI",
  description:
    "AI-powered sales content assistant for small businesses and online sellers.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="sticky top-0 z-10 border-b border-zinc-200/70 bg-white/80 backdrop-blur dark:border-zinc-800/70 dark:bg-zinc-950/80">
          <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4 sm:px-6">
            <Link href="/" className="flex items-center gap-2">
              <span
                aria-hidden
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-bold text-white"
              >
                M
              </span>
              <span className="text-sm font-semibold tracking-tight">
                MarketMate AI
              </span>
            </Link>
            <span className="hidden rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 sm:inline dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
              Powered by open-weight AI
            </span>
          </div>
        </header>
        {children}
        <footer className="border-t border-zinc-200/70 dark:border-zinc-800/70">
          <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-1 px-4 py-6 text-center sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              MarketMate AI writes listings, WhatsApp messages and captions for
              small sellers.
            </p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
              Runs on swappable open-weight models — no lock-in, seller data
              stays with your provider.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}

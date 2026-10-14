import ProductForm from "@/components/ui/ProductForm";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center gap-6 px-4 py-8 sm:px-6 sm:py-16">
      <div className="flex w-full max-w-2xl flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">MarketMate AI</h1>
        <p className="max-w-md text-balance text-zinc-600 dark:text-zinc-400">
          AI-powered sales content for small businesses and online sellers.
          Describe your product once — get a listing, a WhatsApp message,
          captions and a call to action.
        </p>
      </div>
      <ProductForm />
    </main>
  );
}

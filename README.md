# MarketMate AI

AI-powered sales-content assistant for small businesses and online sellers.
Enter product details and receive a product description, a WhatsApp sales
message, three social media captions, and a call to action.

Powered by an open-weight model (`openai/gpt-oss-20b`, Apache-2.0 weights)
accessed through a hosted inference service. No secrets are shipped to the
browser; all model calls happen in server-side route handlers.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS v4
- Zod (input/output validation)
- Vitest (tests)
- Render (deployment, see `render.yaml`)

## Getting started

```bash
cp .env.example .env.local   # fill in your API key locally; never commit it
npm install
npm run dev                  # http://localhost:3000
```

## Scripts

| Command             | Purpose                      |
| ------------------- | ---------------------------- |
| `npm run dev`       | Start the dev server         |
| `npm run build`     | Production build             |
| `npm run start`     | Serve the production build   |
| `npm run lint`      | ESLint                       |
| `npm run typecheck` | TypeScript without emitting  |
| `npm test`          | Run the Vitest suite once    |

## Project layout

```
app/              Pages, layout, and API route handlers
  api/health/     Health check used by Render
  api/generate/   Generation endpoint (Step 4)
components/       UI components (Step 5)
lib/              Schemas, prompt builder, AI provider adapters (Steps 2-3)
tests/            Vitest suites
```

## Environment variables

See `.env.example` for the full list with descriptions.

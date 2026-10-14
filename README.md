# MarketMate AI

AI-powered sales-content assistant for small businesses and online sellers.
Describe a product once — get a shop listing, a ready-to-send WhatsApp
message (with one-tap **Send via WhatsApp** share), three social media
captions, and a call to action. Or **snap a product photo** and let the
vision model pre-fill the form for review — ideal for sellers at the
market stall.

> 🌐 **Live demo:** `https://marketmate-ai.onrender.com`
> _(Replace with your Render URL if it differs.)_

Powered by an open-weight model (`openai/gpt-oss-20b`, Apache-2.0 weights)
through a swappable provider layer: Backboard by default, or any
OpenAI-compatible endpoint (Groq, Together, OpenRouter, self-hosted
vLLM/Ollama for fully local inference). No secrets are shipped to the
browser; all model calls happen in server-side route handlers.

## Why open weights?

* **Cost that works for sellers:** 20B-class open models cost cents per
  hundred generations — a margin a small seller tool can survive on.
* **No lock-in:** the model is one env var (`AI_MODEL`). When Backboard
  credits ran out mid-build, the app moved to Groq with a 4-line env
  change and zero code changes.
* **Data control:** point `AI_BASE_URL` at `http://localhost:11434/v1`
  (Ollama) and seller data never leaves the machine.

## Stack

- Next.js (App Router) + TypeScript + React 19
- Tailwind CSS v4
- Zod (input/output validation, shared client + server)
- Vitest (30 tests: schemas, prompts, AI adapters, route)
- Render (deployment, see `render.yaml`)

## Getting started

```bash
cp .env.example .env.local   # fill in your API key locally; never commit it
npm install
npm run dev                  # http://localhost:3000
```

Tap **Try an example** on the homepage for a one-click demo input.

## Scripts

| Command             | Purpose                     |
| ------------------- | --------------------------- |
| `npm run dev`       | Start the dev server        |
| `npm run build`     | Production build            |
| `npm run start`     | Serve the production build  |
| `npm run lint`      | ESLint                      |
| `npm run typecheck` | TypeScript without emitting |
| `npm test`          | Run the Vitest suite once   |

## Project layout

```
app/                    Pages, layout, API route handlers
  api/health/           Health check used by Render
  api/generate/         Generation endpoint (validate → rate-limit → AI → validate)
  api/describe/         Photo-describe endpoint (image → visible-facts prefill)
  page.tsx              Hero + how-it-works + form
  layout.tsx            Sticky header, footer, mobile viewport
components/ui/
  ProductForm.tsx       Product form: tone pills, example fill, photo prefill,
                        timeout + retry, sticky submit, skeleton loading,
                        auto-scroll to results
  Results.tsx           Sales kit display: copy buttons, WhatsApp deep link,
                        char counts, numbered captions
lib/
  schemas.ts            ProductInput + GenerationOutput Zod schemas
  prompt.ts             System prompt + per-tone guidance + message builder
  ai/config.ts          Server-only provider config (backboard | openai_compatible)
  ai/client.ts          OpenAI-compatible chat client with timeout + typed errors
  ai/parse.ts           Fence-stripping + JSON parse + output validation
  rate-limit.ts         In-memory sliding-window per-IP limiter (10/min default)
tests/                  Vitest suites (schemas, prompt, AI, generate route)
```

## Environment variables

| Variable                | Required when          | Example                            |
| ----------------------- | ---------------------- | ---------------------------------- |
| `AI_PROVIDER`           | always                 | `backboard` or `openai_compatible` |
| `AI_MODEL`              | always                 | `openai/gpt-oss-20b`               |
| `AI_VISION_MODEL`       | photo prefill only     | `qwen/qwen3.8-27b`                 |
| `BACKBOARD_API_KEY`     | `AI_PROVIDER=backboard`| (secret — dashboard / `.env.local`)|
| `AI_BASE_URL`           | `AI_PROVIDER=openai_compatible` | `https://api.groq.com/openai/v1` |
| `AI_API_KEY`            | `AI_PROVIDER=openai_compatible` | (secret — dashboard / `.env.local`)|
| `AI_TIMEOUT_MS`         | optional               | `20000`                            |
| `RATE_LIMIT_PER_MINUTE` | optional               | `10`                               |

See `.env.example` for the template. Never commit `.env.local`.

### Local inference (Ollama, free & offline)

```bash
ollama pull gpt-oss:20b
```

```ini
# .env.local
AI_PROVIDER=openai_compatible
AI_BASE_URL=http://localhost:11434/v1
AI_API_KEY=ollama
AI_MODEL=gpt-oss:20b
```

## Deployment (Render)

1. Push to GitHub — `render.yaml` defines the web service
   (build `npm ci && npm run build`, start `npm run start`,
   health check `/api/health`).
2. Dashboard → **New +** → **Web Service** → connect the repo
   (or deploy as a Blueprint from `render.yaml`).
3. **Environment** → set the secret for your provider:
   `AI_API_KEY` (Groq path) or `BACKBOARD_API_KEY` (Backboard path).
   Everything else syncs from `render.yaml`.
4. Verify: `curl https://<your-app>.onrender.com/api/health`
   → `{"status":"ok"}`, then generate once from a phone.

> Free-plan note: Render sleeps idle services, so the first request
> after sleep can be slow enough to trip the 20s AI timeout (HTTP 504).
> Retry once warm — and the form has a **Try again** button for exactly
> this case.

## License & model terms

App code: use per your repository license. Model weights
(`openai/gpt-oss-20b`) are Apache-2.0 plus the gpt-oss usage policy —
commercial use allowed; check the policy and your provider's terms
before charging. License terms differ per checkpoint, so re-verify if
you swap `AI_MODEL`.

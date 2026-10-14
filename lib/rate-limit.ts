/**
 * Minimal sliding-window per-IP rate limiter.
 * In-memory only — fine for a single Render instance / dev; each instance
 * tracks its own window, which errs on the permissive side. For multi-instance
 * deployments, replace with a shared store (e.g. Redis/Upstash).
 */

const hits = new Map<string, number[]>();
const WINDOW_MS = 60_000;
/** Upper bound on tracked IPs; beyond this we sweep expired entries. */
const MAX_TRACKED_IPS = 1000;

function pruneStaleEntries(now: number): void {
  if (hits.size <= MAX_TRACKED_IPS) return;
  const cutoff = now - WINDOW_MS;
  for (const [key, timestamps] of hits) {
    const recent = timestamps.filter((t) => t > cutoff);
    if (recent.length === 0) hits.delete(key);
    else hits.set(key, recent);
  }
}

export function getRateLimit(): number {
  const raw = Number.parseInt(process.env.RATE_LIMIT_PER_MINUTE ?? "10", 10);
  return Number.isFinite(raw) && raw > 0 ? raw : 10;
}

export function checkRateLimit(
  key: string,
  limit: number = getRateLimit(),
  now: number = Date.now(),
): { limited: boolean; retryAfterSec: number } {
  const cutoff = now - WINDOW_MS;
  const recent = (hits.get(key) ?? []).filter((t) => t > cutoff);
  if (recent.length >= limit) {
    const oldest = recent[0] ?? now;
    const retryAfterSec = Math.max(1, Math.ceil((oldest + WINDOW_MS - now) / 1000));
    hits.set(key, recent);
    pruneStaleEntries(now);
    return { limited: true, retryAfterSec };
  }
  recent.push(now);
  hits.set(key, recent);
  pruneStaleEntries(now);
  return { limited: false, retryAfterSec: 0 };
}

/** Extract the client IP for rate limiting (respects Render/proxy headers). */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

/** Test-only: clear all recorded hits. */
export function resetRateLimit(): void {
  hits.clear();
}

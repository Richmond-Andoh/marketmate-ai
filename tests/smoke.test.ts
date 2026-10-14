import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/health/route";

describe("scaffold smoke test", () => {
  it("health route responds with ok", async () => {
    const res = GET();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ status: "ok" });
  });
});

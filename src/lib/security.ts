import "server-only";
import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db";
import { rateLimits } from "@/db/schema";

/** Salted hash of the caller's IP. Only used to rate-limit and to count distinct reporters. */
export async function clientKey(): Promise<string> {
  const h = await headers();
  const ip = h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const salt = process.env.ANALYTICS_SALT ?? process.env.AUTH_SECRET ?? "";
  return createHash("sha256").update(`${salt}|rl|${ip}`).digest("hex").slice(0, 32);
}

/** Returns true while the caller is still under the limit. One atomic upsert, safe under concurrency. */
export async function rateLimit(key: string, limit: number, windowSec: number): Promise<boolean> {
  const fresh = sql`now() + make_interval(secs => ${windowSec})`;
  const [row] = await db
    .insert(rateLimits)
    .values({ key, count: 1, resetAt: fresh })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        count: sql`case when ${rateLimits.resetAt} < now() then 1 else ${rateLimits.count} + 1 end`,
        resetAt: sql`case when ${rateLimits.resetAt} < now() then ${fresh} else ${rateLimits.resetAt} end`,
      },
    })
    .returning({ count: rateLimits.count });
  return row.count <= limit;
}

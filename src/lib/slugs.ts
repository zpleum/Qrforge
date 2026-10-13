import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { qrCodes } from "@/db/schema";

type Hit = { id: string; destination: string; active: boolean };
const TTL_MS = 15_000; // short on purpose: pause / takedown must take effect fast
const MAX = 2000;
const cache = new Map<string, Hit & { exp: number }>();

/** Per-instance micro-cache for the redirect hot path. Worst case an edit or pause lags ~15s. */
export async function lookupSlug(slug: string): Promise<Hit | null> {
  const hit = cache.get(slug);
  if (hit && hit.exp > Date.now()) return hit;
  const [row] = await db
    .select({ id: qrCodes.id, destination: qrCodes.destination, active: qrCodes.active })
    .from(qrCodes)
    .where(eq(qrCodes.slug, slug))
    .limit(1);
  if (!row) return null;
  if (cache.size >= MAX) cache.delete(cache.keys().next().value!);
  cache.set(slug, { ...row, exp: Date.now() + TTL_MS });
  return row;
}

import { timingSafeEqual } from "node:crypto";
import { and, eq, lt, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { qrCodes, rateLimits, reports, scans } from "@/db/schema";
import { isUnsafe } from "@/lib/webrisk";

export const maxDuration = 60;

/**
 * Nightly job (see vercel.json). Vercel sends `Authorization: Bearer $CRON_SECRET`.
 * 1) data minimisation: delete scans older than RETENTION_DAYS
 * 2) housekeeping: expired rate-limit rows, closed reports older than 180 days
 * 3) re-check a random batch of active destinations with Web Risk and auto-pause flagged ones
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const got = Buffer.from(req.headers.get("authorization") ?? "");
  const want = Buffer.from(`Bearer ${secret}`);
  if (!secret || got.length !== want.length || !timingSafeEqual(got, want)) return new Response("Unauthorized", { status: 401 });

  const days = Math.max(30, Number(process.env.RETENTION_DAYS ?? 365));
  await db.delete(scans).where(lt(scans.ts, new Date(Date.now() - days * 864e5)));
  await db.delete(rateLimits).where(lt(rateLimits.resetAt, new Date(Date.now() - 864e5)));
  await db.delete(reports).where(and(ne(reports.status, "open"), lt(reports.createdAt, new Date(Date.now() - 180 * 864e5))));

  let paused = 0;
  if (process.env.WEB_RISK_API_KEY) {
    const batch = await db
      .select({ id: qrCodes.id, destination: qrCodes.destination })
      .from(qrCodes)
      .where(eq(qrCodes.active, true))
      .orderBy(sql`random()`)
      .limit(200);
    for (let i = 0; i < batch.length; i += 10) {
      const chunk = batch.slice(i, i + 10);
      const flags = await Promise.all(chunk.map((q) => isUnsafe(q.destination)));
      for (const [j, bad] of flags.entries()) {
        if (!bad) continue;
        await db.update(qrCodes).set({ active: false, updatedAt: new Date() }).where(eq(qrCodes.id, chunk[j].id));
        paused++;
      }
    }
  }
  return Response.json({ ok: true, retentionDays: days, autoPaused: paused });
}

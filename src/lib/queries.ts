import "server-only";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { qrCodes, scans } from "@/db/schema";

export const TZ = process.env.ANALYTICS_TZ ?? "Asia/Bangkok";

export async function listQrs(userId: string) {
  return db
    .select({
      id: qrCodes.id, name: qrCodes.name, slug: qrCodes.slug, destination: qrCodes.destination,
      design: qrCodes.design, active: qrCodes.active, createdAt: qrCodes.createdAt,
      // Qualify columns: bare "id" inside this subquery resolves to scans.id (bigint), not qr_codes.id (uuid).
      scans: sql<number>`(select count(*)::int from scans where scans.qr_id = qr_codes.id and not scans.is_bot)`,
    })
    .from(qrCodes)
    .where(eq(qrCodes.userId, userId))
    .orderBy(desc(qrCodes.createdAt));
}

/** Ownership check lives here: every dashboard page/route goes through this. */
export async function getOwnedQr(id: string, userId: string) {
  const [qr] = await db.select().from(qrCodes).where(and(eq(qrCodes.id, id), eq(qrCodes.userId, userId))).limit(1);
  return qr ?? null;
}

const dayKey = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);

export async function getStats(qrId: string, days: number) {
  const since = new Date(Date.now() - days * 864e5);
  const inRange = and(eq(scans.qrId, qrId), gte(scans.ts, since));
  const base = and(inRange, eq(scans.isBot, false)); // bots / link-preview crawlers are excluded from every chart
  const count = sql<number>`count(*)::int`;

  const top = (col: AnyPgColumn) =>
    db.select({ label: col, count }).from(scans).where(base).groupBy(col).orderBy(desc(count)).limit(10);

  // "group by 1" on purpose: a parameterised `at time zone $1` would differ between SELECT and GROUP BY.
  const local = sql`${scans.ts} at time zone ${TZ}`;

  const [totals, bots, daily, hours, weekdays, countries, regions, cities, devices, browsers, systems, referrers, languages] =
    await Promise.all([
      db.select({
        total: count,
        unique: sql<number>`count(distinct ${scans.visitorHash})::int`,
        last: sql<string | null>`max(${scans.ts})`,
      }).from(scans).where(base),
      db.select({ n: count }).from(scans).where(and(inRange, eq(scans.isBot, true))),
      db.select({ k: sql<string>`to_char(${local}, 'YYYY-MM-DD')`, total: count, unique: sql<number>`count(distinct ${scans.visitorHash})::int` })
        .from(scans).where(base).groupBy(sql`1`).orderBy(sql`1`),
      db.select({ k: sql<number>`extract(hour from ${local})::int`, total: count }).from(scans).where(base).groupBy(sql`1`),
      db.select({ k: sql<number>`extract(dow from ${local})::int`, total: count }).from(scans).where(base).groupBy(sql`1`),
      top(scans.country), top(scans.region), top(scans.city), top(scans.device),
      top(scans.browser), top(scans.os), top(scans.referrer), top(scans.language),
    ]);

  const dailyMap = new Map(daily.map((r) => [r.k, r]));
  const series = Array.from({ length: days }, (_, i) => {
    const k = dayKey(new Date(Date.now() - (days - 1 - i) * 864e5));
    const r = dailyMap.get(k);
    return { day: k.slice(5), total: r?.total ?? 0, unique: r?.unique ?? 0 };
  });
  const hourMap = new Map(hours.map((r) => [r.k, r.total]));
  const dowMap = new Map(weekdays.map((r) => [r.k, r.total]));
  const dow = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];

  return {
    total: totals[0]?.total ?? 0,
    unique: totals[0]?.unique ?? 0,
    last: totals[0]?.last ? new Date(totals[0].last) : null,
    bots: bots[0]?.n ?? 0,
    series,
    hours: Array.from({ length: 24 }, (_, h) => ({ label: String(h).padStart(2, "0"), total: hourMap.get(h) ?? 0 })),
    weekdays: dow.map((label, i) => ({ label, total: dowMap.get(i) ?? 0 })),
    countries, regions, cities, devices, browsers, systems, referrers, languages,
  };
}

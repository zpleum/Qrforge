import "server-only";
import { and, asc, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { qrCodes, reports, scans, users } from "@/db/schema";

export const TZ = process.env.ANALYTICS_TZ ?? "Asia/Bangkok";

const dayKey = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);

export async function listQrs(
  userId: string,
  opts?: { q?: string; status?: "all" | "active" | "paused"; folder?: string; sort?: "created" | "scans" | "name" },
) {
  const status = opts?.status ?? "all";
  const sort = opts?.sort ?? "created";
  const conds = [eq(qrCodes.userId, userId)];
  if (status === "active") conds.push(eq(qrCodes.active, true));
  if (status === "paused") conds.push(eq(qrCodes.active, false));
  if (opts?.folder) conds.push(eq(qrCodes.folder, opts.folder));
  if (opts?.q?.trim()) {
    const q = `%${opts.q.trim()}%`;
    conds.push(or(ilike(qrCodes.name, q), ilike(qrCodes.slug, q), ilike(qrCodes.destination, q))!);
  }

  const scanCount = sql<number>`(select count(*)::int from scans where scans.qr_id = qr_codes.id and not scans.is_bot)`;

  const order =
    sort === "scans" ? desc(scanCount) :
    sort === "name" ? asc(qrCodes.name) :
    desc(qrCodes.createdAt);

  return db
    .select({
      id: qrCodes.id,
      name: qrCodes.name,
      slug: qrCodes.slug,
      destination: qrCodes.destination,
      design: qrCodes.design,
      active: qrCodes.active,
      tags: qrCodes.tags,
      folder: qrCodes.folder,
      createdAt: qrCodes.createdAt,
      scans: scanCount,
    })
    .from(qrCodes)
    .where(and(...conds))
    .orderBy(order);
}

export async function getOwnedQr(id: string, userId: string) {
  const [qr] = await db.select().from(qrCodes).where(and(eq(qrCodes.id, id), eq(qrCodes.userId, userId))).limit(1);
  return qr ?? null;
}

export async function getStats(qrId: string, days: number, range?: { from: Date; to: Date }) {
  const to = range?.to ?? new Date();
  const from = range?.from ?? new Date(to.getTime() - days * 864e5);
  const spanDays = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / 864e5));
  const prevTo = from;
  const prevFrom = new Date(from.getTime() - spanDays * 864e5);

  const inRange = and(eq(scans.qrId, qrId), gte(scans.ts, from), lte(scans.ts, to));
  const prevRange = and(eq(scans.qrId, qrId), gte(scans.ts, prevFrom), lte(scans.ts, prevTo));
  const base = and(inRange, eq(scans.isBot, false));
  const count = sql<number>`count(*)::int`;
  const top = (col: AnyPgColumn) =>
    db.select({ label: col, count }).from(scans).where(base).groupBy(col).orderBy(desc(count)).limit(10);

  const local = sql`${scans.ts} at time zone ${TZ}`;

  const [
    totals, bots, daily, hours, weekdays, countries, regions, cities, devices, browsers, systems, referrers, languages,
    utmSources, utmMediums, utmCampaigns, prevTotals,
  ] = await Promise.all([
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
    top(scans.utmSource), top(scans.utmMedium), top(scans.utmCampaign),
    db.select({ total: count, unique: sql<number>`count(distinct ${scans.visitorHash})::int` })
      .from(scans).where(and(prevRange, eq(scans.isBot, false))),
  ]);

  const dailyMap = new Map(daily.map((r) => [r.k, r]));
  const series = Array.from({ length: spanDays }, (_, i) => {
    const k = dayKey(new Date(from.getTime() + i * 864e5));
    const r = dailyMap.get(k);
    return { day: k.slice(5), full: k, total: r?.total ?? 0, unique: r?.unique ?? 0 };
  });
  const peak = series.reduce((a, b) => (b.total > a.total ? b : a), series[0] ?? { day: "—", full: "", total: 0, unique: 0 });
  const total = totals[0]?.total ?? 0;
  const prevTotal = prevTotals[0]?.total ?? 0;
  const pct = (cur: number, prev: number) => (prev === 0 ? (cur > 0 ? 100 : 0) : Math.round(((cur - prev) / prev) * 1000) / 10);

  const hourMap = new Map(hours.map((r) => [r.k, r.total]));
  const dowMap = new Map(weekdays.map((r) => [r.k, r.total]));
  const dow = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];

  return {
    total,
    unique: totals[0]?.unique ?? 0,
    last: totals[0]?.last ? new Date(totals[0].last) : null,
    bots: bots[0]?.n ?? 0,
    avgPerDay: Math.round((total / spanDays) * 10) / 10,
    peakDay: peak,
    compare: {
      totalPct: pct(total, prevTotal),
      uniquePct: pct(totals[0]?.unique ?? 0, prevTotals[0]?.unique ?? 0),
      prevTotal,
    },
    series,
    hours: Array.from({ length: 24 }, (_, h) => ({ label: String(h).padStart(2, "0"), total: hourMap.get(h) ?? 0 })),
    weekdays: dow.map((label, i) => ({ label, total: dowMap.get(i) ?? 0 })),
    countries, regions, cities, devices, browsers, systems, referrers, languages,
    utmSources, utmMediums, utmCampaigns,
    spanDays,
  };
}

export async function adminOverview() {
  const since7 = new Date(Date.now() - 7 * 864e5);
  const since30 = new Date(Date.now() - 30 * 864e5);
  const count = sql<number>`count(*)::int`;
  const [[usersN], [qrsN], [scans7], [scans30], [bots30], [openReports], [suspended]] = await Promise.all([
    db.select({ n: count }).from(users),
    db.select({ n: count }).from(qrCodes),
    db.select({ n: count }).from(scans).where(and(gte(scans.ts, since7), eq(scans.isBot, false))),
    db.select({ n: count }).from(scans).where(and(gte(scans.ts, since30), eq(scans.isBot, false))),
    db.select({ n: count }).from(scans).where(and(gte(scans.ts, since30), eq(scans.isBot, true))),
    db.select({ n: count }).from(reports).where(eq(reports.status, "open")),
    db.select({ n: count }).from(users).where(eq(users.status, "suspended")),
  ]);
  const human30 = scans30.n;
  const bot30 = bots30.n;
  return {
    users: usersN.n,
    suspended: suspended.n,
    qrs: qrsN.n,
    scans7: scans7.n,
    scans30: human30,
    botPct30: human30 + bot30 === 0 ? 0 : Math.round((bot30 / (human30 + bot30)) * 1000) / 10,
    openReports: openReports.n,
  };
}

/** Compact pulse for staff on /dashboard — open reports + a few risk counts. */
export async function staffPulse() {
  const count = sql<number>`count(*)::int`;
  const [[openReports], [suspended], [paused]] = await Promise.all([
    db.select({ n: count }).from(reports).where(eq(reports.status, "open")),
    db.select({ n: count }).from(users).where(eq(users.status, "suspended")),
    db.select({ n: count }).from(qrCodes).where(eq(qrCodes.active, false)),
  ]);
  return { openReports: openReports.n, suspended: suspended.n, pausedQrs: paused.n };
}

export async function listOpenReports() {
  return db
    .select({
      slug: reports.slug,
      n: sql<number>`count(*)::int`,
      reasons: sql<string>`string_agg(distinct ${reports.reason}, ',')`,
      details: sql<string | null>`(array_agg(${reports.details}) filter (where ${reports.details} is not null))[1]`,
      destination: qrCodes.destination,
      active: qrCodes.active,
      owner: users.email,
      ownerId: users.id,
      latest: sql<string>`max(${reports.createdAt})`,
    })
    .from(reports)
    .leftJoin(qrCodes, eq(qrCodes.slug, reports.slug))
    .leftJoin(users, eq(users.id, qrCodes.userId))
    .where(eq(reports.status, "open"))
    .groupBy(reports.slug, qrCodes.destination, qrCodes.active, users.email, users.id)
    .orderBy(desc(sql`max(${reports.createdAt})`))
    .limit(20);
}

export async function adminListUsers(q?: string) {
  const qrCount = sql<number>`(select count(*)::int from qr_codes where qr_codes.user_id = users.id)`;
  const cond = q?.trim()
    ? or(ilike(users.email, `%${q.trim()}%`), ilike(users.name, `%${q.trim()}%`))
    : undefined;
  return db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      image: users.image,
      status: users.status,
      role: users.role,
      notes: users.notes,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
      qrs: qrCount,
    })
    .from(users)
    .where(cond)
    .orderBy(desc(users.createdAt))
    .limit(200);
}

export async function adminGetUser(id: string) {
  const [u] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!u) return null;
  const qrs = await db
    .select({
      id: qrCodes.id,
      name: qrCodes.name,
      slug: qrCodes.slug,
      destination: qrCodes.destination,
      active: qrCodes.active,
      createdAt: qrCodes.createdAt,
      scans: sql<number>`(select count(*)::int from scans where scans.qr_id = qr_codes.id and not scans.is_bot)`,
    })
    .from(qrCodes)
    .where(eq(qrCodes.userId, id))
    .orderBy(desc(qrCodes.createdAt));
  return { user: u, qrs };
}

export async function adminListQrs(q?: string) {
  const cond = q?.trim()
    ? or(ilike(qrCodes.name, `%${q.trim()}%`), ilike(qrCodes.slug, `%${q.trim()}%`), ilike(users.email, `%${q.trim()}%`))
    : undefined;
  return db
    .select({
      id: qrCodes.id,
      name: qrCodes.name,
      slug: qrCodes.slug,
      destination: qrCodes.destination,
      active: qrCodes.active,
      createdAt: qrCodes.createdAt,
      ownerEmail: users.email,
      ownerId: users.id,
      scans: sql<number>`(select count(*)::int from scans where scans.qr_id = qr_codes.id and not scans.is_bot)`,
    })
    .from(qrCodes)
    .leftJoin(users, eq(users.id, qrCodes.userId))
    .where(cond)
    .orderBy(desc(qrCodes.createdAt))
    .limit(200);
}

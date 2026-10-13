import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { scans } from "@/db/schema";
import { getOwnedQr } from "@/lib/queries";

// Neutralise spreadsheet formula injection (=, +, -, @) in user-influenced fields such as referrer.
const cell = (v: unknown) => {
  let s = v == null ? "" : v instanceof Date ? v.toISOString() : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return new Response("Not found", { status: 404 });
  const qr = await getOwnedQr(id, session.user.id);
  if (!qr) return new Response("Not found", { status: 404 });

  const rows = await db.select().from(scans).where(eq(scans.qrId, qr.id)).orderBy(desc(scans.ts)).limit(50_000);
  const cols = ["ts", "country", "region", "city", "device", "browser", "os", "referrer", "language", "isBot"] as const;
  const csv = [cols.join(","), ...rows.map((r) => cols.map((c) => cell(r[c])).join(","))].join("\n");

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="scans-${qr.slug}.csv"`,
      "cache-control": "no-store",
    },
  });
}

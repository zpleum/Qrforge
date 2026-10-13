import { desc, eq, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { qrCodes, reports, users } from "@/db/schema";
import { Wordmark } from "@/components/Wordmark";
import { requireAdmin } from "@/lib/admin";
import { resolveReports } from "@/lib/admin-actions";
import { btnGhost, btnPrimary } from "@/lib/ui";

export const metadata = { title: "รายงานที่รอตรวจ" };
const reasonTh: Record<string, string> = { phishing: "ฟิชชิง", malware: "มัลแวร์", illegal: "ผิดกฎหมาย", copyright: "ลิขสิทธิ์", other: "อื่น ๆ" };

export default async function AdminReports() {
  if (!(await requireAdmin())) notFound(); // hide the page's existence from everyone else
  const rows = await db
    .select({
      slug: reports.slug,
      n: sql<number>`count(*)::int`,
      reasons: sql<string>`string_agg(distinct ${reports.reason}, ',')`,
      details: sql<string | null>`(array_agg(${reports.details}) filter (where ${reports.details} is not null))[1]`,
      destination: qrCodes.destination,
      active: qrCodes.active,
      owner: users.email,
    })
    .from(reports)
    .leftJoin(qrCodes, eq(qrCodes.slug, reports.slug))
    .leftJoin(users, eq(users.id, qrCodes.userId))
    .where(eq(reports.status, "open"))
    .groupBy(reports.slug, qrCodes.destination, qrCodes.active, users.email)
    .orderBy(desc(sql`max(${reports.createdAt})`));

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Wordmark href="/dashboard" />
      <h1 className="mt-10 text-3xl font-semibold tracking-tight">รายงานที่รอตรวจ ({rows.length})</h1>
      {rows.length === 0 ? <p className="mt-8 opacity-70">ไม่มีรายงานค้าง</p> : (
        <ul className="mt-8 divide-y divide-ink/15 border-y border-ink/15">
          {rows.map((r) => (
            <li key={r.slug} className="grid gap-3 py-5">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <code className="font-semibold">{r.slug}</code>
                <span className="text-sm">{r.n} รายงาน · {r.reasons.split(",").map((x) => reasonTh[x] ?? x).join(", ")}</span>
                {r.destination && !r.active && <span className="text-xs font-medium text-amber">ถูกหยุดแล้ว</span>}
              </div>
              <p className="break-all text-sm opacity-80">ปลายทาง (อย่าเปิดถ้าไม่แน่ใจ): {r.destination ?? "QR นี้ถูกลบแล้ว"}</p>
              <p className="text-sm opacity-80">เจ้าของ: {r.owner ?? "-"}</p>
              {r.details && <p className="whitespace-pre-wrap text-sm">{r.details}</p>}
              <form action={resolveReports} className="flex gap-2">
                <input type="hidden" name="slug" value={r.slug} />
                <button name="action" value="pause" className={btnPrimary}>ระงับ QR</button>
                <button name="action" value="dismiss" className={btnGhost}>ปิดรายงาน (ไม่มีปัญหา)</button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

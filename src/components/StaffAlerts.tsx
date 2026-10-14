import Link from "next/link";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { resolveReports } from "@/lib/admin-actions";
import type { listOpenReports, staffPulse } from "@/lib/queries";
import { btnGhost, btnPrimary } from "@/lib/ui";

const reasonTh: Record<string, string> = {
  phishing: "ฟิชชิง",
  malware: "มัลแวร์",
  illegal: "ผิดกฎหมาย",
  copyright: "ลิขสิทธิ์",
  other: "อื่น ๆ",
};

type Pulse = Awaited<ReturnType<typeof staffPulse>>;
type ReportRow = Awaited<ReturnType<typeof listOpenReports>>[number];

export function StaffAlerts({ pulse, reports }: { pulse: Pulse; reports: ReportRow[] }) {
  const needsAttention = pulse.openReports > 0 || pulse.suspended > 0;

  return (
    <section className="mb-10 rounded-xl border border-border bg-panel">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3.5 sm:px-5">
        <div>
          <h2 className="text-base font-semibold">การแจ้งเตือน</h2>
          <p className="mt-0.5 text-sm opacity-65">การแจ้งเตือนสำคัญของทีมงาน</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/reports" className={btnGhost}>
            รายงานทั้งหมด
            {pulse.openReports > 0 && (
              <span className="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-md bg-amber/20 px-1.5 text-xs font-semibold text-ink">
                {pulse.openReports}
              </span>
            )}
          </Link>
          <Link href="/admin/users" className={btnGhost}>ผู้ใช้</Link>
          <Link href="/admin" className={btnGhost}>ภาพรวม</Link>
        </div>
      </div>

      <dl className="grid gap-px border-b border-border bg-border sm:grid-cols-3">
        {[
          { label: "รายงานเปิดอยู่", value: pulse.openReports, href: "/admin/reports", hot: pulse.openReports > 0 },
          { label: "บัญชีถูกระงับ", value: pulse.suspended, href: "/admin/users", hot: pulse.suspended > 0 },
          { label: "QR ที่หยุดชั่วคราว", value: pulse.pausedQrs, href: "/admin/qrs", hot: false },
        ].map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className={`bg-panel px-4 py-3.5 transition-colors hover:bg-ink/[0.02] sm:px-5 ${s.hot ? "ring-inset ring-1 ring-amber/40" : ""}`}
          >
            <dt className="text-xs opacity-60">{s.label}</dt>
            <dd className={`mt-1 text-2xl font-semibold tabular-nums ${s.hot ? "text-amber" : ""}`}>{s.value.toLocaleString("th-TH")}</dd>
          </Link>
        ))}
      </dl>

      <div className="px-4 py-4 sm:px-5">
        {!needsAttention && reports.length === 0 ? (
          <p className="text-sm opacity-65">ไม่มีรายงานค้าง</p>
        ) : (
          <>
            {pulse.openReports > 0 && (
              <div className="mb-4">
                <Alert kind="warning" title={`มีรายงานรอตรวจ ${pulse.openReports} รายการ`}>
                  ตรวจสอบปลายทางก่อนเปิดลิงก์ และอย่าเปิดจากเครื่องที่ใช้บัญชีแอดมินถ้าสงสัย
                </Alert>
              </div>
            )}

            {reports.length === 0 ? (
              <p className="text-sm opacity-65">ไม่มีรายละเอียดรายงานในคิว</p>
            ) : (
              <ul className="divide-y divide-border">
                {reports.map((r) => (
                  <li key={r.slug} className="grid gap-2 py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <code className="font-semibold">{r.slug}</code>
                      <span className="text-sm opacity-70">
                        {r.n} รายงาน · {r.reasons.split(",").map((x) => reasonTh[x] ?? x).join(", ")}
                      </span>
                      {r.destination && r.active === false && <Badge tone="warning">ถูกหยุดแล้ว</Badge>}
                      {!r.destination && <Badge tone="danger">QR ถูกลบ</Badge>}
                    </div>
                    <p className="break-all text-sm opacity-80">ปลายทาง: {r.destination ?? "—"}</p>
                    <p className="text-sm opacity-70">
                      เจ้าของ:{" "}
                      {r.ownerId ? (
                        <Link href={`/admin/users/${r.ownerId}`} className="underline-offset-2 hover:underline">
                          {r.owner}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </p>
                    {r.details && <p className="whitespace-pre-wrap text-sm opacity-85">{r.details}</p>}
                    <form action={resolveReports} className="flex flex-wrap gap-2 pt-1">
                      <input type="hidden" name="slug" value={r.slug} />
                      <button name="action" value="pause" className={btnPrimary}>
                        ระงับ QR
                      </button>
                      <button name="action" value="dismiss" className={btnGhost}>
                        ปิดรายงาน
                      </button>
                      <Link href={`/report?slug=${encodeURIComponent(r.slug)}`} className={`${btnGhost} opacity-70`}>
                        ดูฟอร์มรายงาน
                      </Link>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </section>
  );
}

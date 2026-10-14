import Link from "next/link";
import { adminOverview } from "@/lib/queries";
import { btnGhost } from "@/lib/ui";

export const metadata = { title: "Admin" };

export default async function AdminHome() {
  const o = await adminOverview();
  const cards = [
    ["ผู้ใช้ทั้งหมด", o.users.toLocaleString("th-TH")],
    ["บัญชีถูกระงับ", o.suspended.toLocaleString("th-TH")],
    ["QR ทั้งหมด", o.qrs.toLocaleString("th-TH")],
    ["สแกน 7 วัน", o.scans7.toLocaleString("th-TH")],
    ["สแกน 30 วัน", o.scans30.toLocaleString("th-TH")],
    ["สัดส่วนบอท 30 วัน", `${o.botPct30}%`],
    ["รายงานเปิดอยู่", o.openReports.toLocaleString("th-TH")],
  ] as const;

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">ภาพรวมระบบ</h1>
      <p className="mt-2 text-sm opacity-70">สถิติรวม ไม่รวม IP หรือ User-Agent ดิบ</p>
      <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(([k, v]) => (
          <div key={k} className="rounded-md border border-border bg-panel p-4">
            <dt className="text-sm opacity-70">{k}</dt>
            <dd className="mt-1 text-2xl font-semibold">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-8 flex flex-wrap gap-2">
        <Link href="/admin/users" className={btnGhost}>จัดการผู้ใช้</Link>
        <Link href="/admin/reports" className={btnGhost}>ดูรายงาน ({o.openReports})</Link>
      </div>
    </>
  );
}

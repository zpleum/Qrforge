import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { adminToggleQr } from "@/lib/admin-actions";
import { adminListQrs } from "@/lib/queries";
import { btnGhost, inputCls } from "@/lib/ui";

export const metadata = { title: "QR ทั้งหมด · Admin" };

export default async function AdminQrs({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const rows = await adminListQrs(q);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">QR ทั้งหมด</h1>
        <form className="flex gap-2">
          <input name="q" defaultValue={q} placeholder="ค้นหาชื่อ / slug / อีเมล" className={`${inputCls} w-72`} />
          <button className="rounded-md border border-border bg-panel px-3 text-sm">ค้นหา</button>
        </form>
      </div>

      {rows.length === 0 ? (
        <div className="mt-10"><EmptyState title="ไม่พบ QR" /></div>
      ) : (
        <ul className="mt-8 divide-y divide-border border-y border-border">
          {rows.map((q) => (
            <li key={q.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div className="min-w-0">
                <p className="font-medium">
                  {q.name}{" "}
                  {!q.active && <Badge tone="warning">หยุด</Badge>}
                </p>
                <p className="truncate text-sm opacity-70">
                  <code>{q.slug}</code> · {q.ownerEmail ?? "—"} · {q.scans.toLocaleString("th-TH")} สแกน
                </p>
                <p className="truncate text-xs opacity-60">{q.destination}</p>
              </div>
              <div className="flex gap-2">
                {q.ownerId && (
                  <Link href={`/admin/users/${q.ownerId}`} className={btnGhost}>เจ้าของ</Link>
                )}
                <form action={adminToggleQr.bind(null, q.id)}>
                  <button className={btnGhost}>{q.active ? "ระงับ" : "เปิด"}</button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { adminListUsers } from "@/lib/queries";
import { inputCls } from "@/lib/ui";

export const metadata = { title: "ผู้ใช้ · Admin" };

export default async function AdminUsers({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const rows = await adminListUsers(q);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">ผู้ใช้</h1>
        <form className="flex gap-2">
          <input name="q" defaultValue={q} placeholder="ค้นหาอีเมลหรือชื่อ" className={`${inputCls} w-64`} />
          <button className="rounded-md border border-border bg-panel px-3 text-sm">ค้นหา</button>
        </form>
      </div>

      {rows.length === 0 ? (
        <div className="mt-10"><EmptyState title="ไม่พบผู้ใช้" /></div>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b border-border text-xs opacity-70">
              <tr>
                <th className="py-2 pr-3 font-medium">ผู้ใช้</th>
                <th className="py-2 pr-3 font-medium">สถานะ</th>
                <th className="py-2 pr-3 font-medium">บทบาท</th>
                <th className="py-2 pr-3 font-medium">QR</th>
                <th className="py-2 font-medium">เข้าสู่ระบบล่าสุด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((u) => (
                <tr key={u.id} className="hover:bg-panel/80">
                  <td className="py-3 pr-3">
                    <Link href={`/admin/users/${u.id}`} className="font-medium underline-offset-4 hover:underline">
                      {u.email}
                    </Link>
                    {u.name && <p className="text-xs opacity-60">{u.name}</p>}
                  </td>
                  <td className="py-3 pr-3">
                    <Badge tone={u.status === "suspended" ? "danger" : "success"}>
                      {u.status === "suspended" ? "ระงับ" : "ใช้งาน"}
                    </Badge>
                  </td>
                  <td className="py-3 pr-3"><Badge tone={u.role === "admin" ? "signal" : "neutral"}>{u.role}</Badge></td>
                  <td className="py-3 pr-3 tabular-nums">{u.qrs}</td>
                  <td className="py-3 text-xs opacity-70">
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString("th-TH") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

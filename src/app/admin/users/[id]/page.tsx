import Link from "next/link";
import { notFound } from "next/navigation";
import { UserAdminControls } from "@/components/admin/UserAdminControls";
import { Badge } from "@/components/ui/Badge";
import { requireAdmin } from "@/lib/admin";
import { adminToggleQr } from "@/lib/admin-actions";
import { adminGetUser } from "@/lib/queries";
import { btnGhost } from "@/lib/ui";

export const metadata = { title: "รายละเอียดผู้ใช้ · Admin" };

export default async function AdminUserDetail({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) notFound();
  const { id } = await params;
  const data = await adminGetUser(id);
  if (!data) notFound();
  const { user, qrs } = data;

  return (
    <>
      <Link href="/admin/users" className="text-sm underline-offset-4 hover:underline">← ผู้ใช้ทั้งหมด</Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">{user.email}</h1>
      <p className="mt-1 opacity-70">{user.name ?? "—"}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge tone={user.status === "suspended" ? "danger" : "success"}>
          {user.status === "suspended" ? "ระงับ" : "ใช้งาน"}
        </Badge>
        <Badge tone={user.role === "admin" ? "signal" : "neutral"}>{user.role}</Badge>
      </div>

      <UserAdminControls
        userId={user.id}
        status={user.status}
        role={user.role}
        notes={user.notes}
        isSelf={session.user?.id === user.id}
      />

      <h2 className="mt-12 text-xl font-semibold">QR ของผู้ใช้ ({qrs.length})</h2>
      <ul className="mt-4 divide-y divide-border border-y border-border">
        {qrs.map((q) => (
          <li key={q.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="font-medium">{q.name} {!q.active && <Badge tone="warning">หยุด</Badge>}</p>
              <p className="truncate text-sm opacity-70"><code>{q.slug}</code> · {q.scans.toLocaleString("th-TH")} สแกน</p>
            </div>
            <form action={adminToggleQr.bind(null, q.id)}>
              <button className={btnGhost}>{q.active ? "ระงับ QR" : "เปิด QR"}</button>
            </form>
          </li>
        ))}
        {qrs.length === 0 && <li className="py-6 text-sm opacity-60">ยังไม่มี QR</li>}
      </ul>
    </>
  );
}

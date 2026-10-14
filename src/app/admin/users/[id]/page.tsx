import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminQrRow } from "@/components/admin/AdminQrRow";
import { UserAdminControls } from "@/components/admin/UserAdminControls";
import { Badge } from "@/components/ui/Badge";
import { isAdminEmail, requireAdmin } from "@/lib/admin";
import { adminGetUser } from "@/lib/queries";

export const metadata = { title: "รายละเอียดผู้ใช้ · Admin" };

export default async function AdminUserDetail({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) notFound();
  const { id } = await params;
  const data = await adminGetUser(id);
  if (!data) notFound();
  const { user, qrs } = data;
  const staff = isAdminEmail(user.email);

  return (
    <div className="animate-page">
      <Link href="/admin/users" className="text-sm underline-offset-4 hover:underline">← ผู้ใช้ทั้งหมด</Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">{user.email}</h1>
      <p className="mt-1 opacity-70">{user.name ?? "—"}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge tone={user.status === "suspended" ? "danger" : "success"}>
          {user.status === "suspended" ? "ระงับ" : "ใช้งาน"}
        </Badge>
        {staff && <Badge tone="signal">ทีมงาน</Badge>}
      </div>
      <p className="mt-2 text-xs opacity-55">
        สมัคร {user.createdAt ? new Date(user.createdAt).toLocaleString("th-TH") : "—"}
        {" · "}เข้าสู่ระบบล่าสุด {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString("th-TH") : "—"}
      </p>

      <UserAdminControls
        userId={user.id}
        status={user.status}
        name={user.name}
        notes={user.notes}
        isSelf={session.user?.id === user.id}
        isStaff={staff}
        qrCount={qrs.length}
      />

      <h2 className="mt-12 text-xl font-semibold">QR ของผู้ใช้ ({qrs.length})</h2>
      <ul className="mt-4 divide-y divide-border border-y border-border">
        {qrs.map((q) => (
          <AdminQrRow
            key={q.id}
            id={q.id}
            name={q.name}
            slug={q.slug}
            destination={q.destination}
            active={q.active}
            scans={Number(q.scans)}
          />
        ))}
        {qrs.length === 0 && <li className="py-6 text-sm opacity-60">ยังไม่มี QR</li>}
      </ul>
    </div>
  );
}

import { AdminUsersTable } from "@/components/admin/AdminUsersTable";
import { isAdminEmail } from "@/lib/admin";
import { adminListUsers } from "@/lib/queries";

export const metadata = { title: "ผู้ใช้ · Admin" };

export default async function AdminUsers() {
  const rows = await adminListUsers();
  return (
    <div className="animate-page">
      <h1 className="mb-6 text-3xl font-semibold tracking-tight">จัดการผู้ใช้</h1>
      <AdminUsersTable
        rows={rows.map((u) => ({
          id: u.id,
          email: u.email,
          name: u.name,
          status: u.status,
          qrs: Number(u.qrs),
          lastLoginAt: u.lastLoginAt,
          isStaff: isAdminEmail(u.email),
        }))}
      />
    </div>
  );
}

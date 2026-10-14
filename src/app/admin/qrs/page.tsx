import { AdminQrsTable } from "@/components/admin/AdminQrsTable";
import { adminListQrs } from "@/lib/queries";

export const metadata = { title: "QR ทั้งหมด · Admin" };

export default async function AdminQrs() {
  const rows = await adminListQrs();
  return (
    <div className="animate-page">
      <h1 className="mb-6 text-3xl font-semibold tracking-tight">จัดการ QR ทั้งหมด</h1>
      <AdminQrsTable
        rows={rows.map((q) => ({
          id: q.id,
          name: q.name,
          slug: q.slug,
          destination: q.destination,
          active: q.active,
          ownerEmail: q.ownerEmail,
          ownerId: q.ownerId,
          scans: Number(q.scans),
        }))}
      />
    </div>
  );
}

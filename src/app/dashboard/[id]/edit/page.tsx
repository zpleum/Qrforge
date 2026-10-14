import { notFound } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { DeleteForm } from "@/components/DeleteForm";
import { QrDesigner } from "@/components/QrDesigner";
import { deleteQr } from "@/lib/actions";
import { listAvailablePresets } from "@/lib/preset-actions";
import { getOwnedQr } from "@/lib/queries";

export const metadata = { title: "แก้ไข QR code" };

export default async function EditQr({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!z.uuid().safeParse(id).success) notFound();
  const qr = await getOwnedQr(id, session!.user.id);
  if (!qr) notFound();
  const userPresets = await listAvailablePresets();
  return (
    <div className="animate-page">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">แก้ไข {qr.name}</h1>
        <DeleteForm
          action={deleteQr.bind(null, qr.id)}
          redirectTo="/dashboard"
          title="ยืนยันการลบ QR"
          confirmLabel="ลบ QR นี้"
          message={`ลบ "${qr.name}" และข้อมูลการสแกนทั้งหมด? QR ที่พิมพ์ไปแล้วจะใช้ไม่ได้อีก`}
        />
      </div>
      <QrDesigner
        mode="edit"
        id={qr.id}
        baseUrl={process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}
        userEmail={session!.user.email!}
        userPresets={userPresets}
        initial={{
          name: qr.name,
          destination: qr.destination,
          slug: qr.slug,
          active: qr.active,
          design: qr.design,
          tags: qr.tags ?? [],
          folder: qr.folder,
        }}
      />
    </div>
  );
}

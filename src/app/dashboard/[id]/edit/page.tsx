import { notFound } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { QrDesigner } from "@/components/QrDesigner";
import { getOwnedQr } from "@/lib/queries";

export const metadata = { title: "แก้ไข QR code" };

export default async function EditQr({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!z.uuid().safeParse(id).success) notFound();
  const qr = await getOwnedQr(id, session!.user.id);
  if (!qr) notFound();
  return (
    <>
      <h1 className="mb-8 text-3xl font-semibold tracking-tight">แก้ไข {qr.name}</h1>
      <QrDesigner
        mode="edit"
        id={qr.id}
        baseUrl={process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}
        initial={{ name: qr.name, destination: qr.destination, slug: qr.slug, active: qr.active, design: qr.design }}
      />
    </>
  );
}

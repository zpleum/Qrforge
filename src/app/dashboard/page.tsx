import { auth } from "@/auth";
import { QrList } from "@/components/QrList";
import { listQrs } from "@/lib/queries";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata = { title: "QR ของฉัน" };

export default async function Dashboard() {
  const session = await auth();
  const qrs = await listQrs(session!.user.id);
  return (
    <>
      <h1 className="mb-8 text-3xl font-semibold tracking-tight">QR code ของคุณ</h1>
      <QrList
        baseUrl={BASE}
        rows={qrs.map((q) => ({
          ...q,
          tags: q.tags ?? [],
          scans: Number(q.scans),
        }))}
      />
    </>
  );
}

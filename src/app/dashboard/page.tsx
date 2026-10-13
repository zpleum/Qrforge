import Link from "next/link";
import { auth } from "@/auth";
import { QrThumb } from "@/components/QrViews";
import { listQrs } from "@/lib/queries";
import { btnPrimary } from "@/lib/ui";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata = { title: "QR ของฉัน" };

export default async function Dashboard() {
  const session = await auth();
  const qrs = await listQrs(session!.user.id);
  return (
    <>
      <div className="flex items-end justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">QR code ของคุณ</h1>
        <Link href="/dashboard/new" className={btnPrimary}>สร้าง QR code</Link>
      </div>

      {qrs.length === 0 ? (
        <p className="mt-16 max-w-md text-lg opacity-80">
          ยังไม่มี QR code วางลิงก์ แต่งดีไซน์ แล้วพร้อมพิมพ์ได้ในไม่กี่นาที
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-ink/15 border-y border-ink/15">
          {qrs.map((q) => (
            <li key={q.id}>
              <Link href={`/dashboard/${q.id}`} className="grid grid-cols-[auto_1fr_auto] items-center gap-5 py-4 hover:bg-white/60">
                <QrThumb design={q.design} data={`${BASE}/r/${q.slug}`} />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{q.name}{!q.active && <span className="ml-2 text-xs font-medium text-amber">หยุดชั่วคราว</span>}</p>
                  <p className="truncate text-sm opacity-70">{q.destination}</p>
                </div>
                <p className="text-right"><span className="text-2xl font-semibold">{q.scans.toLocaleString("th-TH")}</span><br /><span className="text-xs opacity-70">ครั้งที่สแกน</span></p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

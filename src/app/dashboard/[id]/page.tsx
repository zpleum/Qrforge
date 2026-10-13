import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { BarsChart, TimeChart } from "@/components/Charts";
import { DeleteForm } from "@/components/DeleteForm";
import { QrDownload } from "@/components/QrViews";
import { deleteQr, toggleQr } from "@/lib/actions";
import { getOwnedQr, getStats, TZ } from "@/lib/queries";
import { btnGhost } from "@/lib/ui";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const RANGES = [7, 30, 90] as const;

const flag = (cc: string) => String.fromCodePoint(...[...cc.toUpperCase()].map((c) => 127397 + c.charCodeAt(0)));
function countryName(cc: string | null) {
  if (!cc || cc.length !== 2) return cc ?? "ไม่ทราบ";
  try { return `${flag(cc)} ${new Intl.DisplayNames(["th"], { type: "region" }).of(cc.toUpperCase()) ?? cc}`; } catch { return cc; }
}

function Breakdown({ title, rows, fmt }: { title: string; rows: { label: string | null; count: number }[]; fmt?: (l: string | null) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <section>
      <h3 className="mb-3 font-semibold">{title}</h3>
      {rows.length === 0 ? <p className="text-sm opacity-60">ยังไม่มีข้อมูล</p> : (
        <ul className="grid gap-2">
          {rows.map((r) => (
            <li key={r.label ?? "∅"} className="text-sm">
              <div className="flex justify-between gap-3"><span className="truncate">{fmt ? fmt(r.label) : (r.label ?? "ไม่ทราบ")}</span><span className="tabular-nums">{r.count}</span></div>
              <div className="mt-1 h-1.5 rounded-full bg-ink/10"><div className="h-full rounded-full bg-signal" style={{ width: `${(r.count / max) * 100}%` }} /></div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default async function QrDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ days?: string }> }) {
  const [{ id }, sp, session] = await Promise.all([params, searchParams, auth()]);
  if (!z.uuid().safeParse(id).success) notFound();
  const qr = await getOwnedQr(id, session!.user.id);
  if (!qr) notFound();

  const days = (RANGES as readonly number[]).includes(Number(sp.days)) ? Number(sp.days) : 30;
  const s = await getStats(qr.id, days);
  const shortUrl = `${BASE}/r/${qr.slug}`;
  const fmtDate = (d: Date) => new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short", timeZone: TZ }).format(d);

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold tracking-tight">{qr.name}{!qr.active && <span className="ml-3 text-sm font-medium text-amber">หยุดชั่วคราว</span>}</h1>
          <p className="mt-2 break-all text-sm opacity-75">{shortUrl} → {qr.destination}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/dashboard/${qr.id}/edit`} className={btnGhost}>แก้ไข</Link>
          <a href={`/dashboard/${qr.id}/export`} className={btnGhost}>ส่งออก CSV</a>
          <form action={toggleQr.bind(null, qr.id)}><button className={btnGhost}>{qr.active ? "หยุดชั่วคราว" : "เปิดใช้งานอีกครั้ง"}</button></form>
          <DeleteForm action={deleteQr.bind(null, qr.id)} redirectTo="/dashboard" message="ลบ QR code นี้และข้อมูลการสแกนทั้งหมด? QR ที่พิมพ์ไปแล้วจะใช้ไม่ได้อีก" />
        </div>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[18rem_1fr]">
        <QrDownload design={qr.design} data={shortUrl} name={qr.slug} />

        <div>
          <nav className="flex gap-2 text-sm" aria-label="ช่วงเวลา">
            {RANGES.map((r) => (
              <Link key={r} href={`?days=${r}`} className={`rounded-md px-3 py-1.5 ${r === days ? "bg-ink text-white" : "border border-ink/20 bg-white"}`}>{r} วันล่าสุด</Link>
            ))}
          </nav>

          <dl className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              ["จำนวนสแกน", s.total.toLocaleString("th-TH")],
              ["ผู้เข้าชมไม่ซ้ำ", s.unique.toLocaleString("th-TH")],
              ["สแกนล่าสุด", s.last ? fmtDate(s.last) : "—"],
              ["บอทที่กรองออก", s.bots.toLocaleString("th-TH")],
            ].map(([k, v]) => (
              <div key={k}><dt className="text-sm opacity-70">{k}</dt><dd className="mt-1 text-2xl font-semibold">{v}</dd></div>
            ))}
          </dl>

          <div className="mt-8"><h2 className="mb-2 font-semibold">สแกนรายวัน</h2><TimeChart data={s.series} /></div>
          <p className="mt-1 text-xs opacity-60">ผู้เข้าชมไม่ซ้ำนับเป็นรายวัน (ใช้ hash ไม่เก็บ IP) ผู้ที่เปิด Do Not Track จะนับเป็นการสแกนเท่านั้น</p>

          <div className="mt-8 grid gap-8 sm:grid-cols-2">
            <div><h3 className="mb-2 font-semibold">ตามชั่วโมง ({TZ})</h3><BarsChart data={s.hours} /></div>
            <div><h3 className="mb-2 font-semibold">ตามวันในสัปดาห์</h3><BarsChart data={s.weekdays} /></div>
          </div>

          <div className="mt-10 grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
            <Breakdown title="ประเทศ" rows={s.countries} fmt={countryName} />
            <Breakdown title="ภูมิภาค/จังหวัด" rows={s.regions} />
            <Breakdown title="เมือง" rows={s.cities} />
            <Breakdown title="อุปกรณ์" rows={s.devices} />
            <Breakdown title="ระบบปฏิบัติการ" rows={s.systems} />
            <Breakdown title="เบราว์เซอร์" rows={s.browsers} />
            <Breakdown title="แหล่งที่มา (Referrer)" rows={s.referrers} fmt={(l) => l ?? "เข้าตรง (สแกนด้วยกล้อง)"} />
            <Breakdown title="ภาษา" rows={s.languages} />
          </div>
        </div>
      </div>
    </>
  );
}

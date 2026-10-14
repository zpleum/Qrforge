import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { BarsChart, TimeChart } from "@/components/Charts";
import { CopyButton } from "@/components/CopyButton";
import { DeleteForm } from "@/components/DeleteForm";
import { QrDownload } from "@/components/QrViews";
import { Badge } from "@/components/ui/Badge";
import { DuplicateButton } from "@/components/DuplicateButton";
import { deleteQr, toggleQr } from "@/lib/actions";
import { getOwnedQr, getStats, TZ } from "@/lib/queries";
import { btnGhost } from "@/lib/ui";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const RANGES = [7, 30, 90, 365] as const;

const flag = (cc: string) => String.fromCodePoint(...[...cc.toUpperCase()].map((c) => 127397 + c.charCodeAt(0)));
function countryName(cc: string | null) {
  if (!cc || cc.length !== 2) return cc ?? "ไม่ทราบ";
  try { return `${flag(cc)} ${new Intl.DisplayNames(["th"], { type: "region" }).of(cc.toUpperCase()) ?? cc}`; } catch { return cc; }
}

function Breakdown({ title, rows, fmt }: { title: string; rows: { label: string | null; count: number }[]; fmt?: (l: string | null) => string }) {
  const filtered = rows.filter((r) => r.label);
  const max = Math.max(1, ...filtered.map((r) => r.count));
  return (
    <section>
      <h3 className="mb-3 font-semibold">{title}</h3>
      {filtered.length === 0 ? <p className="text-sm opacity-60">ยังไม่มีข้อมูล</p> : (
        <ul className="grid gap-2">
          {filtered.map((r) => (
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

function delta(pct: number) {
  if (pct === 0) return "เท่าช่วงก่อน";
  return pct > 0 ? `+${pct}% vs ช่วงก่อน` : `${pct}% vs ช่วงก่อน`;
}

export default async function QrDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ days?: string; from?: string; to?: string }>;
}) {
  const [{ id }, sp, session] = await Promise.all([params, searchParams, auth()]);
  if (!z.uuid().safeParse(id).success) notFound();
  const qr = await getOwnedQr(id, session!.user.id);
  if (!qr) notFound();

  let days = (RANGES as readonly number[]).includes(Number(sp.days)) ? Number(sp.days) : 30;
  let range: { from: Date; to: Date } | undefined;
  if (sp.from && sp.to) {
    const from = new Date(sp.from);
    const to = new Date(sp.to);
    if (!Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime()) && to > from) {
      range = { from, to };
      days = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / 864e5));
    }
  }

  const s = await getStats(qr.id, days, range);
  const shortUrl = `${BASE}/r/${qr.slug}`;
  const fmtDate = (d: Date) => new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short", timeZone: TZ }).format(d);

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold tracking-tight">
            {qr.name}
            {!qr.active && <span className="ml-3 text-sm font-medium text-amber">หยุดชั่วคราว</span>}
          </h1>
          <p className="mt-2 break-all text-sm opacity-75">{shortUrl} → {qr.destination}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {qr.folder && <Badge>{qr.folder}</Badge>}
            {(qr.tags ?? []).map((t) => <Badge key={t} tone="signal">{t}</Badge>)}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <CopyButton text={shortUrl} />
          <Link href={`/dashboard/${qr.id}/edit`} className={btnGhost}>แก้ไข</Link>
          <a href={`/dashboard/${qr.id}/export`} className={btnGhost}>ส่งออก CSV</a>
          <DuplicateButton id={qr.id} />
          <form action={toggleQr.bind(null, qr.id)}><button className={btnGhost}>{qr.active ? "หยุดชั่วคราว" : "เปิดใช้งานอีกครั้ง"}</button></form>
          <DeleteForm action={deleteQr.bind(null, qr.id)} redirectTo="/dashboard" message="ลบ QR code นี้และข้อมูลการสแกนทั้งหมด? QR ที่พิมพ์ไปแล้วจะใช้ไม่ได้อีก" />
        </div>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[18rem_1fr]">
        <QrDownload design={qr.design} data={shortUrl} name={qr.slug} />

        <div>
          <nav className="flex flex-wrap gap-2 text-sm" aria-label="ช่วงเวลา">
            {RANGES.map((r) => (
              <Link key={r} href={`?days=${r}`} className={`rounded-md px-3 py-1.5 ${!sp.from && r === days ? "bg-ink text-panel" : "border border-border bg-panel"}`}>{r} วัน</Link>
            ))}
          </nav>
          <form className="mt-3 flex flex-wrap items-end gap-2 text-sm" method="get">
            <label className="grid gap-1">
              <span className="opacity-70">จาก</span>
              <input type="date" name="from" defaultValue={sp.from} className="rounded-md border border-border bg-panel px-2 py-1.5" />
            </label>
            <label className="grid gap-1">
              <span className="opacity-70">ถึง</span>
              <input type="date" name="to" defaultValue={sp.to} className="rounded-md border border-border bg-panel px-2 py-1.5" />
            </label>
            <button className={btnGhost}>ใช้ช่วงกำหนดเอง</button>
          </form>

          <dl className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
            {[
              ["จำนวนสแกน", s.total.toLocaleString("th-TH"), delta(s.compare.totalPct)],
              ["ผู้เข้าชมไม่ซ้ำ", s.unique.toLocaleString("th-TH"), delta(s.compare.uniquePct)],
              ["เฉลี่ย/วัน", s.avgPerDay.toLocaleString("th-TH"), `${s.spanDays} วัน`],
              ["วันพีค", String(s.peakDay.total), s.peakDay.full || s.peakDay.day],
              ["สแกนล่าสุด", s.last ? fmtDate(s.last) : "—", ""],
              ["บอทที่กรองออก", s.bots.toLocaleString("th-TH"), ""],
            ].map(([k, v, sub]) => (
              <div key={k}>
                <dt className="text-sm opacity-70">{k}</dt>
                <dd className="mt-1 text-xl font-semibold">{v}</dd>
                {sub && <dd className="text-xs opacity-60">{sub}</dd>}
              </div>
            ))}
          </dl>

          <div className="mt-8"><h2 className="mb-2 font-semibold">สแกนรายวัน</h2><TimeChart data={s.series} /></div>
          <p className="mt-1 text-xs opacity-60">ผู้เข้าชมไม่ซ้ำนับเป็นรายวัน (hash ไม่เก็บ IP) · เปรียบเทียบกับช่วงก่อนหน้าความยาวเท่ากัน</p>

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
            <Breakdown title="UTM Source" rows={s.utmSources} />
            <Breakdown title="UTM Medium" rows={s.utmMediums} />
            <Breakdown title="UTM Campaign" rows={s.utmCampaigns} />
          </div>
        </div>
      </div>
    </>
  );
}

"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { QrThumb } from "@/components/QrViews";
import { Badge } from "@/components/ui/Badge";
import { Dropdown } from "@/components/ui/Dropdown";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchInput } from "@/components/ui/SearchInput";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { bulkSetActive, duplicateQr } from "@/lib/actions";
import type { QrDesign } from "@/lib/design";
import { btnGhost, btnPrimary } from "@/lib/ui";

type Row = {
  id: string;
  name: string;
  slug: string;
  destination: string;
  design: QrDesign;
  active: boolean;
  tags: string[] | null;
  folder: string | null;
  scans: number;
};

export function QrList({ rows, baseUrl }: { rows: Row[]; baseUrl: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "paused">("all");
  const [sort, setSort] = useState<"created" | "scans" | "name">("created");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    let list = rows;
    if (status === "active") list = list.filter((r) => r.active);
    if (status === "paused") list = list.filter((r) => !r.active);
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(s) ||
          r.slug.toLowerCase().includes(s) ||
          r.destination.toLowerCase().includes(s) ||
          (r.folder ?? "").toLowerCase().includes(s) ||
          (r.tags ?? []).some((t) => t.toLowerCase().includes(s)),
      );
    }
    if (sort === "scans") list = [...list].sort((a, b) => b.scans - a.scans);
    if (sort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name, "th"));
    return list;
  }, [rows, q, status, sort]);

  const totalScans = rows.reduce((n, r) => n + Number(r.scans), 0);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function bulk(active: boolean) {
    const ids = [...selected];
    if (!ids.length) return toast("เลือก QR ก่อน", "warning");
    start(async () => {
      const res = await bulkSetActive(ids, active);
      if (!res.ok) return toast(res.error ?? "ไม่สำเร็จ", "error");
      toast(active ? "เปิดใช้งานแล้ว" : "หยุดชั่วคราวแล้ว", "success");
      setSelected(new Set());
      router.refresh();
    });
  }

  if (rows.length === 0) {
    return (
      <EmptyState title="ยังไม่มี QR code">
        <Link href="/dashboard/new" className={`${btnPrimary} mt-4 inline-flex`}>สร้าง QR code</Link>
      </EmptyState>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm opacity-70">รวม {rows.length} QR · {totalScans.toLocaleString("th-TH")} สแกน (ไม่นับบอท)</p>
        </div>
        <Link href="/dashboard/new" className={btnPrimary}>สร้าง QR code</Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <SearchInput value={q} onChange={setQ} placeholder="ค้นหาชื่อ / slug / แท็ก…" />
        <Select
          value={status}
          onChange={setStatus}
          options={[
            { value: "all", label: "ทั้งหมด" },
            { value: "active", label: "ใช้งาน" },
            { value: "paused", label: "หยุดชั่วคราว" },
          ]}
        />
        <Select
          value={sort}
          onChange={setSort}
          options={[
            { value: "created", label: "ล่าสุด" },
            { value: "scans", label: "สแกนมากสุด" },
            { value: "name", label: "ชื่อ" },
          ]}
        />
      </div>

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-panel px-3 py-2 text-sm">
          <span>เลือก {selected.size} รายการ</span>
          <button type="button" className={btnGhost} disabled={pending} onClick={() => bulk(true)}>เปิดใช้งาน</button>
          <button type="button" className={btnGhost} disabled={pending} onClick={() => bulk(false)}>หยุดชั่วคราว</button>
          <button type="button" className={btnGhost} onClick={() => setSelected(new Set())}>ยกเลิก</button>
        </div>
      )}

      <ul className="divide-y divide-border border-y border-border">
        {filtered.map((q) => (
          <li key={q.id} className="grid grid-cols-[auto_auto_1fr_auto] items-center gap-4 py-4">
            <input type="checkbox" checked={selected.has(q.id)} onChange={() => toggle(q.id)} aria-label={`เลือก ${q.name}`} />
            <Link href={`/dashboard/${q.id}`}>
              <QrThumb design={q.design} data={`${baseUrl}/r/${q.slug}`} />
            </Link>
            <Link href={`/dashboard/${q.id}`} className="min-w-0 hover:opacity-90">
              <p className="truncate font-semibold">
                {q.name}{" "}
                {!q.active && <Badge tone="warning">หยุดชั่วคราว</Badge>}
              </p>
              <p className="truncate text-sm opacity-70">{q.destination}</p>
              <p className="mt-1 flex flex-wrap gap-1 text-xs opacity-60">
                {q.folder && <Badge>{q.folder}</Badge>}
                {(q.tags ?? []).map((t) => <Badge key={t} tone="signal">{t}</Badge>)}
              </p>
            </Link>
            <div className="flex items-center gap-3">
              <p className="text-right">
                <span className="text-2xl font-semibold">{Number(q.scans).toLocaleString("th-TH")}</span>
                <br />
                <span className="text-xs opacity-70">สแกน</span>
              </p>
              <Dropdown
                label="เมนู"
                items={[
                  { label: "ดูสถิติ", href: `/dashboard/${q.id}` },
                  { label: "แก้ไข", href: `/dashboard/${q.id}/edit` },
                  { label: "ส่งออก CSV", href: `/dashboard/${q.id}/export` },
                  {
                    label: "ทำสำเนา",
                    onClick: () =>
                      start(async () => {
                        const res = await duplicateQr(q.id);
                        if (!res.ok) return toast(res.error, "error");
                        toast("สร้างสำเนาแล้ว", "success");
                        router.push(`/dashboard/${res.id}/edit`);
                        router.refresh();
                      }),
                  },
                ]}
              />
            </div>
          </li>
        ))}
      </ul>
      {filtered.length === 0 && <EmptyState title="ไม่พบรายการที่ตรงเงื่อนไข" />}
    </div>
  );
}

"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { QrThumb } from "@/components/QrViews";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Dropdown } from "@/components/ui/Dropdown";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchInput } from "@/components/ui/SearchInput";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { bulkDeleteQrs, bulkSetActive, deleteQr, duplicateQr } from "@/lib/actions";
import type { QrDesign } from "@/lib/design";
import { btnDanger, btnGhost, btnPrimary } from "@/lib/ui";

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

type PendingDelete = { ids: string[]; label: string };

export function QrList({ rows, baseUrl }: { rows: Row[]; baseUrl: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "paused">("all");
  const [sort, setSort] = useState<"created" | "scans" | "name">("created");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [toDelete, setToDelete] = useState<PendingDelete | null>(null);

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

  function askDeleteOne(row: Row) {
    setToDelete({ ids: [row.id], label: `"${row.name}"` });
  }

  function askDeleteSelected() {
    const ids = [...selected];
    if (!ids.length) return toast("เลือก QR ก่อน", "warning");
    setToDelete({
      ids,
      label: ids.length === 1
        ? `"${rows.find((r) => r.id === ids[0])?.name ?? "QR"}"`
        : `${ids.length} รายการ`,
    });
  }

  function confirmDelete() {
    if (!toDelete) return;
    const { ids } = toDelete;
    start(async () => {
      if (ids.length === 1) {
        await deleteQr(ids[0]!);
      } else {
        const res = await bulkDeleteQrs(ids);
        if (!res.ok) {
          toast(res.error ?? "ลบไม่สำเร็จ", "error");
          return;
        }
      }
      toast(ids.length === 1 ? "ลบ QR แล้ว" : `ลบ ${ids.length} รายการแล้ว`, "success");
      setSelected((prev) => {
        const next = new Set(prev);
        for (const id of ids) next.delete(id);
        return next;
      });
      setToDelete(null);
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

      <div className="grid gap-3 sm:grid-cols-[1fr_10rem_10rem]">
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
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-signal/25 bg-signal/5 px-3 py-2.5 text-sm">
          <span className="font-medium">เลือก {selected.size} รายการ</span>
          <button type="button" className={btnGhost} disabled={pending} onClick={() => bulk(true)}>เปิดใช้งาน</button>
          <button type="button" className={btnGhost} disabled={pending} onClick={() => bulk(false)}>หยุดชั่วคราว</button>
          <button type="button" className={btnDanger} disabled={pending} onClick={askDeleteSelected}>ลบ</button>
          <button type="button" className={btnGhost} onClick={() => setSelected(new Set())}>ยกเลิก</button>
        </div>
      )}

      <ul className="divide-y divide-border overflow-visible rounded-xl border border-border bg-panel">
        {filtered.map((row) => (
          <li key={row.id} className="relative grid grid-cols-[auto_auto_1fr_auto] items-center gap-4 px-4 py-4 transition-colors hover:bg-ink/[0.02]">
            <input type="checkbox" checked={selected.has(row.id)} onChange={() => toggle(row.id)} aria-label={`เลือก ${row.name}`} />
            <Link href={`/dashboard/${row.id}`}>
              <QrThumb design={row.design} data={`${baseUrl}/r/${row.slug}`} />
            </Link>
            <Link href={`/dashboard/${row.id}`} className="min-w-0 hover:opacity-90">
              <p className="truncate font-semibold">
                {row.name}{" "}
                {!row.active && <Badge tone="warning">หยุดชั่วคราว</Badge>}
              </p>
              <p className="truncate text-sm opacity-70">{row.destination}</p>
              <p className="mt-1 flex flex-wrap gap-1 text-xs opacity-60">
                {row.folder && <Badge>{row.folder}</Badge>}
                {(row.tags ?? []).map((t) => <Badge key={t} tone="signal">{t}</Badge>)}
              </p>
            </Link>
            <div className="flex items-center gap-3">
              <p className="text-right">
                <span className="text-2xl font-semibold">{Number(row.scans).toLocaleString("th-TH")}</span>
                <br />
                <span className="text-xs opacity-70">สแกน</span>
              </p>
              <Dropdown
                label="เมนู"
                items={[
                  { label: "ดูสถิติ", href: `/dashboard/${row.id}` },
                  { label: "แก้ไข", href: `/dashboard/${row.id}/edit` },
                  { label: "ส่งออก CSV", href: `/dashboard/${row.id}/export` },
                  {
                    label: "ทำสำเนา",
                    onClick: () =>
                      start(async () => {
                        const res = await duplicateQr(row.id);
                        if (!res.ok) return toast(res.error, "error");
                        toast("สร้างสำเนาแล้ว", "success");
                        router.push(`/dashboard/${res.id}/edit`);
                        router.refresh();
                      }),
                  },
                  {
                    label: "ลบ",
                    danger: true,
                    onClick: () => askDeleteOne(row),
                  },
                ]}
              />
            </div>
          </li>
        ))}
      </ul>
      {filtered.length === 0 && <EmptyState title="ไม่พบรายการที่ตรงเงื่อนไข" />}

      <ConfirmDialog
        open={!!toDelete}
        title="ยืนยันการลบ QR"
        message={`ลบ ${toDelete?.label ?? ""} และข้อมูลการสแกนทั้งหมด? QR ที่พิมพ์ไปแล้วจะใช้ไม่ได้อีก`}
        confirmLabel={toDelete && toDelete.ids.length > 1 ? `ลบ ${toDelete.ids.length} รายการ` : "ลบ QR นี้"}
        danger
        pending={pending}
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

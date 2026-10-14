"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { AdminQrRow } from "@/components/admin/AdminQrRow";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchInput } from "@/components/ui/SearchInput";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { adminBulkSetQrs } from "@/lib/admin-actions";
import { btnGhost } from "@/lib/ui";

type Row = {
  id: string;
  name: string;
  slug: string;
  destination: string;
  active: boolean;
  ownerEmail: string | null;
  ownerId: string | null;
  scans: number;
};

export function AdminQrsTable({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "paused">("all");
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
          (r.ownerEmail ?? "").toLowerCase().includes(s),
      );
    }
    return list;
  }, [rows, q, status]);

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
      const res = await adminBulkSetQrs(ids, active);
      if (!res.ok) return toast(res.error ?? "ไม่สำเร็จ", "error");
      toast(active ? "เปิดแล้ว" : "หยุดแล้ว", "success");
      setSelected(new Set());
      router.refresh();
    });
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_10rem]">
        <SearchInput value={q} onChange={setQ} placeholder="ค้นหาชื่อ / slug / อีเมล…" />
        <Select
          value={status}
          onChange={setStatus}
          options={[
            { value: "all", label: "ทั้งหมด" },
            { value: "active", label: "ใช้งาน" },
            { value: "paused", label: "หยุด" },
          ]}
        />
      </div>

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-signal/25 bg-signal/5 px-3 py-2.5 text-sm">
          <span className="font-medium">เลือก {selected.size}</span>
          <button type="button" className={btnGhost} disabled={pending} onClick={() => bulk(true)}>เปิด</button>
          <button type="button" className={btnGhost} disabled={pending} onClick={() => bulk(false)}>หยุด</button>
          <button type="button" className={btnGhost} onClick={() => setSelected(new Set())}>ยกเลิก</button>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState title="ไม่พบ QR" />
      ) : (
        <ul className="divide-y divide-border overflow-visible rounded-xl border border-border bg-panel">
          {filtered.map((q) => (
            <li key={q.id} className="px-4">
              <div className="flex items-start gap-3 pt-4">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={selected.has(q.id)}
                  onChange={() => toggle(q.id)}
                  aria-label={`เลือก ${q.name}`}
                />
                <div className="min-w-0 flex-1">
                  {q.ownerId && (
                    <p className="mb-1 text-xs opacity-60">
                      เจ้าของ:{" "}
                      <Link href={`/admin/users/${q.ownerId}`} className="underline-offset-2 hover:underline">
                        {q.ownerEmail ?? q.ownerId}
                      </Link>
                    </p>
                  )}
                  <AdminQrRow
                    id={q.id}
                    name={q.name}
                    slug={q.slug}
                    destination={q.destination}
                    active={q.active}
                    scans={q.scans}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

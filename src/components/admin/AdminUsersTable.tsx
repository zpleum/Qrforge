"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchInput } from "@/components/ui/SearchInput";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { bulkSuspendUsers, bulkUnsuspendUsers } from "@/lib/admin-actions";
import { btnGhost } from "@/lib/ui";

type Row = {
  id: string;
  email: string;
  name: string | null;
  status: string;
  qrs: number;
  lastLoginAt: Date | null;
  isStaff: boolean;
};

export function AdminUsersTable({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "suspended">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    let list = rows;
    if (status !== "all") list = list.filter((r) => r.status === status);
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      list = list.filter((r) => r.email.toLowerCase().includes(s) || (r.name ?? "").toLowerCase().includes(s));
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

  function bulk(kind: "suspend" | "unsuspend") {
    const ids = [...selected];
    if (!ids.length) return toast("เลือกผู้ใช้ก่อน", "warning");
    start(async () => {
      const res = kind === "suspend" ? await bulkSuspendUsers(ids) : await bulkUnsuspendUsers(ids);
      if (!res.ok) return toast(res.error ?? "ไม่สำเร็จ", "error");
      toast(kind === "suspend" ? "ระงับแล้ว" : "เปิดบัญชีแล้ว", "success");
      setSelected(new Set());
      router.refresh();
    });
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_10rem]">
        <SearchInput value={q} onChange={setQ} placeholder="ค้นหาอีเมลหรือชื่อ…" />
        <Select
          value={status}
          onChange={setStatus}
          options={[
            { value: "all", label: "ทุกสถานะ" },
            { value: "active", label: "ใช้งาน" },
            { value: "suspended", label: "ระงับ" },
          ]}
        />
      </div>

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-signal/25 bg-signal/5 px-3 py-2.5 text-sm">
          <span className="font-medium">เลือก {selected.size}</span>
          <button type="button" className={btnGhost} disabled={pending} onClick={() => bulk("suspend")}>ระงับ</button>
          <button type="button" className={btnGhost} disabled={pending} onClick={() => bulk("unsuspend")}>เปิดบัญชี</button>
          <button type="button" className={btnGhost} onClick={() => setSelected(new Set())}>ยกเลิก</button>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState title="ไม่พบผู้ใช้" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="border-b border-border bg-ink/[0.02] text-xs opacity-70">
              <tr>
                <th className="px-3 py-2 font-medium" />
                <th className="py-2 pr-3 font-medium">ผู้ใช้</th>
                <th className="py-2 pr-3 font-medium">สถานะ</th>
                <th className="py-2 pr-3 font-medium">QR</th>
                <th className="py-2 font-medium">เข้าสู่ระบบล่าสุด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-ink/[0.02]">
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(u.id)}
                      disabled={u.isStaff}
                      onChange={() => toggle(u.id)}
                      aria-label={`เลือก ${u.email}`}
                    />
                  </td>
                  <td className="py-3 pr-3">
                    <Link href={`/admin/users/${u.id}`} className="font-medium underline-offset-4 hover:underline">
                      {u.email}
                    </Link>
                    <p className="text-xs opacity-60">
                      {u.name ?? "—"}
                      {u.isStaff && <span className="ml-2 text-signal">· ทีมงาน</span>}
                    </p>
                  </td>
                  <td className="py-3 pr-3">
                    <Badge tone={u.status === "suspended" ? "danger" : "success"}>
                      {u.status === "suspended" ? "ระงับ" : "ใช้งาน"}
                    </Badge>
                  </td>
                  <td className="py-3 pr-3 tabular-nums">{u.qrs}</td>
                  <td className="py-3 text-xs opacity-70">
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString("th-TH") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

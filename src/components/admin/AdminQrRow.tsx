"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { adminDeleteQr, adminToggleQr, adminUpdateQr } from "@/lib/admin-actions";
import { btnDanger, btnGhost, inputCls } from "@/lib/ui";

export function AdminQrRow({
  id,
  name,
  slug,
  destination,
  active,
  scans,
}: {
  id: string;
  name: string;
  slug: string;
  destination: string;
  active: boolean;
  scans: number;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState(false);
  const [n, setN] = useState(name);
  const [dest, setDest] = useState(destination);
  const [confirmDel, setConfirmDel] = useState(false);

  return (
    <li className="grid gap-3 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">{name} {!active && <span className="ml-2 text-xs text-amber">หยุด</span>}</p>
          <p className="truncate text-sm opacity-70">
            <code>{slug}</code> · {scans.toLocaleString("th-TH")} สแกน
          </p>
          <p className="truncate text-xs opacity-55">{destination}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={btnGhost}
            disabled={pending}
            onClick={() =>
              start(async () => {
                await adminToggleQr(id);
                toast(active ? "หยุด QR แล้ว" : "เปิด QR แล้ว", "success");
                router.refresh();
              })
            }
          >
            {active ? "หยุด" : "เปิด"}
          </button>
          <button type="button" className={btnGhost} disabled={pending} onClick={() => setEditing((v) => !v)}>
            {editing ? "ปิดแก้ไข" : "แก้ไข"}
          </button>
          <button type="button" className={btnDanger} disabled={pending} onClick={() => setConfirmDel(true)}>
            ลบ
          </button>
        </div>
      </div>

      {editing && (
        <div className="animate-rise grid gap-2 rounded-xl border border-border bg-panel p-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="font-medium">ชื่อ</span>
            <input className={inputCls} value={n} maxLength={80} onChange={(e) => setN(e.target.value)} />
          </label>
          <label className="grid gap-1 text-sm sm:col-span-2">
            <span className="font-medium">ปลายทาง</span>
            <input className={inputCls} value={dest} onChange={(e) => setDest(e.target.value)} />
          </label>
          <button
            type="button"
            className={`${btnGhost} w-fit`}
            disabled={pending}
            onClick={() =>
              start(async () => {
                const res = await adminUpdateQr(id, { name: n, destination: dest });
                if (!res.ok) return toast(res.error, "error");
                toast("บันทึก QR แล้ว", "success");
                setEditing(false);
                router.refresh();
              })
            }
          >
            บันทึก
          </button>
        </div>
      )}

      <ConfirmDialog
        open={confirmDel}
        title="ลบ QR นี้?"
        message="ข้อมูลสแกนของ QR นี้จะถูกลบด้วย กู้คืนไม่ได้"
        confirmLabel="ลบ QR"
        danger
        pending={pending}
        onCancel={() => setConfirmDel(false)}
        onConfirm={() => {
          start(async () => {
            const res = await adminDeleteQr(id);
            setConfirmDel(false);
            if (!res.ok) return toast(res.error ?? "ลบไม่ได้", "error");
            toast("ลบ QR แล้ว", "success");
            router.refresh();
          });
        }}
      />
    </li>
  );
}

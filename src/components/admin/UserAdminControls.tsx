"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import {
  adminSetAllUserQrs,
  deleteUserAsAdmin,
  suspendUser,
  unsuspendUser,
  updateUserAsAdmin,
  updateUserNotes,
} from "@/lib/admin-actions";
import { btnDanger, btnGhost, btnPrimary, inputCls } from "@/lib/ui";

export function UserAdminControls({
  userId,
  status,
  name: initialName,
  notes,
  isSelf,
  isStaff,
  qrCount,
}: {
  userId: string;
  status: string;
  name: string | null;
  notes: string | null;
  isSelf: boolean;
  isStaff: boolean;
  qrCount: number;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const [note, setNote] = useState(notes ?? "");
  const [displayName, setDisplayName] = useState(initialName ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);

  function run(fn: () => Promise<void>, ok: string) {
    start(async () => {
      try {
        await fn();
        toast(ok, "success");
        router.refresh();
      } catch (e) {
        toast(e instanceof Error ? e.message : "ทำรายการไม่สำเร็จ", "error");
      }
    });
  }

  const locked = isSelf || isStaff;

  return (
    <div className="mt-8 grid gap-6">
      <div className="flex flex-wrap gap-2">
        {status === "suspended" ? (
          <button type="button" className={btnPrimary} disabled={pending} onClick={() => run(() => unsuspendUser(userId), "เปิดบัญชีแล้ว")}>
            เปิดบัญชี
          </button>
        ) : (
          <button
            type="button"
            className={btnGhost}
            disabled={pending || locked}
            title={locked ? "ระงับบัญชีทีมงานหรือตัวเองไม่ได้" : undefined}
            onClick={() => run(() => suspendUser(userId), "ระงับบัญชีแล้ว (QR ทั้งหมดถูกหยุดด้วย)")}
          >
            ระงับบัญชี
          </button>
        )}
        <button
          type="button"
          className={btnGhost}
          disabled={pending || qrCount === 0}
          onClick={() => run(() => adminSetAllUserQrs(userId, false), "หยุด QR ทั้งหมดแล้ว")}
        >
          หยุด QR ทั้งหมด
        </button>
        <button
          type="button"
          className={btnGhost}
          disabled={pending || qrCount === 0}
          onClick={() => run(() => adminSetAllUserQrs(userId, true), "เปิด QR ทั้งหมดแล้ว")}
        >
          เปิด QR ทั้งหมด
        </button>
        <button
          type="button"
          className={btnDanger}
          disabled={pending || locked}
          title={locked ? "ลบบัญชีทีมงานหรือตัวเองไม่ได้" : undefined}
          onClick={() => setConfirmDelete(true)}
        >
          ลบบัญชี
        </button>
      </div>

      <label className="grid max-w-xl gap-1.5 text-sm">
        <span className="font-medium">ชื่อที่แสดง</span>
        <input className={inputCls} value={displayName} maxLength={120} onChange={(e) => setDisplayName(e.target.value)} />
        <button
          type="button"
          className={`${btnGhost} w-fit`}
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await updateUserAsAdmin(userId, { name: displayName });
              if (!res.ok) return toast(res.error, "error");
              toast("อัปเดตชื่อแล้ว", "success");
              router.refresh();
            })
          }
        >
          บันทึกชื่อ
        </button>
      </label>

      <label className="grid max-w-xl gap-1.5 text-sm">
        <span className="font-medium">โน้ตภายใน (ไม่แสดงต่อผู้ใช้)</span>
        <textarea className={inputCls} rows={3} value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} />
        <button
          type="button"
          className={`${btnGhost} w-fit`}
          disabled={pending}
          onClick={() => run(() => updateUserNotes(userId, note), "บันทึกโน้ตแล้ว")}
        >
          บันทึกโน้ต
        </button>
      </label>

      <ConfirmDialog
        open={confirmDelete}
        title="ลบบัญชีผู้ใช้นี้?"
        message="จะลบ QR และข้อมูลสแกนทั้งหมดแบบ cascade กู้คืนไม่ได้"
        confirmLabel="ลบบัญชี"
        danger
        pending={pending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          start(async () => {
            try {
              await deleteUserAsAdmin(userId);
              toast("ลบบัญชีแล้ว", "success");
              router.push("/admin/users");
              router.refresh();
            } catch (e) {
              toast(e instanceof Error ? e.message : "ลบไม่สำเร็จ", "error");
            } finally {
              setConfirmDelete(false);
            }
          });
        }}
      />
    </div>
  );
}

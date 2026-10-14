"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import {
  deleteUserAsAdmin, setUserRole, suspendUser, unsuspendUser, updateUserNotes,
} from "@/lib/admin-actions";
import { btnDanger, btnGhost, btnPrimary, inputCls } from "@/lib/ui";

export function UserAdminControls({
  userId,
  status,
  role,
  notes,
  isSelf,
}: {
  userId: string;
  status: string;
  role: string;
  notes: string | null;
  isSelf: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const [note, setNote] = useState(notes ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);

  function run(fn: () => Promise<void>, ok: string) {
    start(async () => {
      try {
        await fn();
        toast(ok, "success");
        router.refresh();
      } catch {
        toast("ทำรายการไม่สำเร็จ", "error");
      }
    });
  }

  return (
    <div className="mt-8 grid gap-6">
      <div className="flex flex-wrap gap-2">
        {status === "suspended" ? (
          <button type="button" className={btnPrimary} disabled={pending} onClick={() => run(() => unsuspendUser(userId), "เปิดบัญชีแล้ว")}>
            เปิดบัญชี
          </button>
        ) : (
          <button type="button" className={btnGhost} disabled={pending || isSelf} onClick={() => run(() => suspendUser(userId), "ระงับบัญชีแล้ว")}>
            ระงับบัญชี
          </button>
        )}
        <button
          type="button"
          className={btnGhost}
          disabled={pending}
          onClick={() => run(() => setUserRole(userId, role === "admin" ? "user" : "admin"), "อัปเดตบทบาทแล้ว")}
        >
          {role === "admin" ? "ลดเป็น user" : "ตั้งเป็น admin"}
        </button>
        <button type="button" className={btnDanger} disabled={pending || isSelf} onClick={() => setConfirmDelete(true)}>
          ลบบัญชี
        </button>
      </div>

      <label className="grid max-w-xl gap-1.5 text-sm">
        <span className="font-medium">โน้ตแอดมิน</span>
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
            } catch {
              toast("ลบไม่สำเร็จ", "error");
            } finally {
              setConfirmDelete(false);
            }
          });
        }}
      />
    </div>
  );
}

"use client";
import { useEffect, useId, useRef } from "react";
import { btnDanger, btnGhost, btnPrimary } from "@/lib/ui";

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "ยืนยัน",
  danger,
  pending,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const titleId = useId();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  if (!open) return null;

  return (
    <dialog
      ref={ref}
      className="fixed inset-0 z-[400] m-auto w-[min(100%-2rem,24rem)] rounded-xl border border-border bg-panel p-0 text-ink shadow-2xl backdrop:bg-ink/45"
      onClose={onCancel}
      aria-labelledby={titleId}
    >
      <div className="p-5">
        <h2 id={titleId} className="text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm opacity-80">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className={btnGhost} onClick={onCancel} disabled={pending}>ยกเลิก</button>
          <button
            type="button"
            className={danger ? btnDanger : btnPrimary}
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? "กำลังดำเนินการ…" : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}

"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { btnDanger } from "@/lib/ui";

export function DeleteForm({
  action,
  label = "ลบ",
  confirmLabel,
  message,
  redirectTo,
  title = "ยืนยันการลบ",
}: {
  action: () => Promise<void>;
  label?: string;
  confirmLabel?: string;
  message: string;
  redirectTo?: string;
  title?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <button type="button" disabled={pending} className={btnDanger} onClick={() => setOpen(true)}>
        {label}
      </button>
      <ConfirmDialog
        open={open}
        title={title}
        message={message}
        confirmLabel={confirmLabel ?? label}
        danger
        pending={pending}
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          startTransition(async () => {
            await action();
            setOpen(false);
            if (redirectTo) {
              router.replace(redirectTo);
              router.refresh();
            } else {
              router.refresh();
            }
          });
        }}
      />
    </>
  );
}

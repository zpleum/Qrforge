"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { btnDanger } from "@/lib/ui";

export function DeleteForm({
  action,
  label = "ลบ",
  message,
  redirectTo,
  title = "ยืนยันการลบ",
}: {
  action: () => Promise<void>;
  label?: string;
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
        confirmLabel={label}
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

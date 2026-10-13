"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { btnGhost } from "@/lib/ui";

export function DeleteForm({
  action,
  label = "ลบ",
  message,
  redirectTo,
}: {
  action: () => Promise<void>;
  label?: string;
  message: string;
  /** Navigate away after success so we don't stay on a page that no longer exists. */
  redirectTo?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className={`${btnGhost} text-red-700 hover:border-red-700 disabled:opacity-50`}
      onClick={() => {
        if (!confirm(message)) return;
        startTransition(async () => {
          await action();
          if (redirectTo) {
            router.replace(redirectTo);
            router.refresh();
          }
        });
      }}
    >
      {pending ? "กำลังลบ…" : label}
    </button>
  );
}

"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useToast } from "@/components/ui/Toast";
import { duplicateQr } from "@/lib/actions";
import { btnGhost } from "@/lib/ui";

export function DuplicateButton({ id }: { id: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      className={btnGhost}
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await duplicateQr(id);
          if (!res.ok) return toast(res.error, "error");
          toast("สร้างสำเนาแล้ว", "success");
          router.push(`/dashboard/${res.id}/edit`);
          router.refresh();
        })
      }
    >
      {pending ? "กำลังทำสำเนา…" : "ทำสำเนา"}
    </button>
  );
}

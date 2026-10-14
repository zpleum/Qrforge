"use client";
import { useToast } from "@/components/ui/Toast";
import { btnGhost } from "@/lib/ui";

export function CopyButton({ text, label = "คัดลอกลิงก์" }: { text: string; label?: string }) {
  const { toast } = useToast();
  return (
    <button
      type="button"
      className={btnGhost}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          toast("คัดลอกแล้ว", "success");
        } catch {
          toast("คัดลอกไม่ได้", "error");
        }
      }}
    >
      {label}
    </button>
  );
}

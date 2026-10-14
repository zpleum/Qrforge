"use client";
import { useTransition } from "react";
import { useToast } from "@/components/ui/Toast";
import { exportMyData } from "@/lib/actions";
import { btnGhost } from "@/lib/ui";

export function ExportDataButton() {
  const { toast } = useToast();
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      className={btnGhost}
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await exportMyData();
          if (!res.ok) return toast(res.error, "error");
          const blob = new Blob([res.json], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `qrforge-export-${new Date().toISOString().slice(0, 10)}.json`;
          a.click();
          URL.revokeObjectURL(url);
          toast("ดาวน์โหลดแล้ว", "success");
        })
      }
    >
      {pending ? "กำลังส่งออก…" : "ส่งออกข้อมูลของฉัน (JSON)"}
    </button>
  );
}

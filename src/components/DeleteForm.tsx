"use client";
import { btnGhost } from "@/lib/ui";

export function DeleteForm({ action, label = "ลบ", message }: { action: () => Promise<void>; label?: string; message: string }) {
  return (
    <form action={action} onSubmit={(e) => { if (!confirm(message)) e.preventDefault(); }}>
      <button className={`${btnGhost} text-red-700 hover:border-red-700`}>{label}</button>
    </form>
  );
}

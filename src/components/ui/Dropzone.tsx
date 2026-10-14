"use client";
import { ImagePlus } from "lucide-react";
import { useState } from "react";

export function Dropzone({
  accept = "image/png,image/jpeg,image/webp",
  hint = "ลากไฟล์มาวาง หรือคลิกเพื่อเลือก",
  onFile,
}: {
  accept?: string;
  hint?: string;
  onFile: (file: File) => void;
}) {
  const [active, setActive] = useState(false);

  function take(files: FileList | null) {
    const f = files?.[0];
    if (f) onFile(f);
  }

  return (
    <label
      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-panel px-4 py-10 text-center text-sm transition-colors ${active ? "drop-active bg-signal/5" : "hover:border-ink/40 hover:bg-ink/[0.02]"}`}
      onDragEnter={(e) => { e.preventDefault(); setActive(true); }}
      onDragOver={(e) => { e.preventDefault(); setActive(true); }}
      onDragLeave={() => setActive(false)}
      onDrop={(e) => {
        e.preventDefault();
        setActive(false);
        take(e.dataTransfer.files);
      }}
    >
      <ImagePlus className="h-6 w-6 opacity-45" />
      <span className="font-medium opacity-90">{hint}</span>
      <span className="text-xs opacity-55">PNG / JPG / WebP · สูงสุด 5 MB</span>
      <input
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => {
          take(e.target.files);
          e.target.value = "";
        }}
      />
    </label>
  );
}

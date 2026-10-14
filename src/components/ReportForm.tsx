"use client";
import { useState } from "react";
import { Select } from "@/components/ui/Select";
import { submitReport } from "@/lib/report-actions";
import { btnPrimary, inputCls } from "@/lib/ui";

const REASONS = [
  { value: "phishing", label: "ฟิชชิง / หลอกลวง" },
  { value: "malware", label: "มัลแวร์" },
  { value: "illegal", label: "เนื้อหาผิดกฎหมาย" },
  { value: "copyright", label: "ละเมิดลิขสิทธิ์" },
  { value: "other", label: "อื่น ๆ" },
] as const;

export function ReportForm({
  defaultSlug,
  error,
}: {
  defaultSlug: string;
  error?: string;
}) {
  const [reason, setReason] = useState<(typeof REASONS)[number]["value"]>("phishing");
  const errors: Record<string, string> = {
    invalid: "ข้อมูลไม่ถูกต้อง ตรวจสอบรหัสลิงก์สั้นอีกครั้ง",
    rate: "ส่งรายงานบ่อยเกินไป ลองใหม่ภายหลัง",
  };

  return (
    <form action={submitReport} className="mt-8 grid gap-4">
      {error && <p role="alert" className="text-sm font-medium text-danger">{errors[error] ?? errors.invalid}</p>}
      <label className="grid gap-1.5 text-sm">
        <span className="font-medium">รหัสลิงก์สั้น (ส่วนท้ายของ …/r/xxxxxxx)</span>
        <input name="slug" required defaultValue={defaultSlug} className={inputCls} placeholder="เช่น k3m9xq2" />
      </label>
      <Select
        label="เหตุผล"
        name="reason"
        value={reason}
        onChange={setReason}
        options={[...REASONS]}
      />
      <label className="grid gap-1.5 text-sm">
        <span className="font-medium">รายละเอียด (ไม่บังคับ)</span>
        <textarea name="details" rows={4} maxLength={1000} className={inputCls} />
      </label>
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      <div>
        <button className={btnPrimary}>ส่งรายงาน</button>
      </div>
    </form>
  );
}

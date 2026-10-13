import type { Metadata } from "next";
import { Wordmark } from "@/components/Wordmark";
import { submitReport } from "@/lib/report-actions";
import { btnPrimary, inputCls } from "@/lib/ui";

export const metadata: Metadata = { title: "รายงานลิงก์" };

const errors: Record<string, string> = {
  invalid: "ข้อมูลไม่ถูกต้อง ตรวจสอบรหัสลิงก์สั้นอีกครั้ง",
  rate: "ส่งรายงานบ่อยเกินไป ลองใหม่ภายหลัง",
};

export default async function Report({ searchParams }: { searchParams: Promise<{ slug?: string; sent?: string; error?: string }> }) {
  const sp = await searchParams;
  const slug = /^[A-Za-z0-9_-]{3,40}$/.test(sp.slug ?? "") ? sp.slug : "";
  return (
    <main className="mx-auto max-w-xl px-6 py-10">
      <Wordmark />
      <h1 className="mt-10 text-3xl font-semibold tracking-tight">รายงานลิงก์ที่ไม่เหมาะสม</h1>
      <p className="mt-2 opacity-80">พบ QR code ที่พาไปเว็บหลอกลวง มัลแวร์ หรือเนื้อหาผิดกฎหมาย? แจ้งเราได้ที่นี่ เราจะตรวจสอบและระงับการใช้งานหากพบว่าผิดจริง</p>

      {sp.sent ? (
        <p role="status" className="mt-8 border-l-4 border-signal pl-3 font-medium">ส่งรายงานแล้ว ขอบคุณที่แจ้ง</p>
      ) : (
        <form action={submitReport} className="mt-8 grid gap-4">
          {sp.error && <p role="alert" className="text-sm font-medium text-red-700">{errors[sp.error] ?? errors.invalid}</p>}
          <label className="grid gap-1.5 text-sm"><span className="font-medium">รหัสลิงก์สั้น (ส่วนท้ายของ …/r/xxxxxxx)</span>
            <input name="slug" required defaultValue={slug} className={inputCls} placeholder="เช่น k3m9xq2" />
          </label>
          <label className="grid gap-1.5 text-sm"><span className="font-medium">เหตุผล</span>
            <select name="reason" className={inputCls} defaultValue="phishing">
              <option value="phishing">ฟิชชิง / หลอกลวง</option>
              <option value="malware">มัลแวร์</option>
              <option value="illegal">เนื้อหาผิดกฎหมาย</option>
              <option value="copyright">ละเมิดลิขสิทธิ์</option>
              <option value="other">อื่น ๆ</option>
            </select>
          </label>
          <label className="grid gap-1.5 text-sm"><span className="font-medium">รายละเอียด (ไม่บังคับ)</span>
            <textarea name="details" rows={4} maxLength={1000} className={inputCls} />
          </label>
          {/* honeypot: hidden from people, bots fill it */}
          <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
          <div><button className={btnPrimary}>ส่งรายงาน</button></div>
        </form>
      )}
    </main>
  );
}

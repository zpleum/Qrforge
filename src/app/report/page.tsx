import type { Metadata } from "next";
import { ReportForm } from "@/components/ReportForm";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = { title: "รายงานลิงก์" };

export default async function Report({ searchParams }: { searchParams: Promise<{ slug?: string; sent?: string; error?: string }> }) {
  const sp = await searchParams;
  const slug = /^[A-Za-z0-9_-]{3,40}$/.test(sp.slug ?? "") ? sp.slug! : "";
  return (
    <main className="animate-page mx-auto max-w-xl px-6 py-10">
      <SiteHeader />
      <h1 className="mt-10 text-3xl font-semibold tracking-tight">รายงานลิงก์ที่ไม่เหมาะสม</h1>
      <p className="mt-2 opacity-80">
        พบ QR code ที่พาไปเว็บหลอกลวง มัลแวร์ หรือเนื้อหาผิดกฎหมาย? แจ้งเราได้ที่นี่ เราจะตรวจสอบและระงับการใช้งานหากพบว่าผิดจริง
      </p>

      {sp.sent ? (
        <p role="status" className="mt-8 rounded-lg border border-signal/30 bg-signal/5 px-4 py-3 font-medium">
          ส่งรายงานแล้ว ขอบคณที่ช่วยให้สังคมของเราดีขึ้น
        </p>
      ) : (
        <ReportForm defaultSlug={slug} error={sp.error} />
      )}
    </main>
  );
}

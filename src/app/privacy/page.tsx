import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export const metadata: Metadata = { title: "ความเป็นส่วนตัว" };

const H = ({ children }: { children: React.ReactNode }) => <h2 className="mt-8 text-xl font-semibold">{children}</h2>;

export default function Privacy() {
  const days = Number(process.env.RETENTION_DAYS ?? 365);
  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <div className="flex items-center justify-between">
        <Wordmark />
        <ThemeToggle />
      </div>
      <h1 className="mt-10 text-3xl font-semibold tracking-tight">นโยบายความเป็นส่วนตัว</h1>
      <p className="mt-2 text-sm opacity-70">
        นี่คือเทมเพลต ก่อนเปิดใช้จริงให้กรอกข้อมูลผู้ควบคุมข้อมูลของคุณ และให้ผู้เชี่ยวชาญด้านกฎหมายตรวจสอบตาม พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล (PDPA) และ GDPR (ถ้ามีผู้ใช้ในสหภาพยุโรป)
      </p>

      <H>เมื่อมีคนสแกน QR code</H>
      <p className="mt-2">
        เราบันทึกเวลา ตำแหน่งโดยประมาณ (ประเทศ ภูมิภาค เมือง จากเครือข่ายของผู้สแกน) ประเภทอุปกรณ์ เบราว์เซอร์ ระบบปฏิบัติการ ภาษา
        เว็บที่ส่งต่อมา (hostname เท่านั้น) และพารามิเตอร์ UTM จาก URL ปลายทาง (utm_source / utm_medium / utm_campaign) ที่ตัดความยาวและ sanitize แล้ว
        โดย<strong>ไม่เก็บ IP address และไม่เก็บ user-agent ดิบ</strong>
      </p>
      <p className="mt-2">
        เพื่อนับผู้เข้าชมไม่ซ้ำ เราเก็บค่า hash ที่ผสม salt และเปลี่ยนทุกวัน จึงไม่สามารถติดตามบุคคลข้ามวันได้
        หากเบราว์เซอร์ส่งสัญญาณ Do Not Track หรือ Global Privacy Control เราจะไม่สร้างค่า hash นั้นเลย
        บอทที่ตรวจพบจะถูกแยกและไม่นับในสถิติ เราไม่ใช้คุกกี้ติดตามผู้สแกน
      </p>
      <p className="mt-2">ข้อมูลการสแกนถูกลบอัตโนมัติเมื่อเกิน {days} วัน</p>

      <H>เมื่อคุณเข้าสู่ระบบ</H>
      <p className="mt-2">
        เราใช้ Google Sign-In และเก็บรหัสบัญชี Google อีเมล ชื่อ และรูปโปรไฟล์ เพื่อแสดง QR code ของคุณเท่านั้น
        บัญชีที่ถูกระงับโดยผู้ดูแลระบบจะเข้าสู่ระบบไม่ได้ เราไม่อ่านข้อมูลอื่นในบัญชี Google ของคุณ
      </p>

      <H>ระบบรายงานและผู้ดูแล</H>
      <p className="mt-2">
        เมื่อมีการรายงาน เราเก็บเหตุผล รายละเอียด และค่า hash ของผู้รายงาน (ไม่ใช่ IP) เพื่อป้องกันการรายงานซ้ำ ๆ
        ผู้ดูแลที่ได้รับอนุญาตสามารถดูอีเมล/ชื่อผู้ใช้ สถิติรวม และระงับบัญชีหรือ QR เพื่อความปลอดภัย — โดยไม่มีหน้าดู IP
      </p>
      <p className="mt-2">
        เราตรวจ URL ปลายทางกับ Google Web Risk เพื่อป้องกันฟิชชิงและมัลแวร์ ซึ่งหมายความว่า URL ปลายทางจะถูกส่งไปยัง Google
      </p>

      <H>ผู้ให้บริการที่เกี่ยวข้อง</H>
      <p className="mt-2">Vercel (โฮสติ้ง), Neon (ฐานข้อมูล), Google (เข้าสู่ระบบและ Web Risk)</p>

      <H>สิทธิของคุณ</H>
      <p className="mt-2">
        คุณลบ QR code (พร้อมข้อมูลการสแกน) ได้ทุกเมื่อ ส่งออกข้อมูลเมตาของบัญชีเป็น JSON ได้ ส่งออกการสแกนเป็น CSV ได้
        และลบบัญชีทั้งหมดได้เองที่หน้า &ldquo;บัญชี&rdquo;
        หากต้องการเข้าถึงหรือแก้ไขข้อมูล หรือมีคำถาม ติดต่อ: <strong>wiraphat.makwong@gmail.com</strong>
      </p>

      <p className="mt-10 text-sm opacity-70">
        <Link href="/" className="underline-offset-4 hover:underline">กลับหน้าแรก</Link>
        {" · "}© 2026 Wiraphat Makwong. Licensed under MIT License.
      </p>
    </main>
  );
}

import Link from "next/link";
import { auth, signIn, signOut } from "@/auth";
import { Wordmark } from "@/components/Wordmark";
import { HeroQr } from "@/components/QrViews";
import { defaultDesign, type QrDesign } from "@/lib/design";
import { btnGhost, btnPrimary } from "@/lib/ui";

const demo: QrDesign = {
  ...defaultDesign,
  size: 520,
  ecLevel: "M",
  dotsType: "dots",
  gradient: { enabled: true, color2: "#3A5BFF", type: "linear", rotation: 45 },
};

export default async function Home() {
  const session = await auth();
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8">
      <header className="flex items-center justify-between">
        <Wordmark />
        <nav className="flex gap-5 text-sm">
          <Link href="/privacy" className="underline-offset-4 hover:underline">ความเป็นส่วนตัว</Link>
          <Link href="/report" className="underline-offset-4 hover:underline">รายงานลิงก์</Link>
        </nav>
      </header>

      <section className="grid flex-1 items-center gap-12 py-16 md:grid-cols-[1.1fr_0.9fr]">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight md:text-6xl md:leading-[1.2]">
            พิมพ์ครั้งเดียว<br />แก้ได้ตลอดชีพ
          </h1>
          <p className="mt-6 max-w-prose text-lg opacity-80">
            ทุก QR code ชี้ไปที่ลิงก์สั้นที่คุณควบคุมเอง เปลี่ยนปลายทางได้ทุกเมื่อ แต่งสีและใส่โลโก้ของคุณได้
            แล้วดูได้ว่าใครสแกนเมื่อไหร่ ที่ไหน ด้วยอุปกรณ์อะไร
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            {session?.user ? (
              <>
                <Link href="/dashboard" className={btnPrimary}>เข้าแดชบอร์ด</Link>
                <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
                  <button className={btnGhost}>ออกจากระบบ</button>
                </form>
              </>
            ) : (
              <form action={async () => { "use server"; await signIn("google", { redirectTo: "/dashboard" }); }}>
                <button className={btnPrimary}>เข้าสู่ระบบด้วย Google</button>
              </form>
            )}
          </div>
          <dl className="mt-14 grid max-w-xl gap-6 text-sm sm:grid-cols-3">
            <div><dt className="font-semibold">แก้ไขได้</dt><dd className="mt-1 opacity-75">พิมพ์ผิดหรือย้ายเว็บ ก็ไม่ต้องพิมพ์ QR ใหม่</dd></div>
            <div><dt className="font-semibold">วัดผลได้</dt><dd className="mt-1 opacity-75">ดูสแกนรายวัน รายชั่วโมง ประเทศ อุปกรณ์ และอื่น ๆ</dd></div>
            <div><dt className="font-semibold">เป็นส่วนตัว</dt><dd className="mt-1 opacity-75">ไม่เก็บ IP address และเคารพ Do Not Track</dd></div>
          </dl>
        </div>
        <HeroQr design={demo} data="https://example.com" />
      </section>
    </main>
  );
}

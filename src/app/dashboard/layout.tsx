import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { Wordmark } from "@/components/Wordmark";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { isAdminEmail } from "@/lib/admin";
import { staffPulse } from "@/lib/queries";
import { btnGhost } from "@/lib/ui";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");
  const staff = isAdminEmail(session.user.email);
  const pulse = staff ? await staffPulse() : null;

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-6">
          <Wordmark />
          <nav className="flex gap-4 text-sm">
            <Link href="/dashboard" className="underline-offset-4 hover:underline">
              QR ของฉัน
              {pulse && pulse.openReports > 0 && (
                <span
                  className="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-md bg-amber/25 px-1.5 text-xs font-semibold tabular-nums"
                  title={`${pulse.openReports} รายงานรอตรวจ`}
                >
                  {pulse.openReports}
                </span>
              )}
            </Link>
            <Link href="/dashboard/account" className="underline-offset-4 hover:underline">บัญชี</Link>
            {staff && (
              <Link href="/admin" className="underline-offset-4 hover:underline">
                ทีมงาน
                {pulse && pulse.openReports > 0 && (
                  <span className="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-md bg-amber/25 px-1.5 text-xs font-semibold tabular-nums">
                    {pulse.openReports}
                  </span>
                )}
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <ThemeToggle />
          {session.user.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={session.user.image} alt="" width={28} height={28} referrerPolicy="no-referrer" className="rounded-full" />
          )}
          <span className="hidden sm:inline">{session.user.email}</span>
          <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
            <button className={btnGhost}>ออกจากระบบ</button>
          </form>
        </div>
      </header>
      <main className="py-8">{children}</main>
    </div>
  );
}

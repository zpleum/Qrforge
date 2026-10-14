import Link from "next/link";
import { notFound } from "next/navigation";
import { Wordmark } from "@/components/Wordmark";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { NavTabs } from "@/components/ui/NavTabs";
import { requireAdmin } from "@/lib/admin";

const NAV = [
  { href: "/admin", label: "ภาพรวม" },
  { href: "/admin/users", label: "ผู้ใช้" },
  { href: "/admin/qrs", label: "QR ทั้งหมด" },
  { href: "/admin/reports", label: "รายงาน" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await requireAdmin())) notFound();
  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-6">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-6">
          <Wordmark />
          <span className="text-sm font-medium text-signal">ทีมงาน</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="text-sm underline-offset-4 hover:underline">กลับแดชบอร์ด</Link>
          <ThemeToggle />
        </div>
      </header>
      <div className="py-6"><NavTabs items={NAV} /></div>
      <main className="pb-10">{children}</main>
    </div>
  );
}

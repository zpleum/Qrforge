import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border py-6 text-sm opacity-75">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6">
        <p>© 2026 Wiraphat Makwong. Licensed under MIT License.</p>
        <nav className="flex gap-4">
          <Link href="/privacy" className="underline-offset-4 hover:underline">ความเป็นส่วนตัว</Link>
          <Link href="/report" className="underline-offset-4 hover:underline">รายงานลิงก์</Link>
        </nav>
      </div>
    </footer>
  );
}

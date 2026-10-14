import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export function SiteHeader() {
  return (
    <header className="flex items-center justify-between">
      <Wordmark />
      <nav className="flex items-center gap-5 text-sm">
        <Link href="/privacy" className="underline-offset-4 hover:underline">
          ความเป็นส่วนตัว
        </Link>
        <Link href="/report" className="underline-offset-4 hover:underline">
          รายงานลิงก์
        </Link>
        <ThemeToggle />
      </nav>
    </header>
  );
}

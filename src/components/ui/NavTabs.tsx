"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavTabs({ items }: { items: { href: string; label: string }[] }) {
  const path = usePathname();
  return (
    <nav className="flex flex-wrap gap-2 text-sm" aria-label="ส่วน">
      {items.map((item) => {
        const active =
          item.href === "/admin"
            ? path === "/admin"
            : path === item.href || path.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-md px-3 py-1.5 transition-colors ${active ? "bg-ink text-panel" : "border border-border bg-panel hover:border-ink/40"}`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

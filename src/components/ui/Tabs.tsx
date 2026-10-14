import Link from "next/link";

export function Tabs({ items, current }: { items: { href: string; label: string }[]; current: string }) {
  return (
    <nav className="flex flex-wrap gap-2 text-sm" aria-label="ส่วน">
      {items.map((item) => {
        const active = current === item.href || current.startsWith(item.href + "/");
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

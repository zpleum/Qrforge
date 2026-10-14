"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { btnGhost } from "@/lib/ui";

export type DropdownItem = {
  label: string;
  onClick?: () => void;
  href?: string;
  danger?: boolean;
  disabled?: boolean;
};

export function Dropdown({ label, items }: { label: string; items: DropdownItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button type="button" className={`${btnGhost} gap-1`} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        {label}
        <ChevronDown className="h-3.5 w-3.5 opacity-70" />
      </button>
      {open && (
        <ul className="absolute right-0 z-40 mt-1 min-w-44 overflow-hidden rounded-md border border-border bg-panel py-1 shadow-lg">
          {items.map((item) => (
            <li key={item.label}>
              {item.href ? (
                <a
                  href={item.href}
                  className={`block px-3 py-2 text-sm hover:bg-ink/5 ${item.danger ? "text-danger" : ""} ${item.disabled ? "pointer-events-none opacity-40" : ""}`}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </a>
              ) : (
                <button
                  type="button"
                  disabled={item.disabled}
                  className={`block w-full px-3 py-2 text-left text-sm hover:bg-ink/5 disabled:opacity-40 ${item.danger ? "text-danger" : ""}`}
                  onClick={() => {
                    setOpen(false);
                    item.onClick?.();
                  }}
                >
                  {item.label}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

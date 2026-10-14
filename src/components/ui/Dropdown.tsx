"use client";
import { ChevronDown } from "lucide-react";
import { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { btnGhost } from "@/lib/ui";
import { useMenu } from "./useMenu";

export type DropdownItem = {
  label: string;
  onClick?: () => void;
  href?: string;
  danger?: boolean;
  disabled?: boolean;
};

export function Dropdown({
  label,
  items,
  align = "right",
}: {
  label: string;
  items: DropdownItem[];
  align?: "left" | "right";
}) {
  const menu = useMenu();
  const [pos, setPos] = useState<{ top: number; left: number; right: number } | null>(null);

  useLayoutEffect(() => {
    if (!menu.open || !menu.ref.current) {
      setPos(null);
      return;
    }
    const place = () => {
      const r = menu.ref.current!.getBoundingClientRect();
      setPos({ top: r.bottom + 6, left: r.left, right: window.innerWidth - r.right });
    };
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [menu.open, menu.ref]);

  const panel =
    menu.open &&
    pos &&
    typeof document !== "undefined" &&
    createPortal(
      <ul
        role="menu"
        ref={(el) => {
          menu.panelRef.current = el;
        }}
        className="animate-rise fixed z-[300] min-w-48 rounded-lg border border-border bg-panel py-1 shadow-[0_12px_40px_-12px_rgba(11,18,32,0.45)]"
        style={
          align === "right"
            ? { top: pos.top, right: pos.right }
            : { top: pos.top, left: pos.left }
        }
      >
        {items.map((item) => (
          <li key={item.label} role="none">
            {item.href ? (
              <a
                role="menuitem"
                href={item.href}
                className={`block px-3.5 py-2.5 text-sm transition-colors hover:bg-ink/[0.04] ${item.danger ? "text-danger" : ""} ${item.disabled ? "pointer-events-none opacity-40" : ""}`}
                onClick={() => menu.close()}
              >
                {item.label}
              </a>
            ) : (
              <button
                type="button"
                role="menuitem"
                disabled={item.disabled}
                className={`block w-full px-3.5 py-2.5 text-left text-sm transition-colors hover:bg-ink/[0.04] disabled:opacity-40 ${item.danger ? "text-danger" : ""}`}
                onClick={() => {
                  menu.close();
                  item.onClick?.();
                }}
              >
                {item.label}
              </button>
            )}
          </li>
        ))}
      </ul>,
      document.body,
    );

  return (
    <div className="relative" ref={menu.ref}>
      <button
        type="button"
        className={`${btnGhost} gap-1.5 ${menu.open ? "border-signal ring-2 ring-signal/20" : ""}`}
        aria-expanded={menu.open}
        aria-haspopup="menu"
        onClick={menu.toggle}
      >
        {label}
        <ChevronDown className={`h-3.5 w-3.5 opacity-60 transition-transform duration-200 ${menu.open ? "rotate-180" : ""}`} />
      </button>
      {panel}
    </div>
  );
}

"use client";
import { Check, ChevronDown } from "lucide-react";
import { useMenu } from "./useMenu";

export type SelectOption<T extends string = string> = {
  value: T;
  label: string;
  hint?: string;
};

export function Select<T extends string>({
  label,
  value,
  options,
  onChange,
  placeholder = "เลือก…",
  name,
  className = "",
}: {
  label?: string;
  value: T | "";
  options: SelectOption<T>[];
  onChange: (v: T) => void;
  placeholder?: string;
  /** Hidden input for native form posts */
  name?: string;
  className?: string;
}) {
  const menu = useMenu();
  const selected = options.find((o) => o.value === value);

  const trigger = (
    <button
      type="button"
      className={`flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-panel px-3 py-2.5 text-left text-sm transition-colors hover:border-ink/35 focus-visible:outline-none ${menu.open ? "border-signal ring-2 ring-signal/25" : ""} ${className}`}
      aria-haspopup="listbox"
      aria-expanded={menu.open}
      aria-controls={menu.listId}
      onClick={menu.toggle}
    >
      <span className={`min-w-0 truncate ${selected ? "" : "opacity-50"}`}>
        {selected ? selected.label : placeholder}
      </span>
      <ChevronDown className={`h-4 w-4 shrink-0 opacity-55 transition-transform duration-200 ${menu.open ? "rotate-180" : ""}`} />
    </button>
  );

  return (
    <div className={`relative grid gap-1.5 text-sm ${menu.open ? "z-[200]" : ""}`} ref={menu.ref}>
      {label && <span className="font-medium">{label}</span>}
      {name && <input type="hidden" name={name} value={value} />}
      {trigger}
      {menu.open && (
        <ul
          id={menu.listId}
          role="listbox"
          className="animate-rise absolute left-0 right-0 top-[calc(100%+4px)] z-[200] max-h-64 overflow-auto rounded-lg border border-border bg-panel py-1 shadow-[0_12px_40px_-12px_rgba(11,18,32,0.35)]"
        >
          {options.map((o) => {
            const active = o.value === value;
            return (
              <li key={o.value} role="option" aria-selected={active}>
                <button
                  type="button"
                  className={`flex w-full items-start gap-2 px-3 py-2.5 text-left transition-colors hover:bg-ink/[0.04] ${active ? "bg-signal/8" : ""}`}
                  onClick={() => {
                    onChange(o.value);
                    menu.close();
                  }}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium leading-snug">{o.label}</span>
                    {o.hint && <span className="mt-0.5 block text-xs opacity-55">{o.hint}</span>}
                  </span>
                  {active && <Check className="mt-0.5 h-4 w-4 shrink-0 text-signal" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

"use client";
import { Search } from "lucide-react";
import { inputCls } from "@/lib/ui";

export function SearchInput({
  value,
  onChange,
  placeholder = "ค้นหา…",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="relative block">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
      <input
        className={`${inputCls} pl-9`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type="search"
        autoComplete="off"
      />
    </label>
  );
}

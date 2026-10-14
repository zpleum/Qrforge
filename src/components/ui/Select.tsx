"use client";
import { inputCls } from "@/lib/ui";

export function Select<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label?: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  const el = (
    <select className={inputCls} value={value} onChange={(e) => onChange(e.target.value as T)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
  if (!label) return el;
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      {el}
    </label>
  );
}

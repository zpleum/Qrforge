"use client";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const axis = { fontSize: 12, fill: "currentColor", opacity: 0.55 };
const tip = {
  borderRadius: 6,
  border: "1px solid var(--border)",
  background: "var(--panel)",
  color: "var(--ink)",
  fontSize: 12,
};

export function TimeChart({ data }: { data: { day: string; total: number; unique: number }[] }) {
  return (
    <div className="h-64 w-full text-ink">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis dataKey="day" tick={axis} tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis allowDecimals={false} tick={axis} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tip} />
          <Area type="monotone" dataKey="total" name="สแกน" stroke="var(--signal)" fill="var(--signal)" fillOpacity={0.15} strokeWidth={2} />
          <Area type="monotone" dataKey="unique" name="ผู้เข้าชมไม่ซ้ำ" stroke="var(--amber)" fill="var(--amber)" fillOpacity={0.15} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BarsChart({ data }: { data: { label: string; total: number }[] }) {
  return (
    <div className="h-44 w-full text-ink">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={false} interval="preserveStartEnd" />
          <YAxis allowDecimals={false} tick={axis} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tip} cursor={{ fill: "color-mix(in oklab, var(--ink) 6%, transparent)" }} />
          <Bar dataKey="total" name="สแกน" fill="var(--signal)" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

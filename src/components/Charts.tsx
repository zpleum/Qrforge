"use client";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const axis = { fontSize: 12, fill: "#0b1220", opacity: 0.6 };
const tip = { borderRadius: 6, border: "1px solid rgba(11,18,32,.2)", fontSize: 12 };

export function TimeChart({ data }: { data: { day: string; total: number; unique: number }[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid stroke="rgba(11,18,32,.08)" vertical={false} />
          <XAxis dataKey="day" tick={axis} tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis allowDecimals={false} tick={axis} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tip} />
          <Area type="monotone" dataKey="total" name="สแกน" stroke="#3a5bff" fill="#3a5bff" fillOpacity={0.15} strokeWidth={2} />
          <Area type="monotone" dataKey="unique" name="ผู้เข้าชมไม่ซ้ำ" stroke="#ffb020" fill="#ffb020" fillOpacity={0.15} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BarsChart({ data }: { data: { label: string; total: number }[] }) {
  return (
    <div className="h-44 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={false} interval="preserveStartEnd" />
          <YAxis allowDecimals={false} tick={axis} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tip} cursor={{ fill: "rgba(11,18,32,.05)" }} />
          <Bar dataKey="total" name="สแกน" fill="#3a5bff" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

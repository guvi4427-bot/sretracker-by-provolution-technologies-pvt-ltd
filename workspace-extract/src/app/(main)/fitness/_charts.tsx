'use client';

import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar,
} from 'recharts';

interface CalorieData {
  date: string;
  consumed: number;
  burned: number;
  balance?: number;
}

interface MacroData {
  name: string;
  value: number;
  color: string;
}

interface WorkoutData {
  date: string;
  calories: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0A0F1E] border border-white/10 rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-white/50 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-white font-medium" style={{ color: p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

export function CalorieChart({ data }: { data: CalorieData[] }) {
  const hasBalance = data.some(d => d.balance !== undefined);
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} />
          <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} />
          <Tooltip content={<CustomTooltip />} />
          <Line type="monotone" dataKey="consumed" name="Consumed" stroke="#F59E0B" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="burned" name="Burned" stroke="#EF4444" strokeWidth={2} dot={false} />
          {hasBalance && <Line type="monotone" dataKey="balance" name="Balance" stroke="#10B981" strokeWidth={2} dot={false} strokeDasharray="5 5" />}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MacroPieChart({ data }: { data: MacroData[] }) {
  return (
    <div className="h-48 flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        {data.map(d => (
          <div key={d.name} className="flex items-center gap-2 text-xs">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="text-white/60">{d.name}</span>
            <span className="text-white font-medium tabular-nums">{d.value}g</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function WorkoutChart({ data }: { data: WorkoutData[] }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} />
          <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="calories" name="Calories Burned" fill="#EF4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WeightChart({ data }: { data: { date: string; weight: number }[] }) {
  if (!data || data.length === 0) return null;

  // Pad to at least 2 points so recharts draws a visible line/dot
  const chartData = data.length === 1
    ? [data[0], { ...data[0] }]
    : data;

  // Compute Y domain with padding so the line is never flush against top/bottom
  const weights = chartData.map(d => d.weight).filter(Boolean);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const padding = Math.max(1, (maxW - minW) * 0.2);
  const yMin = Math.floor(minW - padding);
  const yMax = Math.ceil(maxW + padding);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
            tickLine={false}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[yMin, yMax]}
            tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}kg`}
            width={42}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: 'rgba(59,130,246,0.3)', strokeWidth: 1 }}
          />
          <Line
            type="monotone"
            dataKey="weight"
            name="Weight (kg)"
            stroke="#3B82F6"
            strokeWidth={2.5}
            dot={{ r: 4, fill: '#3B82F6', strokeWidth: 2, stroke: '#1d4ed8' }}
            activeDot={{ r: 6, fill: '#60a5fa', stroke: '#3B82F6', strokeWidth: 2 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

'use client';

import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar,
} from 'recharts';

interface CalorieData {
  date: string;
  consumed: number;
  burned: number;
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
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} />
          <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} />
          <Tooltip content={<CustomTooltip />} />
          <Line type="monotone" dataKey="weight" name="Weight (kg)" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3, fill: '#3B82F6' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

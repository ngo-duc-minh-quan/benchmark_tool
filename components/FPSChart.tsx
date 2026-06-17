"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";

interface FPSDataPoint {
  t: number;
  fps: number;
}

interface Props {
  data: FPSDataPoint[];
  avgFPS?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const fps = payload[0].value;
    const color = fps >= 60 ? "#00E676" : fps >= 30 ? "#FFB800" : "#FF3B3B";
    return (
      <div className="bg-[#0F1420] border border-[#1E2A45] rounded-xl px-3 py-2 text-sm shadow-xl">
        <p className="text-gray-400 mb-1">{label}s</p>
        <p className="font-bold font-mono" style={{ color }}>
          {fps} FPS
        </p>
      </div>
    );
  }
  return null;
};

export default function FPSChart({ data, avgFPS }: Props) {
  const maxFPS = Math.max(...data.map((d) => d.fps), 60);

  return (
    <div className="glass p-5 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
          FPS Timeline
        </h3>
        {avgFPS !== undefined && (
          <span className="text-xs font-mono text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded-full">
            Avg: {avgFPS} FPS
          </span>
        )}
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E2A45" vertical={false} />
          <XAxis
            dataKey="t"
            tick={{ fill: "#6B7A99", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}s`}
          />
          <YAxis
            domain={[0, maxFPS + 10]}
            tick={{ fill: "#6B7A99", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          {/* Reference lines */}
          <ReferenceLine y={60} stroke="#00E676" strokeDasharray="4 4" strokeOpacity={0.5} />
          <ReferenceLine y={30} stroke="#FF3B3B" strokeDasharray="4 4" strokeOpacity={0.5} />
          {avgFPS && (
            <ReferenceLine y={avgFPS} stroke="#00D4FF" strokeDasharray="6 3" strokeOpacity={0.7} />
          )}
          <Line
            type="monotone"
            dataKey="fps"
            stroke="url(#fpsGradient)"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, fill: "#00D4FF", strokeWidth: 0 }}
          />
          <defs>
            <linearGradient id="fpsGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#00D4FF" />
              <stop offset="50%" stopColor="#7C3AED" />
              <stop offset="100%" stopColor="#FF6B35" />
            </linearGradient>
          </defs>
        </LineChart>
      </ResponsiveContainer>

      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-4 h-0.5 bg-emerald-400 inline-block" /> 60 FPS target
        </span>
        <span className="flex items-center gap-1">
          <span className="w-4 h-0.5 bg-red-400 inline-block" /> 30 FPS min
        </span>
        {avgFPS && (
          <span className="flex items-center gap-1">
            <span className="w-4 h-0.5 bg-cyan-400 inline-block" /> Average
          </span>
        )}
      </div>
    </div>
  );
}

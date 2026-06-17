"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  LabelList,
} from "recharts";
import { benchmarkBaselines, type DeviceBaseline } from "@/lib/benchmarkBaselines";

interface YourDevice {
  name: string;
  avgFPS: number;
  score: number;
  tier: "S" | "A" | "B" | "C";
  price?: number;
}

interface Props {
  yourDevice?: YourDevice;
  metric?: "avgFPS" | "score";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload as DeviceBaseline & { isYours?: boolean };
    return (
      <div className="bg-[#0F1420] border border-[#1E2A45] rounded-xl px-4 py-3 text-sm shadow-xl min-w-[180px]">
        <p className="font-semibold text-white mb-2">{label}</p>
        <p className="text-gray-400">
          Avg FPS:{" "}
          <span className="font-mono text-cyan-400">{d.avgFPS}</span>
        </p>
        <p className="text-gray-400">
          Score:{" "}
          <span className="font-mono text-purple-400">{d.score}</span>
        </p>
        <p className="text-gray-400">
          1% Low:{" "}
          <span className="font-mono text-yellow-400">{d.onePercentLow}</span>
        </p>
        {d.price && (
          <p className="text-gray-400">
            Price:{" "}
            <span className="font-mono text-emerald-400">{d.price}M ₫</span>
          </p>
        )}
        {d.price && (
          <p className="text-gray-400 mt-1 text-xs border-t border-white/10 pt-1">
            Value:{" "}
            <span className="font-mono text-orange-400">
              {(d.avgFPS / d.price).toFixed(1)} FPS/M₫
            </span>
          </p>
        )}
        {d.isYours && (
          <span className="inline-block mt-1 text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full">
            Your Device
          </span>
        )}
      </div>
    );
  }
  return null;
};

export default function ComparisonChart({ yourDevice, metric = "avgFPS" }: Props) {
  // Build dataset
  const baseData = benchmarkBaselines.map((b) => ({
    ...b,
    isYours: false,
  }));

  const chartData = yourDevice
    ? [
        {
          id: "yours",
          name: yourDevice.name.length > 14 ? yourDevice.name.slice(0, 14) + "…" : yourDevice.name,
          fullName: yourDevice.name,
          avgFPS: yourDevice.avgFPS,
          onePercentLow: 0,
          score: yourDevice.score,
          tier: yourDevice.tier,
          price: yourDevice.price ?? 0,
          brand: "You",
          chipset: "",
          ram: "",
          color: "#00D4FF",
          isYours: true,
        },
        ...baseData.map((b) => ({ ...b, name: b.name.replace(" Pro Max", " PM").replace(" Ultra", " Ul."), fullName: b.name })),
      ]
    : baseData.map((b) => ({ ...b, name: b.name.replace(" Pro Max", " PM").replace(" Ultra", " Ul."), fullName: b.name, isYours: false }));

  const maxVal = Math.max(...chartData.map((d) => d[metric])) * 1.15;

  return (
    <div className="glass p-5 rounded-2xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
            Device Comparison
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {metric === "avgFPS" ? "Average FPS" : "Performance Score"} · All devices
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="w-3 h-3 rounded-sm bg-cyan-400 inline-block" /> Your Device
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
          barCategoryGap="25%"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#1E2A45" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: "#6B7A99", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, maxVal]}
            tick={{ fill: "#6B7A99", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
          <Bar dataKey={metric} radius={[6, 6, 0, 0]} maxBarSize={48}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                fillOpacity={entry.isYours ? 1 : 0.7}
                style={
                  entry.isYours
                    ? { filter: "drop-shadow(0 0 8px rgba(0,212,255,0.6))" }
                    : undefined
                }
              />
            ))}
            <LabelList
              dataKey={metric}
              position="top"
              style={{ fill: "#9CA3AF", fontSize: 10, fontFamily: "monospace" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Value-for-money table */}
      <div className="mt-4 pt-4 border-t border-white/5">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
          💰 Value for Money (FPS per million ₫)
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[...(yourDevice ? [{ name: yourDevice.name, avgFPS: yourDevice.avgFPS, price: yourDevice.price ?? 15, color: "#00D4FF", isYours: true }] : []),
            ...benchmarkBaselines.map((b) => ({ ...b, isYours: false })),
          ]
            .filter((d) => d.price > 0)
            .sort((a, b) => b.avgFPS / b.price - a.avgFPS / a.price)
            .slice(0, 6)
            .map((d, i) => {
              const val = (d.avgFPS / d.price).toFixed(1);
              return (
                <div
                  key={d.name}
                  className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-xs ${
                    d.isYours ? "bg-cyan-500/10 border border-cyan-500/30" : "bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 font-mono">#{i + 1}</span>
                    <span className="text-gray-300 truncate max-w-[100px]">{d.name}</span>
                  </div>
                  <span className="font-bold font-mono" style={{ color: d.color }}>
                    {val}
                  </span>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}

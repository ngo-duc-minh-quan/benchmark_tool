"use client";

import { useState } from "react";
import Link from "next/link";
import ComparisonChart from "@/components/ComparisonChart";
import { benchmarkBaselines } from "@/lib/benchmarkBaselines";
import { tierConfig } from "@/lib/scoreCalculator";
import { ChevronLeft, BarChart2, Zap } from "lucide-react";

type Metric = "avgFPS" | "score";

export default function ComparePage() {
  const [metric, setMetric] = useState<Metric>("avgFPS");

  return (
    <div className="min-h-screen grid-bg">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#1E2A45] bg-[#080B12]/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
          >
            <ChevronLeft size={16} />
            Back
          </Link>
          <span className="gradient-text font-bold text-lg">BenchmarkX</span>
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setMetric("avgFPS")}
              className={`px-3 py-1.5 rounded-full border transition-all ${
                metric === "avgFPS"
                  ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400"
                  : "border-[#1E2A45] text-gray-400"
              }`}
            >
              FPS
            </button>
            <button
              onClick={() => setMetric("score")}
              className={`px-3 py-1.5 rounded-full border transition-all ${
                metric === "score"
                  ? "bg-purple-500/20 border-purple-500/50 text-purple-400"
                  : "border-[#1E2A45] text-gray-400"
              }`}
            >
              Score
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <BarChart2 className="text-cyan-400" size={26} />
            Comparison Dashboard
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Flagship phones ranked by real-world gaming performance
          </p>
        </div>

        {/* Main chart */}
        <ComparisonChart metric={metric} />

        {/* Device cards grid */}
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Device Specs & Scores
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {benchmarkBaselines
              .sort((a, b) => b.score - a.score)
              .map((device) => {
                const tier = tierConfig[device.tier];
                return (
                  <div
                    key={device.id}
                    className="glass p-4 rounded-xl hover:border-opacity-60 transition-all group"
                    style={{ borderColor: device.color + "33" }}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-xs text-gray-500">{device.brand}</p>
                        <p className="font-semibold text-white text-sm leading-tight">
                          {device.name}
                        </p>
                      </div>
                      <span
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-black font-black text-sm flex-shrink-0 ${tier.bg}`}
                      >
                        {device.tier}
                      </span>
                    </div>

                    {/* Score bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">Score</span>
                        <span className="font-mono" style={{ color: device.color }}>
                          {device.score}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${device.score}%`,
                            background: device.color,
                            boxShadow: `0 0 8px ${device.color}88`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-white/5 rounded-lg p-2 text-center">
                        <p className="text-gray-500">Avg</p>
                        <p className="font-bold font-mono text-cyan-400">{device.avgFPS}</p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2 text-center">
                        <p className="text-gray-500">1% Low</p>
                        <p className="font-bold font-mono text-purple-400">{device.onePercentLow}</p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2 text-center">
                        <p className="text-gray-500">Price</p>
                        <p className="font-bold font-mono text-emerald-400">{device.price}M</p>
                      </div>
                    </div>

                    {/* Chipset */}
                    <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2">
                      <Zap size={11} className="text-yellow-400 flex-shrink-0" />
                      <p className="text-xs text-gray-500 truncate">{device.chipset} · {device.ram}</p>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center py-6">
          <p className="text-gray-400 text-sm mb-4">
            Want to add your device to the comparison?
          </p>
          <Link
            href="/benchmark"
            className="btn-shimmer inline-flex items-center gap-2 px-8 py-3 rounded-full font-semibold text-white glow-cyan"
            style={{ background: "linear-gradient(135deg, #00D4FF, #7C3AED)" }}
          >
            Run Benchmark Now
          </Link>
        </div>
      </main>
    </div>
  );
}

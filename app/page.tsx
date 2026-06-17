import Link from "next/link";
import { Cpu, Zap, BarChart2, Shield, Play, ChevronRight } from "lucide-react";
import { benchmarkBaselines } from "@/lib/benchmarkBaselines";
import { tierConfig } from "@/lib/scoreCalculator";

const features = [
  {
    icon: <Cpu size={22} className="text-cyan-400" />,
    title: "Hardware Detector",
    desc: "Auto-detects CPU cores, RAM, GPU renderer, battery level via Web APIs — no app install needed.",
    color: "cyan",
  },
  {
    icon: <Zap size={22} className="text-purple-400" />,
    title: "3D Stress Test",
    desc: "Renders 4,000 cubes in Three.js. Measures Avg FPS, 1% Low, and thermal throttling.",
    color: "purple",
  },
  {
    icon: <BarChart2 size={22} className="text-orange-400" />,
    title: "Smart Comparison",
    desc: "Compare your device against iPhone 15 Pro Max, RedMagic 9 Pro, iQOO 12 with value-for-money ranking.",
    color: "orange",
  },
  {
    icon: <Shield size={22} className="text-emerald-400" />,
    title: "Tier Classification",
    desc: "Scores computed via Web Worker using Score = (AvgFPS × 0.6) + (Stability × 0.4). Classified S/A/B/C.",
    color: "emerald",
  },
];

export default function HomePage() {
  const topDevices = benchmarkBaselines.sort((a, b) => b.score - a.score).slice(0, 4);

  return (
    <div className="min-h-screen grid-bg overflow-hidden">
      {/* Scanline effect */}
      <div
        className="scanline fixed inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent z-50"
        style={{ top: 0 }}
      />

      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b border-[#1E2A45] bg-[#080B12]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="gradient-text font-black text-xl tracking-tight">
            BenchmarkX
          </span>
          <div className="flex items-center gap-3">
            <Link
              href="/compare"
              className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5"
            >
              Compare
            </Link>
            <Link
              href="/benchmark"
              className="btn-shimmer flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white glow-cyan"
              style={{ background: "linear-gradient(135deg, #00D4FF, #7C3AED)" }}
            >
              <Play size={13} fill="white" />
              Run Test
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative max-w-6xl mx-auto px-4 pt-20 pb-16 text-center">
        {/* Ambient glow orbs */}
        <div
          className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, #00D4FF, transparent)" }}
        />
        <div
          className="absolute top-10 right-1/4 w-80 h-80 rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, #7C3AED, transparent)" }}
        />

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/5 text-cyan-400 text-xs font-medium mb-6">
          <span className="pulse-dot w-2 h-2 rounded-full bg-cyan-400 inline-block" />
          Real-time Browser Benchmark · No Install Required
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-none">
          <span className="text-white">How Fast Is</span>
          <br />
          <span className="gradient-text">Your Device?</span>
        </h1>

        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Run a 3D gaming stress test right in your browser.
          Get your FPS score, thermal rating, and see exactly how your phone
          stacks up against the world&apos;s top gaming phones.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/benchmark"
            className="btn-shimmer flex items-center gap-3 px-8 py-4 rounded-full text-lg font-bold text-white glow-cyan"
            style={{ background: "linear-gradient(135deg, #00D4FF 0%, #7C3AED 100%)" }}
          >
            <Play size={18} fill="white" />
            Start Benchmark
            <ChevronRight size={18} />
          </Link>
          <Link
            href="/compare"
            className="flex items-center gap-2 px-8 py-4 rounded-full text-lg font-semibold text-gray-300 border border-[#1E2A45] hover:border-cyan-500/30 hover:text-white transition-all"
          >
            <BarChart2 size={18} />
            View Leaderboard
          </Link>
        </div>

        {/* Stat strip */}
        <div className="flex items-center justify-center gap-8 mt-14 text-center">
          {[
            { val: "4,000", label: "3D Cubes" },
            { val: "120Hz", label: "Target FPS" },
            { val: "4 Tiers", label: "S / A / B / C" },
            { val: "8+", label: "Reference Devices" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-2xl font-black gradient-text">{s.val}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-center text-sm font-semibold text-gray-500 uppercase tracking-widest mb-8">
          What We Measure
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <div
              key={i}
              className="glass p-5 rounded-2xl hover:scale-[1.02] transition-transform group"
            >
              <div
                className={`w-10 h-10 rounded-xl bg-${f.color}-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
              >
                {f.icon}
              </div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Top Devices Leaderboard Preview */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">🏆 Top Gaming Phones</h2>
            <p className="text-sm text-gray-400 mt-0.5">Sorted by performance score</p>
          </div>
          <Link
            href="/compare"
            className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
          >
            View All <ChevronRight size={14} />
          </Link>
        </div>

        <div className="space-y-3">
          {topDevices.map((device, i) => {
            const tier = tierConfig[device.tier];
            return (
              <div
                key={device.id}
                className="glass p-4 rounded-xl flex items-center gap-4 hover:border-opacity-50 transition-all group"
                style={{ borderColor: device.color + "22" }}
              >
                {/* Rank */}
                <span className="text-xl font-black text-gray-600 w-6 text-center flex-shrink-0">
                  {i + 1}
                </span>

                {/* Tier badge */}
                <span
                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-black font-black text-sm flex-shrink-0 ${tier.bg}`}
                >
                  {device.tier}
                </span>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm">{device.name}</p>
                  <p className="text-xs text-gray-500">{device.chipset}</p>
                </div>

                {/* Score bar */}
                <div className="hidden sm:block flex-1 min-w-0 max-w-[200px]">
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${device.score}%`,
                        background: device.color,
                        boxShadow: `0 0 6px ${device.color}`,
                      }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 flex-shrink-0 text-right">
                  <div>
                    <p className="text-xs text-gray-500">Avg FPS</p>
                    <p className="font-bold font-mono text-sm" style={{ color: device.color }}>
                      {device.avgFPS}
                    </p>
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-xs text-gray-500">Score</p>
                    <p className="font-bold font-mono text-sm text-white">{device.score}</p>
                  </div>
                  <div className="hidden md:block">
                    <p className="text-xs text-gray-500">Price</p>
                    <p className="font-bold font-mono text-sm text-emerald-400">{device.price}M₫</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Score formula section */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="glass p-8 rounded-2xl text-center">
          <h2 className="text-xl font-bold text-white mb-3">How Scoring Works</h2>
          <p className="text-gray-400 text-sm mb-6">
            Our formula balances raw speed with frame-time consistency:
          </p>
          <div className="inline-block bg-white/5 border border-white/10 rounded-xl px-8 py-4 font-mono text-lg text-white mb-6">
            Score = <span className="text-cyan-400">(AvgFPS × 0.6)</span> +{" "}
            <span className="text-purple-400">(Stability × 0.4)</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(["S", "A", "B", "C"] as const).map((t) => {
              const cfg = tierConfig[t];
              const ranges: Record<string, string> = {
                S: "≥ 85",
                A: "70 – 84",
                B: "55 – 69",
                C: "< 55",
              };
              return (
                <div key={t} className="bg-white/5 rounded-xl p-3">
                  <span
                    className={`inline-flex w-8 h-8 rounded-lg items-center justify-center text-black font-black text-base mb-2 ${cfg.bg}`}
                  >
                    {t}
                  </span>
                  <p className="text-xs text-gray-400 font-mono">{ranges[t]}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{cfg.desc.split("—")[0].trim()}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="max-w-6xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 text-sm mb-3">Ready to see your device&apos;s true power?</p>
        <Link
          href="/benchmark"
          className="btn-shimmer inline-flex items-center gap-3 px-10 py-4 rounded-full text-lg font-bold text-white glow-cyan"
          style={{ background: "linear-gradient(135deg, #00D4FF, #7C3AED)" }}
        >
          <Play size={18} fill="white" />
          Start Free Benchmark
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1E2A45] py-6 text-center text-xs text-gray-600">
        BenchmarkX · Built with Next.js, Three.js, Recharts · ~30 man-hours (FP/FEP estimate)
      </footer>
    </div>
  );
}

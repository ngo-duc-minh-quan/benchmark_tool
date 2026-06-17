"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import HardwareDetector, { type HardwareInfo } from "@/components/HardwareDetector";
import ScoreCard from "@/components/ScoreCard";
import FPSChart from "@/components/FPSChart";
import ComparisonChart from "@/components/ComparisonChart";
import { type BenchmarkResult } from "@/components/StressTestEngine";
import { fetchWithTimeout } from "@/lib/api";
import { ChevronLeft, Save, Trophy } from "lucide-react";

// Dynamically import Three.js component (SSR-disabled)
const StressTestEngine = dynamic(() => import("@/components/StressTestEngine"), {
  ssr: false,
  loading: () => (
    <div className="rounded-2xl bg-[#0F1420] border border-[#1E2A45] flex items-center justify-center" style={{ height: 360 }}>
      <div className="text-center">
        <div className="w-12 h-12 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin mx-auto mb-3" />
        <p className="text-gray-400 text-sm">Loading 3D Engine…</p>
      </div>
    </div>
  ),
});

export default function BenchmarkPage() {
  const [hardwareInfo, setHardwareInfo] = useState<HardwareInfo | null>(null);
  const [result, setResult] = useState<BenchmarkResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  // runKey: incrementing this forces HardwareDetector + StressTestEngine to fully
  // remount, giving clean refs, a fresh idle loop, and fresh hardware detection.
  const [runKey, setRunKey] = useState(0);
  const currentRunKey = useRef(0);

  const handleHardwareReady = useCallback((info: HardwareInfo) => {
    setHardwareInfo(info);
  }, []);

  // runId guard: ignore any late result callbacks from a previous (unmounted) run
  const handleBenchmarkComplete = useCallback((res: BenchmarkResult, runId: number) => {
    if (runId !== currentRunKey.current) return;
    setResult(res);
    setTimeout(() => {
      document.getElementById("results-section")?.scrollIntoView({ behavior: "smooth" });
    }, 300);
  }, []);

  // "Run Again" — full reset via key increment
  const handleRunAgain = useCallback(() => {
    const nextKey = runKey + 1;
    currentRunKey.current = nextKey;
    setRunKey(nextKey);
    setResult(null);
    setSaved(false);
    setSaving(false);
    setHardwareInfo(null);
  }, [runKey]);

  const saveResult = async () => {
    if (!result || !hardwareInfo || saving || saved) return;
    setSaving(true);
    try {
      await fetchWithTimeout("/api/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceName: hardwareInfo.deviceName,
          os: hardwareInfo.os,
          browser: hardwareInfo.browser,
          cpuCores: hardwareInfo.cpuCores,
          ramGB: hardwareInfo.ramGB,
          gpuRenderer: hardwareInfo.gpuRenderer,
          avgFPS: result.avgFPS,
          minFPS: result.minFPS,
          onePercentLow: result.onePercentLow,
          cpuScore: result.cpuScore,
          gpuScore: result.gpuScore,
          score: result.score,
          tier: result.tier,
          batteryDrain: result.batteryDrain,
          fpsTimeline: result.fpsTimeline,
        }),
      });
      setSaved(true);
    } catch (e) {
      console.error(e);
      alert("Lỗi kết nối: Không thể lưu kết quả (Timeout hoặc Mất mạng).");
    } finally {
      setSaving(false);
    }
  };

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
          <div className="flex items-center gap-2">
            {result && (
              <>
                <button
                  onClick={saveResult}
                  disabled={saving || saved}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-[#1E2A45] text-gray-400 hover:text-white hover:border-cyan-500/50 transition-all disabled:opacity-50"
                >
                  <Save size={12} />
                  {saved ? "Saved!" : saving ? "Saving…" : "Save"}
                </button>
                <Link
                  href="/compare"
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 transition-all"
                >
                  <Trophy size={12} />
                  Compare
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Page title */}
        <div>
          <h1 className="text-2xl font-bold text-white">Gaming Stress Test</h1>
          <p className="text-gray-400 text-sm mt-1">
            Renders 4,000 cubes · Measures FPS, 1% Low, Stability &amp; Battery drain
          </p>
        </div>

        {/* Hardware + Engine — keyed so they remount fresh on every "Run Again" */}
        <div className="grid lg:grid-cols-[340px_1fr] gap-6">
          <HardwareDetector key={`hw-${runKey}`} onInfoReady={handleHardwareReady} />
          <StressTestEngine
            key={`engine-${runKey}`}
            runId={runKey}
            onComplete={handleBenchmarkComplete}
            duration={60}
          />
        </div>

        {/* Results */}
        {result && (
          <div id="results-section" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <ScoreCard
                score={result.score}
                tier={result.tier}
                avgFPS={result.avgFPS}
                onePercentLow={result.onePercentLow}
                stability={result.stability}
                batteryDrain={result.batteryDrain}
                cpuScore={result.cpuScore}
                gpuScore={result.gpuScore}
              />
              <FPSChart data={result.fpsTimeline} avgFPS={result.avgFPS} />
            </div>

            <ComparisonChart
              yourDevice={{
                name: hardwareInfo?.deviceName ?? "Your Device",
                avgFPS: result.avgFPS,
                score: result.score,
                tier: result.tier,
                price: 0,
              }}
              metric="avgFPS"
            />

            <div className="flex items-center justify-center gap-4 pt-2">
              <Link
                href="/compare"
                className="btn-shimmer flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm text-white glow-purple"
                style={{ background: "linear-gradient(135deg, #7C3AED, #00D4FF)" }}
              >
                <Trophy size={16} />
                Full Comparison Dashboard
              </Link>
              <button
                onClick={handleRunAgain}
                className="px-6 py-3 rounded-full font-semibold text-sm text-gray-400 border border-[#1E2A45] hover:border-cyan-500/30 hover:text-white transition-all"
              >
                Run Again
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

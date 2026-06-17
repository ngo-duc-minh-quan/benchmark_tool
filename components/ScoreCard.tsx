"use client";

import { tierConfig } from "@/lib/scoreCalculator";

interface Props {
  score: number;
  tier: "S" | "A" | "B" | "C";
  avgFPS: number;
  onePercentLow: number;
  stability: number;
  batteryDrain: number;
  cpuScore: number;
  gpuScore: number;
}

export default function ScoreCard({
  score,
  tier,
  avgFPS,
  onePercentLow,
  stability,
  batteryDrain,
  cpuScore,
  gpuScore,
}: Props) {
  const config = tierConfig[tier];
  const displayScore = Math.min(100, Math.max(0, score)); // guard: 0–100
  const circumference = 2 * Math.PI * 54; // r=54
  const dashOffset = circumference - (displayScore / 100) * circumference;

  const stats = [
    { label: "Avg FPS", value: `${avgFPS}`, unit: "fps", color: "#00D4FF" },
    { label: "Stability", value: `${stability}`, unit: "%", color: "#00E676" },
    { label: "CPU Score", value: `${cpuScore}`, unit: "pts", color: "#a855f7" },
    { label: "GPU Score", value: `${gpuScore}`, unit: "pts", color: "#f59e0b" },
  ];

  // batteryDrain = -1 is a sentinel meaning "not supported" (iOS Safari)
  const batteryText = batteryDrain < 0 ? "N/A" : `${batteryDrain}%`;

  return (
    <div className="glass p-6 rounded-2xl">
      <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-5">
        Performance Score
      </h3>

      <div className="flex items-center gap-6">
        {/* Score Ring */}
        <div className="relative flex-shrink-0">
          <svg width="128" height="128" viewBox="0 0 128 128">
            {/* Background ring */}
            <circle
              cx="64" cy="64" r="54"
              fill="none"
              stroke="#1E2A45"
              strokeWidth="10"
            />
            {/* Score arc */}
            <circle
              cx="64" cy="64" r="54"
              fill="none"
              stroke={config.color}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 64 64)"
              style={{
                filter: `drop-shadow(0 0 8px ${config.color}88)`,
                transition: "stroke-dashoffset 1.5s ease-out",
              }}
            />
            {/* Score text */}
            <text x="64" y="60" textAnchor="middle" fill="white" fontSize="26" fontWeight="700" fontFamily="monospace">
              {displayScore}
            </text>
            <text x="64" y="76" textAnchor="middle" fill="#6B7A99" fontSize="11">
              / 100
            </text>
          </svg>

          {/* Tier badge */}
          <div
            className={`absolute -top-1 -right-1 w-9 h-9 rounded-full flex items-center justify-center text-black font-black text-base shadow-lg ${config.bg}`}
          >
            {tier}
          </div>
        </div>

        {/* Tier info */}
        <div className="flex-1 min-w-0">
          <p className="text-lg font-bold" style={{ color: config.color }}>
            {config.label}
          </p>
          <p className="text-xs text-gray-400 mt-0.5 mb-4">{config.desc}</p>

          {/* Mini stats */}
          <div className="grid grid-cols-2 gap-2">
            {stats.map((s) => (
              <div key={s.label} className="bg-white/5 rounded-lg px-3 py-2">
                <p className="text-xs text-gray-400">{s.label}</p>
                <p className="font-bold font-mono text-sm" style={{ color: s.color }}>
                  {s.value}
                  <span className="text-xs font-normal text-gray-500 ml-0.5">{s.unit}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Score formula note */}
      <div className="mt-4 pt-4 border-t border-white/5 text-xs text-gray-500 text-center space-y-0.5">
        <p>Total Score = (GPU Score × 60%) + (CPU Score × 40%)</p>
        <p className="text-gray-600">
          Battery drain: <span className="font-mono text-yellow-500">{batteryText}</span>
          {batteryDrain < 0 && " · Battery API not supported on this device"}
        </p>
      </div>
    </div>
  );
}

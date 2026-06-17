export interface ScoreInput {
  fpsArray: number[];
}

export interface ScoreResult {
  avgFPS: number;
  minFPS: number;
  onePercentLow: number;
  stability: number;
  score: number;
  tier: "S" | "A" | "B" | "C";
  batteryEfficiency: number;
}

export function calculateScore(fpsArray: number[], batteryDrain: number): ScoreResult {
  if (fpsArray.length === 0) {
    return { avgFPS: 0, minFPS: 0, onePercentLow: 0, stability: 0, score: 0, tier: "C", batteryEfficiency: 0 };
  }

  const avg = fpsArray.reduce((a, b) => a + b, 0) / fpsArray.length;
  const sorted = [...fpsArray].sort((a, b) => a - b);
  const minFPS = sorted[0];

  // 1% low = average of bottom 1% frames
  const onePercentCount = Math.max(1, Math.floor(fpsArray.length * 0.01));
  const onePercentLow =
    sorted.slice(0, onePercentCount).reduce((a, b) => a + b, 0) / onePercentCount;

  // Standard deviation for stability
  const variance = fpsArray.reduce((sum, fps) => sum + Math.pow(fps - avg, 2), 0) / fpsArray.length;
  const stdDev = Math.sqrt(variance);
  const stability = Math.max(0, Math.min(100, 100 * (1 - stdDev / Math.max(avg, 1))));

  // Score formula: Score = (AvgFPS × 0.6) + (Stability × 0.4)
  const rawScore = avg * 0.6 + stability * 0.4;

  // Normalize to 0-100 (assuming 120 FPS + 100 stability = perfect = 112)
  const score = Math.min(100, (rawScore / 112) * 100);

  // Battery efficiency = FPS per % battery drain
  const batteryEfficiency = batteryDrain > 0 ? avg / batteryDrain : avg;

  const tier = classifyTier(score);

  return {
    avgFPS: Math.round(avg * 10) / 10,
    minFPS: Math.round(minFPS * 10) / 10,
    onePercentLow: Math.round(onePercentLow * 10) / 10,
    stability: Math.round(stability * 10) / 10,
    score: Math.round(score * 10) / 10,
    tier,
    batteryEfficiency: Math.round(batteryEfficiency * 10) / 10,
  };
}

export function classifyTier(score: number): "S" | "A" | "B" | "C" {
  if (score >= 85) return "S";
  if (score >= 70) return "A";
  if (score >= 55) return "B";
  return "C";
}

export const tierConfig = {
  S: { label: "S-Tier", color: "#FFD700", bg: "tier-s", desc: "Flagship Killer — Pro Gaming Grade" },
  A: { label: "A-Tier", color: "#00E676", bg: "tier-a", desc: "Excellent — Competitive Gaming" },
  B: { label: "B-Tier", color: "#00D4FF", bg: "tier-b", desc: "Good — Smooth Everyday Gaming" },
  C: { label: "C-Tier", color: "#9E9E9E", bg: "tier-c", desc: "Average — Casual Gaming Only" },
};

// Web Worker: runs score calculation off the main thread
// Prevents UI freeze during heavy computation
// Receives: { fpsArray: number[], batteryDrain: number, cpuScore: number }
// Sends back: full BenchmarkResult metrics

self.onmessage = function (e: MessageEvent) {
  const { fpsArray, batteryDrain, cpuScore = 0 } = e.data as {
    fpsArray: number[];
    batteryDrain: number;
    cpuScore: number;
  };

  if (!fpsArray || fpsArray.length === 0) {
    self.postMessage({
      avgFPS: 0, minFPS: 0, onePercentLow: 0, stability: 0,
      cpuScore: 0, gpuScore: 0, score: 0, tier: "C", batteryEfficiency: 0,
    });
    return;
  }

  const avg = fpsArray.reduce((a: number, b: number) => a + b, 0) / fpsArray.length;
  const sorted = [...fpsArray].sort((a: number, b: number) => a - b);
  const minFPS = sorted[0];

  // 1% low = average of bottom 1% of frames
  const onePercentCount = Math.max(1, Math.floor(fpsArray.length * 0.01));
  const onePercentLow =
    sorted.slice(0, onePercentCount).reduce((a: number, b: number) => a + b, 0) / onePercentCount;

  // Stability via standard deviation
  const variance =
    fpsArray.reduce((sum: number, fps: number) => sum + Math.pow(fps - avg, 2), 0) / fpsArray.length;
  const stdDev = Math.sqrt(variance);
  const stability = Math.max(0, Math.min(100, 100 * (1 - stdDev / Math.max(avg, 1))));

  // GPU Score: normalized to 100 (112 = 120fps×0.6 + 100stability×0.4)
  const rawGpu = avg * 0.6 + stability * 0.4;
  const gpuScore = Math.min(100, (rawGpu / 112) * 100);

  // Final Score: GPU 60% + CPU 40%, capped at 100
  const finalCpuScore = Math.min(100, cpuScore);
  const totalScore = Math.min(100, gpuScore * 0.6 + finalCpuScore * 0.4);

  // Tier classification
  let tier = "C";
  if (totalScore >= 85) tier = "S";
  else if (totalScore >= 70) tier = "A";
  else if (totalScore >= 55) tier = "B";

  // Battery efficiency: FPS per % drain
  const batteryEfficiency = batteryDrain > 0 ? avg / batteryDrain : avg;

  self.postMessage({
    avgFPS:           Math.round(avg * 10) / 10,
    minFPS:           Math.round(minFPS * 10) / 10,
    onePercentLow:    Math.round(onePercentLow * 10) / 10,
    stability:        Math.round(stability * 10) / 10,
    cpuScore:         Math.round(finalCpuScore * 10) / 10,
    gpuScore:         Math.round(gpuScore * 10) / 10,
    score:            Math.round(totalScore * 10) / 10,
    tier,
    batteryEfficiency: Math.round(batteryEfficiency * 10) / 10,
  });
};

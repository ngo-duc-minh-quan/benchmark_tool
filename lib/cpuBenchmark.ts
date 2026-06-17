export interface CPUResult {
  ops: number;
  score: number;
}

export function runCPUBenchmark(durationMs = 3000): Promise<CPUResult> {
  return new Promise((resolve) => {
    // We use a Blob to create an inline Web Worker
    // This avoids having to configure Webpack/Next.js for separate worker files
    const workerCode = `
      self.onmessage = function(e) {
        const { durationMs } = e.data;
        const start = performance.now();
        let ops = 0;
        
        // A math-heavy loop (calculating primes using trial division)
        // This is pure CPU single-core load.
        let n = 2;
        while (performance.now() - start < durationMs) {
          let isPrime = true;
          for (let i = 2; i <= Math.sqrt(n); i++) {
            if (n % i === 0) {
              isPrime = false;
              break;
            }
          }
          if (isPrime) {
            // just to prevent optimization
            ops++;
          }
          n++;
          // We increment ops slightly differently to account for the heavy work
          ops += Math.floor(Math.sqrt(n));
        }
        
        self.postMessage({ ops });
      };
    `;

    const blob = new Blob([workerCode], { type: "application/javascript" });
    const workerUrl = URL.createObjectURL(blob);
    const worker = new Worker(workerUrl);

    worker.onmessage = (e) => {
      const { ops } = e.data;
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
      
      // Calculate a normalized score based on ops.
      // E.g. iPhone 15 Pro Max might get ~3,000,000 ops here. 
      // We normalize so ~3M = 100 points for CPU.
      const rawScore = (ops / 30000) * 100;
      // Cap at 150 for future-proofing
      const score = Math.min(150, Math.round(rawScore * 10) / 10);
      
      resolve({ ops, score });
    };

    worker.postMessage({ durationMs });
  });
}

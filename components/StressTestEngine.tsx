"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import ThermalOverlay from "./ThermalOverlay";
import { Play, Square, Loader2 } from "lucide-react";

export interface BenchmarkResult {
  avgFPS: number;
  minFPS: number;
  onePercentLow: number;
  stability: number;
  cpuScore: number;
  gpuScore: number;
  score: number;
  tier: "S" | "A" | "B" | "C";
  batteryDrain: number;
  batteryEfficiency: number;
  fpsTimeline: { t: number; fps: number }[];
  duration: number;
}

interface Props {
  onComplete: (result: BenchmarkResult, runId: number) => void;
  duration?: number;
  runId?: number; // passed from parent to identify which run this result belongs to
}

type TestState = "idle" | "cpu" | "running" | "computing" | "done";

export default function StressTestEngine({ onComplete, duration = 60, runId = 0 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animFrameRef = useRef<number>(0);  // for the TEST animation loop
  const idleFrameRef = useRef<number>(0);  // for the IDLE preview loop (separate!)
  const cubesRef = useRef<THREE.Mesh[]>([]);

  // FPS tracking
  const fpsArrayRef = useRef<number[]>([]);
  const fpsTimelineRef = useRef<{ t: number; fps: number }[]>([]);
  const lastFrameTimeRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const lastFPSSampleRef = useRef<number>(0);

  // Battery
  const startBatteryRef = useRef<number>(100);

  const [testState, setTestState] = useState<TestState>("idle");
  const [liveFPS, setLiveFPS] = useState(0);
  const [progress, setProgress] = useState(0);
  const [peakFPS, setPeakFPS] = useState(0);
  const [minFPSLive, setMinFPSLive] = useState(999);
  const [fpsDropPercent, setFpsDropPercent] = useState(0);
  const [cpuResult, setCpuResult] = useState<{ops: number, score: number} | null>(null);
  const cpuResultRef = useRef<{ops: number, score: number} | null>(null);
  // Detected screen refresh rate (measured via rAF delta)
  const [detectedHz, setDetectedHz] = useState<number | null>(null);

  // ─── Build Three.js scene ────────────────────────────────────────────
  const initScene = useCallback(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
    });
    renderer.setSize(W, H, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080b12);
    scene.fog = new THREE.FogExp2(0x080b12, 0.015);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 200);
    camera.position.set(0, 8, 30);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x1a2040, 2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x00d4ff, 3);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 100;
    dirLight.shadow.camera.left = -30;
    dirLight.shadow.camera.right = 30;
    dirLight.shadow.camera.top = 30;
    dirLight.shadow.camera.bottom = -30;
    scene.add(dirLight);

    const pointLight1 = new THREE.PointLight(0x7c3aed, 5, 40);
    pointLight1.position.set(-15, 10, 0);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xff3b3b, 3, 30);
    pointLight2.position.set(15, 5, -10);
    scene.add(pointLight2);

    // Ground plane
    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0a0e1a,
      roughness: 0.9,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -5;
    ground.receiveShadow = true;
    scene.add(ground);

    // ── 2500 Cubes ──
    const cubes: THREE.Mesh[] = [];
    const geometry = new THREE.BoxGeometry(0.6, 0.6, 0.6);

    const colors = [0x00d4ff, 0x7c3aed, 0xff3b3b, 0xffb800, 0x00e676, 0xff6b35];
    const materials = colors.map(
      (color) =>
        new THREE.MeshStandardMaterial({
          color,
          roughness: 0.3,
          metalness: 0.7,
          emissive: color,
          emissiveIntensity: 0.05,
        })
    );

    for (let i = 0; i < 4000; i++) {
      const material = materials[i % materials.length];
      const cube = new THREE.Mesh(geometry, material);

      // Random spread in 3D space
      cube.position.set(
        (Math.random() - 0.5) * 60,
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 60
      );
      cube.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      // Store random spin speed in userData
      cube.userData.spinX = (Math.random() - 0.5) * 0.02;
      cube.userData.spinY = (Math.random() - 0.5) * 0.02;
      cube.userData.spinZ = (Math.random() - 0.5) * 0.01;
      cube.userData.floatOffset = Math.random() * Math.PI * 2;
      cube.userData.floatSpeed = 0.3 + Math.random() * 0.7;
      cube.userData.baseY = cube.position.y;

      cube.castShadow = false;
      cube.receiveShadow = false;

      scene.add(cube);
      cubes.push(cube);
    }
    cubesRef.current = cubes;
  }, []);

  // ─── Finish: score calculation via inline Blob Worker ───────────────────────
  // Note: Next.js/Turbopack cannot bundle .ts Worker files via new URL().
  // We use a Blob Worker instead. Logic is kept in sync with workers/scoreWorker.ts.
  const finishTest = useCallback(async () => {
    setTestState("computing");

    // Battery drain — iOS Safari does not support Battery API
    let batteryDrain = -1; // sentinel: -1 = not supported on this device
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const battery = await (navigator as any).getBattery();
      const currentBattery = Math.round(battery.level * 100);
      batteryDrain = Math.max(0, startBatteryRef.current - currentBattery);
    } catch {
      // Battery API not supported (iOS Safari) — keep sentinel -1
    }

    // Inline Blob Worker (same logic as workers/scoreWorker.ts)
    const workerCode = `
      self.onmessage = function(e) {
        const { fpsArray, batteryDrain, cpuScore = 0 } = e.data;
        if (!fpsArray || fpsArray.length === 0) {
          self.postMessage({ avgFPS:0,minFPS:0,onePercentLow:0,stability:0,cpuScore:0,gpuScore:0,score:0,tier:'C',batteryEfficiency:0 });
          return;
        }
        const avg = fpsArray.reduce((a, b) => a + b, 0) / fpsArray.length;
        const sorted = [...fpsArray].sort((a, b) => a - b);
        const minFPS = sorted[0];
        const onePercentCount = Math.max(1, Math.floor(fpsArray.length * 0.01));
        const onePercentLow = sorted.slice(0, onePercentCount).reduce((a, b) => a + b, 0) / onePercentCount;
        const variance = fpsArray.reduce((sum, fps) => sum + Math.pow(fps - avg, 2), 0) / fpsArray.length;
        const stdDev = Math.sqrt(variance);
        const stability = Math.max(0, Math.min(100, 100 * (1 - stdDev / Math.max(avg, 1))));
        const rawGpu = avg * 0.6 + stability * 0.4;
        const gpuScore = Math.min(100, (rawGpu / 112) * 100);
        const finalCpuScore = Math.min(100, cpuScore || 0);
        const totalScore = Math.min(100, gpuScore * 0.6 + finalCpuScore * 0.4);
        let tier = 'C';
        if (totalScore >= 85) tier = 'S';
        else if (totalScore >= 70) tier = 'A';
        else if (totalScore >= 55) tier = 'B';
        const batteryEfficiency = batteryDrain > 0 ? avg / batteryDrain : avg;
        self.postMessage({
          avgFPS: Math.round(avg*10)/10, minFPS: Math.round(minFPS*10)/10,
          onePercentLow: Math.round(onePercentLow*10)/10, stability: Math.round(stability*10)/10,
          cpuScore: Math.round(finalCpuScore*10)/10, gpuScore: Math.round(gpuScore*10)/10,
          score: Math.round(totalScore*10)/10, tier,
          batteryEfficiency: Math.round(batteryEfficiency*10)/10,
        });
      };
    `;

    const blob = new Blob([workerCode], { type: "application/javascript" });
    const workerUrl = URL.createObjectURL(blob);
    const worker = new Worker(workerUrl);

    worker.onmessage = (e) => {
      const scoreResult = e.data;
      const result: BenchmarkResult = {
        ...scoreResult,
        batteryDrain,
        fpsTimeline: fpsTimelineRef.current,
        duration,
      };
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
      setTestState("done");
      onComplete(result, runId); // pass runId so parent can guard stale results
    };

    worker.onerror = (err) => {
      console.error("[scoreWorker]", err);
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
      setTestState("done");
    };

    worker.postMessage({
      fpsArray: fpsArrayRef.current,
      batteryDrain: Math.max(0, batteryDrain), // pass 0 if not supported
      cpuScore: cpuResultRef.current ? cpuResultRef.current.score : 0,
    });
  }, [duration, onComplete]);

  // ─── Animation + FPS measurement loop ────────────────────────────────
  const startLoop = useCallback(() => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    if (!renderer || !scene || !camera) return;

    startTimeRef.current = performance.now();
    lastFrameTimeRef.current = performance.now();
    lastFPSSampleRef.current = performance.now();
    frameCountRef.current = 0;
    fpsArrayRef.current = [];
    fpsTimelineRef.current = [];

    const testDuration = duration * 1000; // ms

    function animate(now: number) {
      animFrameRef.current = requestAnimationFrame(animate);

      const elapsed = now - startTimeRef.current;
      lastFrameTimeRef.current = now;

      // Progress
      const prog = Math.min(100, (elapsed / testDuration) * 100);
      setProgress(prog);

      // Stop condition
      if (elapsed >= testDuration) {
        cancelAnimationFrame(animFrameRef.current);
        finishTest();
        return;
      }

      // Animate cubes
      const t = elapsed / 1000;
      const cubes = cubesRef.current;
      for (let i = 0; i < cubes.length; i++) {
        const cube = cubes[i];
        cube.rotation.x += cube.userData.spinX;
        cube.rotation.y += cube.userData.spinY;
        cube.rotation.z += cube.userData.spinZ;
        cube.position.y =
          cube.userData.baseY +
          Math.sin(t * cube.userData.floatSpeed + cube.userData.floatOffset) * 0.5;
      }

      // Rotate camera slowly around the scene
      if (camera && renderer && scene) {
        camera.position.x = Math.sin(t * 0.1) * 35;
        camera.position.z = Math.cos(t * 0.1) * 35;
        camera.position.y = 8 + Math.sin(t * 0.05) * 5;
        camera.lookAt(0, 0, 0);
        renderer.render(scene, camera);
      }

      // FPS sampling every 200ms (was 500ms) — better statistical accuracy
      // 200ms × 300s = 300 samples; 1% low = 3 frames (better than 1)
      frameCountRef.current++;
      if (now - lastFPSSampleRef.current >= 200) {
        const sampleDelta = now - lastFPSSampleRef.current;
        const fps = Math.round((frameCountRef.current / sampleDelta) * 1000);
        frameCountRef.current = 0;
        lastFPSSampleRef.current = now;

        fpsArrayRef.current.push(fps);
        fpsTimelineRef.current.push({ t: Math.round(elapsed / 1000), fps });

        setLiveFPS(fps);
        setPeakFPS((prev) => Math.max(prev, fps));
        setMinFPSLive((prev) => Math.min(prev, fps));

        // Thermal detection: compare to peak
        setPeakFPS((peak) => {
          if (peak > 0) {
            const drop = ((peak - fps) / peak) * 100;
            setFpsDropPercent(Math.max(0, drop));
          }
          return peak;
        });
      }
    }

    animFrameRef.current = requestAnimationFrame(animate);
  }, [duration, finishTest]);

  // ─── Start test ───────────────────────────────────────────────────────
  const startTest = useCallback(async () => {
    setTestState("cpu");
    setProgress(0);
    setLiveFPS(0);
    setPeakFPS(0);
    setMinFPSLive(999);
    setFpsDropPercent(0);
    setCpuResult(null);
    cpuResultRef.current = null;

    // Run CPU test first dynamically
    const { runCPUBenchmark } = await import("@/lib/cpuBenchmark");
    const cpuRes = await runCPUBenchmark(3000); // 3 seconds CPU test
    setCpuResult(cpuRes);
    cpuResultRef.current = cpuRes;
    
    // Then proceed to GPU test
    setTestState("running");

    // Record start battery
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const battery = await (navigator as any).getBattery();
      startBatteryRef.current = Math.round(battery.level * 100);
    } catch {
      startBatteryRef.current = 100;
    }

    if (!rendererRef.current) {
      initScene();
      // Small delay to let scene initialize
      setTimeout(startLoop, 100);
    } else {
      startLoop();
    }
  }, [initScene, startLoop]);

  const stopTest = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    setTestState("idle");
    setProgress(0);
  }, []);

  // Init scene on mount for preview + detect actual screen refresh rate
  useEffect(() => {
    initScene();

    // ── Detect real screen refresh rate via rAF delta ──────────────────
    // We sample 10 consecutive frames and compute avg delta → Hz.
    // This runs BEFORE idle loop so Chrome enters high-refresh-rate mode.
    let rafSamples: number[] = [];
    let lastRafTime = performance.now();
    let rafDetectId: number;
    const detectHz = (now: number) => {
      const delta = now - lastRafTime;
      lastRafTime = now;
      if (delta > 2 && delta < 100) rafSamples.push(delta); // ignore outliers
      if (rafSamples.length >= 30) {
        const avg = rafSamples.reduce((a, b) => a + b, 0) / rafSamples.length;
        const hz = Math.round(1000 / avg);
        setDetectedHz(hz);
        // Done detecting — don't schedule more
        return;
      }
      rafDetectId = requestAnimationFrame(detectHz);
    };
    rafDetectId = requestAnimationFrame(detectHz);

    // Idle preview loop — uses its OWN ref (idleFrameRef) to avoid
    // overwriting animFrameRef used by the test loop.
    let stopped = false;
    const idle = () => {
      if (stopped) return;
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        const t = performance.now() / 1000;
        cubesRef.current.forEach((c, i) => {
          c.rotation.x += 0.003;
          c.rotation.y += 0.003;
          c.position.y = c.userData.baseY + Math.sin(t * 0.5 + i * 0.01) * 0.3;
        });
        cameraRef.current.position.x = Math.sin(t * 0.05) * 35;
        cameraRef.current.position.z = Math.cos(t * 0.05) * 35;
        cameraRef.current.lookAt(0, 0, 0);
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      idleFrameRef.current = requestAnimationFrame(idle);
    };
    idleFrameRef.current = requestAnimationFrame(idle);

    return () => {
      stopped = true;
      cancelAnimationFrame(rafDetectId);
      cancelAnimationFrame(idleFrameRef.current);
      cancelAnimationFrame(animFrameRef.current);
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      if (sceneRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sceneRef.current.traverse((object: any) => {
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
            if (Array.isArray(object.material)) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              object.material.forEach((m: any) => m.dispose());
            } else {
              object.material.dispose();
            }
          }
        });
      }
    };
  }, []); // eslint-disable-line

  const isRunning = testState === "running";
  const isComputing = testState === "computing";
  // Warn user if detected Hz is capped at 60 but device supports more
  const isHzCapped = detectedHz !== null && detectedHz <= 62;

  return (
    // The `animate-hz-unlock` CSS class adds a ghost opacity animation.
    // This forces Chrome Android into high-refresh-rate mode (120Hz instead of 60Hz cap).
    <div className="relative rounded-2xl overflow-hidden border border-[var(--color-border)] animate-hz-unlock">
      {/* Three.js Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full"
        style={{ height: 360, display: "block" }}
      />

      {/* Thermal overlay */}
      <ThermalOverlay active={isRunning} fpsDropPercent={fpsDropPercent} />

      {/* HUD overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top-left FPS counter */}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/10">
            <span
              className={`text-xl font-bold font-mono tabular-nums ${
                liveFPS >= 115
                  ? "text-cyan-400"
                  : liveFPS >= 60
                  ? "text-emerald-400"
                  : liveFPS >= 30
                  ? "text-yellow-400"
                  : "text-red-400"
              }`}
            >
              {isRunning ? liveFPS : "—"}
            </span>
            <span className="text-xs text-gray-400">FPS</span>
          </div>
          {isRunning && (
            <>
              <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1 border border-white/10 text-xs">
                <span className="text-emerald-400 font-mono">{peakFPS}</span>
                <span className="text-gray-400 ml-1">peak</span>
              </div>
              <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1 border border-white/10 text-xs">
                <span className="text-red-400 font-mono">
                  {minFPSLive === 999 ? "—" : minFPSLive}
                </span>
                <span className="text-gray-400 ml-1">min</span>
              </div>
            </>
          )}
        </div>

        {/* Top-right: cube count + detected Hz */}
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
          <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/10 text-xs text-gray-400">
            4,000 cubes · 120 FPS Target
          </div>
          {detectedHz !== null && (
            <div className={`bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1 border text-xs font-mono ${
              detectedHz >= 90
                ? "border-cyan-500/40 text-cyan-400"
                : "border-yellow-500/40 text-yellow-400"
            }`}>
              Display: {detectedHz}Hz
            </div>
          )}
        </div>

        {/* Progress bar */}
        {isRunning && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Center idle label */}
        {testState === "idle" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center bg-black/40 backdrop-blur-sm rounded-2xl px-8 py-4 border border-white/10 space-y-2">
              <p className="text-gray-400 text-sm">Preview Mode — Click Start to begin test</p>
              {isHzCapped && (
                <p className="text-yellow-400 text-xs">
                  ⚠️ Browser capped at {detectedHz}Hz — Chrome flags may help unlock 120Hz
                </p>
              )}
            </div>
          </div>
        )}

        {/* CPU Testing overlay */}
        {testState === "cpu" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md z-10">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full border-4 border-purple-500 border-t-transparent animate-spin mx-auto mb-4" />
              <p className="text-white font-bold text-lg">Phase 1: CPU Compute Test</p>
              <p className="text-purple-400 text-sm mt-1">Running heavy math calculations...</p>
            </div>
          </div>
        )}

        {/* Computing overlay */}
        {isComputing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="text-center">
              <Loader2 size={48} className="animate-spin text-cyan-400 mx-auto mb-3" />
              <p className="text-white font-semibold">Computing Score via Web Worker…</p>
              <p className="text-gray-400 text-sm mt-1">Analyzing FPS samples...</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls bar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 pointer-events-auto z-20">
        {!isRunning && testState !== "computing" && testState !== "cpu" && (
          <button
            onClick={startTest}
            className="btn-shimmer flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold text-sm text-white transition-all hover:scale-105 active:scale-95 glow-cyan"
            style={{
              background: "linear-gradient(135deg, #00D4FF, #7C3AED)",
            }}
          >
            <Play size={16} fill="white" />
            Start Benchmark ({duration}s)
          </button>
        )}
        {isRunning && (
          <>
            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-4 py-2 border border-white/10 text-sm text-white">
              <span className="pulse-dot w-2 h-2 rounded-full bg-red-500 inline-block" />
              {Math.round(progress)}% — {Math.round((duration * (100 - progress)) / 100)}s remaining
            </div>
            <button
              onClick={stopTest}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full font-semibold text-sm text-white bg-red-600/80 hover:bg-red-600 backdrop-blur-sm transition-all border border-red-500/50"
            >
              <Square size={14} fill="white" />
              Stop
            </button>
          </>
        )}
      </div>
    </div>
  );
}

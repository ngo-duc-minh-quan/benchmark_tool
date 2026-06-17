"use client";

import { useEffect, useState } from "react";
import { UAParser } from "ua-parser-js";
import { Cpu, MemoryStick, Monitor, Battery, Wifi } from "lucide-react";

export interface HardwareInfo {
  deviceName: string;
  os: string;
  browser: string;
  cpuCores: number;
  ramGB: number;
  gpuRenderer: string;
  gpuVendor: string;
  batteryLevel: number;
  batteryCharging: boolean;
  batterySupported: boolean; // false on iOS Safari
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
}

interface Props {
  onInfoReady?: (info: HardwareInfo) => void;
}

export default function HardwareDetector({ onInfoReady }: Props) {
  const [info, setInfo] = useState<HardwareInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function detect() {
      try {
        // 1. User Agent parsing
        const parser = new UAParser(navigator.userAgent);
        const device = parser.getDevice();
        const os = parser.getOS();
        const browserInfo = parser.getBrowser();

        const deviceName =
          device.vendor && device.model
            ? `${device.vendor} ${device.model}`
            : device.vendor
            ? `${device.vendor} Device`
            : ["iOS", "Android"].includes(os.name || "")
            ? `${os.name} Device`
            : "Unknown Device / Desktop";

        // 2. CPU & Memory
        const cpuCores = navigator.hardwareConcurrency ?? 4;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ramGB = (navigator as any).deviceMemory ?? 4;

        // 3. GPU via WebGL
        let gpuRenderer = "Unknown GPU";
        let gpuVendor = "Unknown";
        try {
          const canvas = document.createElement("canvas");
          const gl =
            canvas.getContext("webgl2") ||
            (canvas.getContext("webgl") as WebGLRenderingContext | null);
          if (gl) {
            const ext = gl.getExtension("WEBGL_debug_renderer_info");
            if (ext) {
              gpuRenderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || "Unknown";
              gpuVendor = gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) || "Unknown";
            }
          }
        } catch {
          // Ignore
        }

        // 4. Battery with timeout — not supported on iOS Safari
        let batteryLevel = 100;
        let batteryCharging = false;
        let batterySupported = false;
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const nav = navigator as any;
          if (nav.getBattery) {
            // Race the battery promise against a 2-second timeout
            const battery = await Promise.race([
              nav.getBattery(),
              new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2000))
            ]);
            batteryLevel = Math.round((battery as { level: number; charging: boolean }).level * 100);
            batteryCharging = (battery as { level: number; charging: boolean }).charging;
            batterySupported = true;
          }
        } catch (e) {
          console.warn("Battery status not available or timed out", e);
          batterySupported = false;
        }

        const hardwareInfo: HardwareInfo = {
          deviceName,
          os: `${os.name ?? "Unknown"} ${os.version ?? ""}`.trim(),
          browser: `${browserInfo.name ?? "Unknown"} ${browserInfo.version ?? ""}`.trim(),
          cpuCores,
          ramGB,
          gpuRenderer,
          gpuVendor,
          batteryLevel,
          batteryCharging,
          batterySupported,
          screenWidth: window.screen.width,
          screenHeight: window.screen.height,
          pixelRatio: window.devicePixelRatio,
        };

        setInfo(hardwareInfo);
        onInfoReady?.(hardwareInfo);
      } catch (error) {
        console.error("Hardware detection failed", error);
        // Fallback info
        const fallback: HardwareInfo = {
          deviceName: "Unknown Device",
          os: "Unknown OS",
          browser: "Unknown Browser",
          cpuCores: 4,
          ramGB: 4,
          gpuRenderer: "Unknown GPU",
          gpuVendor: "Unknown",
          batteryLevel: 100,
          batteryCharging: false,
          batterySupported: false,
          screenWidth: window.innerWidth,
          screenHeight: window.innerHeight,
          pixelRatio: 1,
        };
        setInfo(fallback);
        onInfoReady?.(fallback);
      } finally {
        setLoading(false);
      }
    }

    detect();
  }, [onInfoReady]);

  const specs = info
    ? [
        {
          icon: <Monitor size={16} className="text-cyan-400" />,
          label: "Device",
          value: info.deviceName,
        },
        {
          icon: <Cpu size={16} className="text-purple-400" />,
          label: "CPU Cores",
          value: `${info.cpuCores} Cores`,
        },
        {
          icon: <MemoryStick size={16} className="text-emerald-400" />,
          label: "RAM",
          value: `~${info.ramGB} GB`,
        },
        {
          icon: <Monitor size={16} className="text-orange-400" />,
          label: "GPU",
          value: info.gpuRenderer.length > 40
            ? info.gpuRenderer.substring(0, 40) + "…"
            : info.gpuRenderer,
        },
        {
          icon: <Battery size={16} className="text-yellow-400" />,
          label: "Battery",
          value: info.batterySupported
            ? `${info.batteryLevel}% ${info.batteryCharging ? "⚡ Charging" : ""}`
            : "N/A (not supported)",
        },
        {
          icon: <Wifi size={16} className="text-blue-400" />,
          label: "Screen",
          value: `${info.screenWidth}×${info.screenHeight} @${info.pixelRatio}x`,
        },
      ]
    : [];

  return (
    <div className="glass p-6 rounded-2xl">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
          <Cpu size={18} className="text-cyan-400" />
        </div>
        <h2 className="text-lg font-semibold text-white">Hardware Profile</h2>
        {loading && (
          <span className="ml-auto flex items-center gap-2 text-xs text-[var(--color-muted)]">
            <span className="pulse-dot w-2 h-2 rounded-full bg-cyan-400 inline-block" />
            Detecting…
          </span>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-14 rounded-xl bg-white/5 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {specs.map((spec, i) => (
            <div
              key={i}
              className="rounded-xl bg-white/5 border border-white/5 p-3 hover:border-cyan-500/30 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                {spec.icon}
                <span className="text-xs text-[var(--color-muted)] uppercase tracking-wider">
                  {spec.label}
                </span>
              </div>
              <p className="text-sm font-medium text-white truncate">{spec.value}</p>
            </div>
          ))}
        </div>
      )}

      {info && (
        <p className="mt-4 text-xs text-[var(--color-muted)] text-center">
          {info.os} · {info.browser}
        </p>
      )}
    </div>
  );
}

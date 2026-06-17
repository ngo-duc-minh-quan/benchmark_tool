"use client";

import { useRef } from "react";

interface Props {
  active: boolean;
  fpsDropPercent: number; // 0-100, triggers at >30
}

export default function ThermalOverlay({ active, fpsDropPercent }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  const intensity = Math.min(1, fpsDropPercent / 60);
  const isThermal = active && fpsDropPercent > 30;

  return (
    <>
      {/* Full-screen red glow overlay */}
      <div
        ref={overlayRef}
        className={`fixed inset-0 pointer-events-none z-50 transition-opacity duration-1000 ${
          isThermal ? "thermal-active" : "opacity-0"
        }`}
        style={{
          background: `radial-gradient(ellipse at center, rgba(255,59,59,${
            intensity * 0.25
          }) 0%, rgba(255,100,0,${intensity * 0.1}) 50%, transparent 70%)`,
        }}
      />

      {/* Corner heat indicators */}
      {isThermal && (
        <>
          <div
            className="fixed top-0 left-0 w-32 h-32 pointer-events-none z-50 thermal-active"
            style={{
              background: `radial-gradient(circle at top left, rgba(255,59,59,${intensity * 0.5}), transparent 70%)`,
            }}
          />
          <div
            className="fixed top-0 right-0 w-32 h-32 pointer-events-none z-50 thermal-active"
            style={{
              background: `radial-gradient(circle at top right, rgba(255,100,0,${intensity * 0.4}), transparent 70%)`,
            }}
          />
          {/* Warning banner */}
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold thermal-active"
              style={{
                background: "rgba(255,59,59,0.2)",
                border: "1px solid rgba(255,59,59,0.5)",
                backdropFilter: "blur(8px)",
                color: "#FF6B6B",
              }}
            >
              <span className="pulse-dot w-2 h-2 rounded-full bg-red-500 inline-block" />
              🌡️ Thermal Throttling Detected — FPS drop {Math.round(fpsDropPercent)}%
            </div>
          </div>
        </>
      )}
    </>
  );
}

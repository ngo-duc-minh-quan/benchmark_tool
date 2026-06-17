import fs from 'fs';

let content = fs.readFileSync('components/StressTestEngine.tsx', 'utf8');

// 1. Fix unused delta
content = content.replace('      const delta = now - lastFrameTimeRef.current;\n', '');

// 2. Fix ThermalOverlay unused useEffect
let thermalContent = fs.readFileSync('components/ThermalOverlay.tsx', 'utf8');
thermalContent = thermalContent.replace('import { useEffect, useRef } from "react";', 'import { useRef } from "react";');
fs.writeFileSync('components/ThermalOverlay.tsx', thermalContent);

// 3. Move finishTest before startLoop
// extract finishTest
const finishTestStart = content.indexOf('  // ─── Finish: use Web Worker for score calculation ─────────────────────');
const finishTestEnd = content.indexOf('  // ─── Start test ───────────────────────────────────────────────────────');
const finishTestCode = content.substring(finishTestStart, finishTestEnd);

// extract startLoop
const startLoopStart = content.indexOf('  // ─── Animation + FPS measurement loop ────────────────────────────────');
const startLoopEnd = finishTestStart;
let startLoopCode = content.substring(startLoopStart, startLoopEnd);

// Add finishTest to startLoop dependencies
startLoopCode = startLoopCode.replace('  }, [duration]);', '  }, [duration, finishTest]);');

// replace both
content = content.substring(0, startLoopStart) + finishTestCode + startLoopCode + content.substring(finishTestEnd);

// 4. Fix any and empty catch
content = content.replace(/try {\n\s*const battery = await \(navigator as any\)\.getBattery\(\);\n\s*currentBattery = Math\.round\(battery\.level \* 100\);\n\s*} catch \(_\) {}/g, `try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const battery = await (navigator as any).getBattery();
      currentBattery = Math.round(battery.level * 100);
    } catch {
      // Ignore
    }`);

content = content.replace(/try {\n\s*const battery = await \(navigator as any\)\.getBattery\(\);\n\s*startBatteryRef\.current = Math\.round\(battery\.level \* 100\);\n\s*} catch \(_\) {/g, `try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const battery = await (navigator as any).getBattery();
      startBatteryRef.current = Math.round(battery.level * 100);
    } catch {`);

content = content.replace(/sceneRef\.current\.traverse\(\(object: any\) => {/g, `// eslint-disable-next-line @typescript-eslint/no-explicit-any\n        sceneRef.current.traverse((object: any) => {`);
content = content.replace(/object\.material\.forEach\(\(m: any\) => m\.dispose\(\)\);/g, `// eslint-disable-next-line @typescript-eslint/no-explicit-any\n              object.material.forEach((m: any) => m.dispose());`);

// 5. Fix render fpsArrayRef.current.length
content = content.replace(/<p className="text-gray-400 text-sm mt-1">Analyzing \{fpsArrayRef\.current\.length\} FPS samples<\/p>/g, `<p className="text-gray-400 text-sm mt-1">Analyzing FPS samples...</p>`);

fs.writeFileSync('components/StressTestEngine.tsx', content);

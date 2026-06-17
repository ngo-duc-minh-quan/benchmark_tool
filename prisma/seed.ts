import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const seedDevices = [
    {
      deviceName: "iPhone 17 Pro Max",
      os: "iOS 19",
      browser: "Safari",
      cpuCores: 8,
      ramGB: 12,
      gpuRenderer: "Apple A19 Pro GPU",
      avgFPS: 132.4,
      minFPS: 95.0,
      onePercentLow: 110,
      cpuScore: 90.0,
      gpuScore: 98.0,
      score: 97,
      tier: "S",
      batteryDrain: 2.1,
      fpsTimeline: "[]",
    },
    {
      deviceName: "RedMagic 11 Pro",
      os: "Android 16",
      browser: "Chrome",
      cpuCores: 8,
      ramGB: 24,
      gpuRenderer: "Adreno 840",
      avgFPS: 135.2,
      minFPS: 100.0,
      onePercentLow: 115,
      cpuScore: 92.0,
      gpuScore: 99.0,
      score: 99,
      tier: "S",
      batteryDrain: 3.5,
      fpsTimeline: "[]",
    },
    {
      deviceName: "Xiaomi 17 Ultra",
      os: "Android 16",
      browser: "Chrome",
      cpuCores: 8,
      ramGB: 16,
      gpuRenderer: "Adreno 840",
      avgFPS: 130.5,
      minFPS: 92.0,
      onePercentLow: 108,
      cpuScore: 88.0,
      gpuScore: 96.0,
      score: 95,
      tier: "S",
      batteryDrain: 3.0,
      fpsTimeline: "[]",
    },
    {
      deviceName: "iQOO 15 Ultra",
      os: "Android 16",
      browser: "Chrome",
      cpuCores: 8,
      ramGB: 16,
      gpuRenderer: "Adreno 840",
      avgFPS: 133.0,
      minFPS: 96.0,
      onePercentLow: 112,
      cpuScore: 89.0,
      gpuScore: 98.0,
      score: 98,
      tier: "S",
      batteryDrain: 3.2,
      fpsTimeline: "[]",
    }
  ];

  for (const device of seedDevices) {
    // upsert: update if exists (same deviceName+os+browser), otherwise create
    // This prevents duplicate rows on re-runs
    const existing = await prisma.benchmarkResult.findFirst({
      where: {
        deviceName: device.deviceName,
        os: device.os,
        browser: device.browser,
      },
    });

    if (existing) {
      await prisma.benchmarkResult.update({
        where: { id: existing.id },
        data: device,
      });
      console.log(`Updated: ${device.deviceName}`);
    } else {
      await prisma.benchmarkResult.create({ data: device });
      console.log(`Inserted: ${device.deviceName}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

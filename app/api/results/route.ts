import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ── Simple in-memory rate limiter ────────────────────────────────────────────
// Max 5 POST requests per IP per minute
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const WINDOW_MS = 60_000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// ── Input validation ─────────────────────────────────────────────────────────
const VALID_TIERS = new Set(["S", "A", "B", "C"]);

function validateBody(body: Record<string, unknown>): string | null {
  const required = [
    "deviceName", "os", "browser", "cpuCores", "ramGB",
    "gpuRenderer", "avgFPS", "minFPS", "onePercentLow",
    "score", "tier", "batteryDrain", "fpsTimeline",
  ];
  for (const field of required) {
    if (body[field] === undefined || body[field] === null) {
      return `Missing required field: ${field}`;
    }
  }
  if (typeof body.deviceName !== "string" || body.deviceName.trim().length === 0)
    return "deviceName must be a non-empty string";
  if (typeof body.deviceName === "string" && body.deviceName.length > 120)
    return "deviceName too long";

  const avgFPS = Number(body.avgFPS);
  const minFPS = Number(body.minFPS);
  const score  = Number(body.score);
  const cpuCores = Number(body.cpuCores);
  const ramGB  = Number(body.ramGB);

  if (isNaN(avgFPS) || avgFPS < 0 || avgFPS > 300) return "avgFPS out of range (0–300)";
  if (isNaN(minFPS) || minFPS < 0 || minFPS > 300) return "minFPS out of range (0–300)";
  if (isNaN(score)  || score  < 0 || score  > 100) return "score out of range (0–100)";
  if (isNaN(cpuCores) || cpuCores < 1 || cpuCores > 64) return "cpuCores out of range (1–64)";
  if (isNaN(ramGB)  || ramGB  < 0.5 || ramGB  > 512) return "ramGB out of range";
  if (!VALID_TIERS.has(String(body.tier))) return "tier must be S, A, B, or C";

  return null; // valid
}

// ── POST — save a new result ─────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // Rate limiting
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before submitting again." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  try {
    const body = await req.json();

    // Input validation
    const validationError = validateBody(body as Record<string, unknown>);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const {
      deviceName, os, browser, cpuCores, ramGB, gpuRenderer,
      avgFPS, minFPS, onePercentLow, cpuScore, gpuScore,
      score, tier, batteryDrain, fpsTimeline,
    } = body;

    const result = await prisma.benchmarkResult.create({
      data: {
        deviceName:    String(deviceName).trim().slice(0, 120),
        os:            String(os).trim().slice(0, 60),
        browser:       String(browser).trim().slice(0, 60),
        cpuCores:      Number(cpuCores),
        ramGB:         Number(ramGB),
        gpuRenderer:   String(gpuRenderer).trim().slice(0, 200),
        avgFPS:        Number(avgFPS),
        minFPS:        Number(minFPS),
        onePercentLow: Number(onePercentLow),
        cpuScore:      cpuScore != null ? Number(cpuScore) : null,
        gpuScore:      gpuScore != null ? Number(gpuScore) : null,
        score:         Math.min(100, Number(score)), // hard clamp
        tier:          String(tier),
        batteryDrain:  Number(batteryDrain),
        fpsTimeline:   JSON.stringify(fpsTimeline),
      },
    });

    return NextResponse.json({ success: true, id: result.id }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/results]", error);
    // Do NOT expose internal error details to client
    return NextResponse.json(
      { error: "Failed to save result. Please try again." },
      { status: 500 }
    );
  }
}

// ── GET — fetch top results ───────────────────────────────────────────────────
export async function GET() {
  try {
    const results = await prisma.benchmarkResult.findMany({
      orderBy: { score: "desc" },
      take: 50,
      select: {
        id: true,
        deviceName: true,
        os: true,
        browser: true,
        avgFPS: true,
        onePercentLow: true,
        score: true,
        tier: true,
        batteryDrain: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ results });
  } catch (error) {
    console.error("[GET /api/results]", error);
    return NextResponse.json(
      { error: "Failed to fetch results." },
      { status: 500 }
    );
  }
}


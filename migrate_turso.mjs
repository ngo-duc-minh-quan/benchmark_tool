import fs from 'fs';
import { createClient } from '@libsql/client';

function getEnv() {
  const envContent = fs.readFileSync('.env', 'utf-8');
  const env = {};
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        env[key] = val;
      }
    }
  }
  return env;
}

async function main() {
  const env = getEnv();
  const url = env.DATABASE_URL;
  const authToken = env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    console.error("Missing DATABASE_URL or TURSO_AUTH_TOKEN in .env");
    process.exit(1);
  }

  console.log("Connecting to Turso:", url.split('?')[0]);
  const client = createClient({ url, authToken });

  const statements = [
    'ALTER TABLE BenchmarkResult ADD COLUMN clientResultId TEXT;',
    'CREATE UNIQUE INDEX IF NOT EXISTS BenchmarkResult_clientResultId_key ON BenchmarkResult(clientResultId);',
    'ALTER TABLE BenchmarkResult ADD COLUMN singleCoreWorkUnitsPerSec REAL;',
    'ALTER TABLE BenchmarkResult ADD COLUMN multiCoreWorkUnitsPerSec REAL;',
    'ALTER TABLE BenchmarkResult ADD COLUMN cpuCoresUsed INTEGER;'
  ];

  for (const stmt of statements) {
    console.log("Executing:", stmt);
    try {
      await client.execute(stmt);
      console.log("-> SUCCESS");
    } catch (e) {
      console.log("-> NOTICE:", e.message);
    }
  }

  console.log("Migration complete!");
}

main().catch(console.error);

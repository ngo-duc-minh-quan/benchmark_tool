-- AlterTable
ALTER TABLE "BenchmarkResult" ADD COLUMN "clientResultId" TEXT;
ALTER TABLE "BenchmarkResult" ADD COLUMN "singleCoreWorkUnitsPerSec" REAL;
ALTER TABLE "BenchmarkResult" ADD COLUMN "multiCoreWorkUnitsPerSec" REAL;
ALTER TABLE "BenchmarkResult" ADD COLUMN "cpuCoresUsed" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "BenchmarkResult_clientResultId_key" ON "BenchmarkResult"("clientResultId");

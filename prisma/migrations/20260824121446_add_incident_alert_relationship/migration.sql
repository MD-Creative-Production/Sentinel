-- AlterTable
ALTER TABLE "alerts" ADD COLUMN     "incidentId" TEXT;

-- CreateIndex
CREATE INDEX "alerts_incidentId_idx" ON "alerts"("incidentId");

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "incidents"("id") ON DELETE SET NULL ON UPDATE CASCADE;


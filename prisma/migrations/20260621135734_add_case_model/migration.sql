-- CreateTable "cases"
CREATE TABLE "cases" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE INDEX "cases_ownerId_idx" ON "cases"("ownerId");

-- AddForeignKey for cases
ALTER TABLE "cases" ADD CONSTRAINT "cases_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey for investigation_notes
ALTER TABLE "investigation_notes" ADD CONSTRAINT "investigation_notes_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

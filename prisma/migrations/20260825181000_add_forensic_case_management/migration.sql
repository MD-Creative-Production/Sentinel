-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('DRAFT', 'ACTIVE', 'IN_REVIEW', 'SUSPENDED', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CaseSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "CaseAssigneeRole" AS ENUM ('INVESTIGATOR', 'LEGAL_OBSERVER', 'EXTERNAL_AUDITOR');

-- CreateTable
CREATE TABLE "cases" (
    "id" TEXT NOT NULL,
    "caseNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "CaseStatus" NOT NULL DEFAULT 'DRAFT',
    "severity" "CaseSeverity" NOT NULL DEFAULT 'MEDIUM',
    "leadInvestigatorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),
    "nextReviewAt" TIMESTAMP(3),

    CONSTRAINT "cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_assignees" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "CaseAssigneeRole" NOT NULL DEFAULT 'INVESTIGATOR',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "case_assignees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_incidents" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "case_incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_activity_logs" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "ipAddress" TEXT,
    "changedFields" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "case_activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cases_caseNumber_key" ON "cases"("caseNumber");

-- CreateIndex
CREATE INDEX "cases_status_idx" ON "cases"("status");

-- CreateIndex
CREATE INDEX "cases_severity_idx" ON "cases"("severity");

-- CreateIndex
CREATE INDEX "cases_leadInvestigatorId_idx" ON "cases"("leadInvestigatorId");

-- CreateIndex
CREATE INDEX "cases_caseNumber_idx" ON "cases"("caseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "case_assignees_caseId_userId_key" ON "case_assignees"("caseId", "userId");

-- CreateIndex
CREATE INDEX "case_assignees_userId_idx" ON "case_assignees"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "case_incidents_caseId_incidentId_key" ON "case_incidents"("caseId", "incidentId");

-- CreateIndex
CREATE INDEX "case_incidents_incidentId_idx" ON "case_incidents"("incidentId");

-- CreateIndex
CREATE INDEX "case_activity_logs_caseId_idx" ON "case_activity_logs"("caseId");

-- CreateIndex
CREATE INDEX "case_activity_logs_actorId_idx" ON "case_activity_logs"("actorId");

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_leadInvestigatorId_fkey" FOREIGN KEY ("leadInvestigatorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_assignees" ADD CONSTRAINT "case_assignees_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_assignees" ADD CONSTRAINT "case_assignees_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_incidents" ADD CONSTRAINT "case_incidents_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_incidents" ADD CONSTRAINT "case_incidents_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "incidents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_activity_logs" ADD CONSTRAINT "case_activity_logs_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_activity_logs" ADD CONSTRAINT "case_activity_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investigation_notes" ADD CONSTRAINT "investigation_notes_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

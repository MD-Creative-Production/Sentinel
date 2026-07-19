-- CreateTable
CREATE TABLE "incidents" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "priority" TEXT NOT NULL DEFAULT 'p3',
    "category" TEXT,
    "organizationId" TEXT,
    "assignedUserId" TEXT,
    "sourceAlertIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "detectionSource" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incident_audit_logs" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorName" TEXT,
    "previousValues" JSONB,
    "newValues" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incident_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "incidents_status_idx" ON "incidents"("status");

-- CreateIndex
CREATE INDEX "incidents_severity_idx" ON "incidents"("severity");

-- CreateIndex
CREATE INDEX "incidents_priority_idx" ON "incidents"("priority");

-- CreateIndex
CREATE INDEX "incidents_assignedUserId_idx" ON "incidents"("assignedUserId");

-- CreateIndex
CREATE INDEX "incidents_organizationId_idx" ON "incidents"("organizationId");

-- CreateIndex
CREATE INDEX "incident_audit_logs_incidentId_idx" ON "incident_audit_logs"("incidentId");

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_audit_logs" ADD CONSTRAINT "incident_audit_logs_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "incidents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

import { PrismaClient, CaseStatus, CaseSeverity, CaseAssigneeRole } from '@prisma/client';

/**
 * Case Management Seed Script (#126)
 *
 * Populates realistic mock forensic cases, multi-incident attachments,
 * multi-role assignees, and audit history logs for local integration testing.
 */
export async function seedCases(prisma: PrismaClient) {
  console.log('Seeding Forensic Investigation & Case Management data...');

  // 1. Seed or retrieve users
  const leadInvestigator = await prisma.user.upsert({
    where: { email: 'alice.lead@sentinel.security' },
    update: {},
    create: {
      email: 'alice.lead@sentinel.security',
    },
  });

  const forensicAnalyst = await prisma.user.upsert({
    where: { email: 'bob.forensics@sentinel.security' },
    update: {},
    create: {
      email: 'bob.forensics@sentinel.security',
    },
  });

  const legalObserver = await prisma.user.upsert({
    where: { email: 'clara.legal@sentinel.security' },
    update: {},
    create: {
      email: 'clara.legal@sentinel.security',
    },
  });

  const externalAuditor = await prisma.user.upsert({
    where: { email: 'dan.auditor@external-sec.io' },
    update: {},
    create: {
      email: 'dan.auditor@external-sec.io',
    },
  });

  // 2. Seed or retrieve mock incidents
  const incidentAlpha = await prisma.incident.upsert({
    where: { id: 'inc-seed-alpha-001' },
    update: {},
    create: {
      id: 'inc-seed-alpha-001',
      title: 'Suspicious High-Value Flash Loan Drain on Liquidity Pool',
      description: 'Anomalous multi-hop swap sequence drained $1.4M from Soroban DEX pair.',
      status: 'investigating',
      severity: 'critical',
      priority: 'p1',
      category: 'smart-contract-exploit',
      assignedUserId: leadInvestigator.id,
      tags: ['flash-loan', 'dex', 'high-priority'],
    },
  });

  const incidentBeta = await prisma.incident.upsert({
    where: { id: 'inc-seed-beta-002' },
    update: {},
    create: {
      id: 'inc-seed-beta-002',
      title: 'Unauthorized Admin Key Rotation Attempt',
      description: 'Multi-sig threshold mutation attempted outside scheduled governance window.',
      status: 'contained',
      severity: 'high',
      priority: 'p2',
      category: 'access-control',
      assignedUserId: forensicAnalyst.id,
      tags: ['multisig', 'governance', 'key-compromise'],
    },
  });

  const incidentGamma = await prisma.incident.upsert({
    where: { id: 'inc-seed-gamma-003' },
    update: {},
    create: {
      id: 'inc-seed-gamma-003',
      title: 'Dormant Whale Wallet Reactivation & Mixing Interaction',
      description: 'Blacklisted address routed 250k XLM through decentralized privacy mixer.',
      status: 'open',
      severity: 'medium',
      priority: 'p3',
      category: 'aml-compliance',
      assignedUserId: leadInvestigator.id,
      tags: ['aml', 'mixer', 'sanctions'],
    },
  });

  // 3. Seed Case 1: Multi-incident Active Critical Case
  const case1 = await prisma.case.upsert({
    where: { caseNumber: 'CASE-2026-0891' },
    update: {},
    create: {
      caseNumber: 'CASE-2026-0891',
      title: 'Operation Horizon: DEX Liquidity Exploit & Associated Key Compromise',
      description:
        'Comprehensive forensic investigation tracking attacker root-cause vector across Flash Loan exploit and attempted multi-sig takeover.',
      status: CaseStatus.ACTIVE,
      severity: CaseSeverity.CRITICAL,
      leadInvestigatorId: leadInvestigator.id,
      nextReviewAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 days
    },
  });

  // 4. Seed Case 2: In-Review Compliance Case
  const case2 = await prisma.case.upsert({
    where: { caseNumber: 'CASE-2026-0892' },
    update: {},
    create: {
      caseNumber: 'CASE-2026-0892',
      title: 'Sanctioned Entity Fund Tracing & Privacy Mixer Flow Analysis',
      description:
        'Regulatory audit case examining outbound transactions to Tornado/privacy mixer endpoints.',
      status: CaseStatus.IN_REVIEW,
      severity: CaseSeverity.MEDIUM,
      leadInvestigatorId: leadInvestigator.id,
      nextReviewAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    },
  });

  // 5. Seed Case 3: Closed Post-Mortem Case
  await prisma.case.upsert({
    where: { caseNumber: 'CASE-2026-0893' },
    update: {},
    create: {
      caseNumber: 'CASE-2026-0893',
      title: 'Q2 Bridge Relay Protocol Vulnerability Assessment',
      description:
        'Historical investigation documenting resolved signature validation bug on cross-chain relay.',
      status: CaseStatus.CLOSED,
      severity: CaseSeverity.HIGH,
      leadInvestigatorId: leadInvestigator.id,
      closedAt: new Date(),
    },
  });

  // 6. Assignees for Case 1 (multi-role collaborators)
  await prisma.caseAssignee.upsert({
    where: {
      caseId_userId: {
        caseId: case1.id,
        userId: leadInvestigator.id,
      },
    },
    update: {},
    create: {
      caseId: case1.id,
      userId: leadInvestigator.id,
      role: CaseAssigneeRole.INVESTIGATOR,
    },
  });

  await prisma.caseAssignee.upsert({
    where: {
      caseId_userId: {
        caseId: case1.id,
        userId: forensicAnalyst.id,
      },
    },
    update: {},
    create: {
      caseId: case1.id,
      userId: forensicAnalyst.id,
      role: CaseAssigneeRole.INVESTIGATOR,
    },
  });

  await prisma.caseAssignee.upsert({
    where: {
      caseId_userId: {
        caseId: case1.id,
        userId: legalObserver.id,
      },
    },
    update: {},
    create: {
      caseId: case1.id,
      userId: legalObserver.id,
      role: CaseAssigneeRole.LEGAL_OBSERVER,
    },
  });

  await prisma.caseAssignee.upsert({
    where: {
      caseId_userId: {
        caseId: case1.id,
        userId: externalAuditor.id,
      },
    },
    update: {},
    create: {
      caseId: case1.id,
      userId: externalAuditor.id,
      role: CaseAssigneeRole.EXTERNAL_AUDITOR,
    },
  });

  // 7. Multi-incident attachments (M:N mapping)
  await prisma.caseIncident.upsert({
    where: {
      caseId_incidentId: {
        caseId: case1.id,
        incidentId: incidentAlpha.id,
      },
    },
    update: {},
    create: {
      caseId: case1.id,
      incidentId: incidentAlpha.id,
    },
  });

  await prisma.caseIncident.upsert({
    where: {
      caseId_incidentId: {
        caseId: case1.id,
        incidentId: incidentBeta.id,
      },
    },
    update: {},
    create: {
      caseId: case1.id,
      incidentId: incidentBeta.id,
    },
  });

  await prisma.caseIncident.upsert({
    where: {
      caseId_incidentId: {
        caseId: case2.id,
        incidentId: incidentGamma.id,
      },
    },
    update: {},
    create: {
      caseId: case2.id,
      incidentId: incidentGamma.id,
    },
  });

  // 8. Audit and Activity Ledger with JSON Diffs
  await prisma.caseActivityLog.createMany({
    data: [
      {
        caseId: case1.id,
        actorId: leadInvestigator.id,
        action: 'case_created',
        ipAddress: '192.168.1.100',
        changedFields: {
          status: { from: null, to: CaseStatus.DRAFT },
          severity: { from: null, to: CaseSeverity.CRITICAL },
        },
      },
      {
        caseId: case1.id,
        actorId: leadInvestigator.id,
        action: 'status_transition',
        ipAddress: '192.168.1.100',
        changedFields: {
          status: { from: CaseStatus.DRAFT, to: CaseStatus.ACTIVE },
        },
      },
      {
        caseId: case1.id,
        actorId: leadInvestigator.id,
        action: 'incident_linked',
        ipAddress: '192.168.1.100',
        changedFields: {
          incidentId: { from: null, to: incidentAlpha.id },
        },
      },
      {
        caseId: case1.id,
        actorId: forensicAnalyst.id,
        action: 'assignee_added',
        ipAddress: '192.168.1.105',
        changedFields: {
          assigneeUserId: { from: null, to: externalAuditor.id },
          role: { from: null, to: CaseAssigneeRole.EXTERNAL_AUDITOR },
        },
      },
    ],
  });

  console.log('✅ Forensic Investigation & Case Management data seeded successfully.');
}

// Direct execution helper
if (require.main === module) {
  const prisma = new PrismaClient();
  seedCases(prisma)
    .catch(e => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

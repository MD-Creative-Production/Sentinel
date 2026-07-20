# Team Invitation System — Design

Issue: [#113](https://github.com/MD-Creative-Production/Sentinel/issues/113)

## Context & scope note

Issue #113 assumes an existing Organizations Module, Users Module, and RBAC module to
integrate with, and explicitly lists "Organization creation" as out of scope. In the
actual codebase:

- `User` has no `role` field and no organization link.
- Auth is JWT-verification only (`JwtAuthGuard` + `RolesGuard` in `common/`); there is
  no login/register/AuthModule anywhere, and roles come from JWT claims, not the DB.
- There is no `Organization` table. The `Incidents` module has a loose, unvalidated
  `organizationId: String?` field with no relation.

This design adds the minimum real data model needed to make the invitation system's
acceptance criteria actually mean something (in particular "accepted users are added
to the correct organization with the assigned role"), while treating full Organization
CRUD as a separate, future issue. This PR adds `Organization` and `Membership` as data
models only — no org CRUD endpoints. Organizations/memberships used in tests are seeded
directly via Prisma.

## Data model

New Prisma models (added to `prisma/schema.prisma`):

```prisma
model Organization {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())

  memberships Membership[]
  invitations Invitation[]

  @@map("organizations")
}

model Membership {
  id             String   @id @default(cuid())
  organizationId String
  userId         String
  role           String   // admin | analyst | viewer (existing Role enum values)
  createdAt      DateTime @default(now())

  organization Organization @relation(fields: [organizationId], references: [id])
  user         User         @relation(fields: [userId], references: [id])

  @@unique([organizationId, userId])
  @@index([userId])
  @@map("memberships")
}

model Invitation {
  id             String    @id @default(cuid())
  organizationId String
  inviteeEmail   String
  role           String    // admin | analyst | viewer
  status         String    @default("pending") // pending | accepted | expired | revoked
  tokenHash      String    @unique
  expiresAt      DateTime
  invitedById    String
  acceptedAt     DateTime?
  revokedAt      DateTime?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  organization Organization         @relation(fields: [organizationId], references: [id])
  invitedBy    User                 @relation(fields: [invitedById], references: [id])
  auditEntries InvitationAuditLog[]

  @@index([organizationId])
  @@index([inviteeEmail])
  @@index([status])
  @@map("invitations")
}

model InvitationAuditLog {
  id           String   @id @default(cuid())
  invitationId String
  action       String   // invitation_created | invitation_resent | invitation_accepted | invitation_revoked | invitation_expired
  actorId      String?  // null for system-driven actions (automatic expiration)
  actorEmail   String?
  metadata     Json?
  timestamp    DateTime @default(now())

  invitation Invitation @relation(fields: [invitationId], references: [id])

  @@index([invitationId])
  @@map("invitation_audit_logs")
}
```

`User` gains one new back-relation: `memberships Membership[]`. No other `User` columns
change.

Role values reuse the existing `Role` enum (`admin` | `analyst` | `viewer` from
`apps/backend/src/common/enums/role.enum.ts`) rather than introducing a second role
vocabulary. `Membership.role` and `Invitation.role` are both validated against this enum
at the DTO layer.

Tokens: the raw invitation token is never persisted — only a SHA-256 `tokenHash`,
mirroring the existing `ApiKey` model's `key`/`keyHash` split. The raw token is returned
once, in the create response, so a link can be built immediately; email delivery of that
link is out of scope (per the issue) and is not implemented.

Expiration is derived, not cron-driven (this repo has no `@nestjs/schedule` dependency
today). A `pending` invitation past `expiresAt` is treated as expired wherever it's
read (`findOne`, `findAll`, `accept`, `resend`, `revoke`), and its `status` column is
opportunistically flipped to `expired` (with an `invitation_expired` audit entry, actor
null) the first time it's touched after expiring. `INVITATION_EXPIRATION_DAYS` (default
`7`) controls the window, read via `process.env` — consistent with how `JWT_SECRET` is
read elsewhere in this codebase (there is no `ConfigService` wrapper here).

## Module layout

`apps/backend/src/modules/invitations/`, mirroring the `incidents` module's structure:

```
invitations/
├── controllers/invitations.controller.ts
├── services/
│   ├── invitations.service.ts            # create, findAll, findOne, resend, revoke, delete
│   ├── invitation-token.service.ts        # generate/hash/verify tokens
│   └── invitation-acceptance.service.ts   # accept-invitation workflow
├── repositories/invitations.repository.ts
├── dto/
│   ├── create-invitation.dto.ts
│   ├── accept-invitation.dto.ts
│   ├── resend-invitation.dto.ts
│   ├── query-invitations.dto.ts
│   └── index.ts
├── entities/invitation.entity.ts
├── enums/
│   ├── invitation-status.enum.ts
│   ├── invitation-audit-action.enum.ts
│   └── index.ts
├── interfaces/
│   ├── invitation-filter.interface.ts
│   └── index.ts
├── guards/org-admin.guard.ts
├── invitations.module.ts
└── tests/
    ├── dto-validation.spec.ts
    ├── invitation-token.service.spec.ts
    ├── invitations.repository.spec.ts
    ├── invitations.service.spec.ts
    ├── invitation-acceptance.service.spec.ts
    └── invitations.controller.spec.ts
```

## Endpoints

| Method | Endpoint                  | Guard                                                            | Notes                                                                              |
| ------ | ------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| POST   | `/invitations`            | `JwtAuthGuard`, `OrgAdminGuard`                                  | body includes `organizationId`; 409 on duplicate pending invite for same org+email |
| GET    | `/invitations`            | `JwtAuthGuard`, `OrgAdminGuard` (against `query.organizationId`) | pagination/filter/sort                                                             |
| GET    | `/invitations/:id`        | `JwtAuthGuard`, `OrgAdminGuard`                                  | 404 if not found                                                                   |
| POST   | `/invitations/accept`     | public (no guard)                                                | `{ token, email }`                                                                 |
| POST   | `/invitations/:id/resend` | `JwtAuthGuard`, `OrgAdminGuard`                                  | only from `pending`; rotates token + expiry                                        |
| PATCH  | `/invitations/:id/revoke` | `JwtAuthGuard`, `OrgAdminGuard`                                  | only from `pending`; 400 on already-accepted                                       |
| DELETE | `/invitations/:id`        | `JwtAuthGuard`, `OrgAdminGuard`                                  | hard delete, for cleanup                                                           |

**`OrgAdminGuard`** (new, in `invitations/guards/`): reads `organizationId` from
body/query/param (in that order), loads the caller's `Membership` for that org via
`CurrentUser().userId`, and requires `role === Role.ADMIN`. No existing guard covers
org-scoped checks, so this is new rather than reusing `RolesGuard` (which only checks
the platform-wide JWT role, not per-org membership).

## Business logic

- **create**: reject if a non-expired `pending` invitation already exists for the same
  `organizationId + inviteeEmail` (409). Generate token via `InvitationTokenService`
  (32 random bytes, hex-encoded, SHA-256 hash persisted). Write `invitation_created`
  audit entry. Return the entity plus the one-time raw token and an assembled delivery
  payload (org name, inviter name, role, invite link, expiry) shaped for a future
  `EmailService.sendInvitation(...)` call — no email is actually sent.
- **acceptInvitation**: hash the incoming token, look up by `tokenHash`. Compute
  effective status; reject with a specific message if expired/revoked/already-accepted/
  not-found. Verify `email` matches `inviteeEmail` (case-insensitive). Find-or-create the
  `User` (by email) — no password/auth fields exist on `User`, so this is a plain insert.
  Upsert a `Membership` (org, user, role from invitation). Mark invitation `accepted`,
  set `acceptedAt`. Write `invitation_accepted` audit entry. No JWT is issued — this repo
  has no login/token-issuance code to hook into; that remains a separate concern.
- **resend**: only from `pending`; rotates token + `expiresAt`; `invitation_resent` audit
  entry.
- **revoke**: only from `pending` (400 if already accepted); sets `revoked`,
  `revokedAt`; `invitation_revoked` audit entry.
- **findOne/findAll**: run rows through `deriveEffectiveStatus()`, which flips stale
  `pending` rows to `expired` (persisting the change + `invitation_expired` audit entry,
  actor `null`) before returning.

## Non-functional

- Pagination/filtering/sorting on `GET /invitations` mirrors `QueryIncidentsDto` exactly
  (page/limit/sortBy/sortOrder + filters for status, role, inviteeEmail, organizationId,
  createdAt range, expiresAt range).
- All endpoints documented via `@ApiTags`/`@ApiOperation`/`@ApiResponse` (Swagger), same
  as `IncidentsController`.
- Unit tests per component (token service, repository, services, controller, DTO
  validation), following the `incidents/tests/` mocking style (mock `PrismaService`,
  no real DB in unit tests).
- `npm run lint`, `npm run build`, `npm run test:backend` must all pass before this is
  considered done.

## Out of scope (explicitly, matching the issue + reality of this codebase)

- Organization CRUD endpoints (data model only).
- Actual email sending / templates.
- JWT/session issuance on invitation acceptance.
- SSO/SAML, external identity providers, bulk import.

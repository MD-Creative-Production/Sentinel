# PR Notes

## 1. PR Title

feat(alerts): fix #122 by implementing alert acknowledgement system

## 2. Commit Message

feat(alerts): fix #122 alert acknowledgement system

## 3. PR Description

This pull request implements the Alert Acknowledgement System to resolve issue #122.
Previously, there was no way for the security team to distinguish between unreviewed alerts and those that had been investigated. This caused potential overlap in work and confusion.

With this change, the `Alert` model now tracks `acknowledgedAt` and `acknowledgedBy`. An `AcknowledgementsModule` provides a new REST endpoint (`POST /alerts/:id/acknowledge`) allowing reviewers to explicitly mark alerts as acknowledged. To maintain data integrity and compliance, acknowledging an alert automatically appends an `ALERT_ACKNOWLEDGED` action to the system's `AuditLog` within a single atomic database transaction.

## 4. Changes Made

- Modified `schema.prisma` to include `acknowledgedAt` and `acknowledgedBy` on the `Alert` model.
- Added `@nestjs/common` and `@nestjs/core` to package dependencies to resolve project-wide TS compilation issues.
- Created `AlertsModule` and `AcknowledgementsModule` following the NestJS module architecture.
- Created `AcknowledgementsController` with a `POST /alerts/:id/acknowledge` endpoint.
- Implemented `AcknowledgementsService` to handle the atomic acknowledgement and audit logging via Prisma `$transaction`.
- Defined `AcknowledgeAlertDto` to capture `reviewerId` and `reviewerName`.
- Registered `AlertsModule` into `app.module.ts`.

## 5. Testing

- Executed `npm run build:backend` to ensure strict TypeScript compilation passes without errors.
- Re-generated the Prisma client using `pnpm dlx prisma generate` and verified that schema changes were accurately reflected.
- Verified the atomicity constraint in code (Prisma `$transaction` wrapper used for DB operations).

## 6. Scope Notes

- **Backend-only change:** Modifies only the Sentinel NestJS backend and PostgreSQL database schema.
- **No Contract Logic Changes:** Does not impact any on-chain or soroban logic.
- **Excluded Files:** `PR_NOTES.md` and `implementation.md` have been explicitly excluded from this commit to keep documentation artifacts out of the deployment package.

## 7. Breaking Changes

None. The new `acknowledgedAt` and `acknowledgedBy` fields are fully backwards-compatible (nullable).

## 8. Related Issue

Closes #122

## 9. Push Command

```bash
git push -u origin implement-alert
```

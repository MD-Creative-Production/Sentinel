# Alert Acknowledgement System Implementation

## Overview

This document outlines the design decisions, technical details, and complexity analysis for the Alert Acknowledgement System implemented as part of issue #122.

## Problem Statement

Security teams and operators need a mechanism to explicitly mark alerts as reviewed. This is crucial to distinguish between active unreviewed alerts and those that have already been acknowledged and processed by a team member.

## Scope of Implementation

- **Data Layer:** Modified `Alert` model in Prisma.
- **Application Layer:** Introduced `AlertsModule` and `AcknowledgementsModule` with REST controllers and services.
- **Audit System:** Integrated with the existing `AuditLog` framework to maintain compliance and traceability.

## Design Decisions

1. **Schema Extension vs. New Table:**
   - **Decision:** Add `acknowledgedAt` and `acknowledgedBy` fields directly to the existing `Alert` model.
   - **Justification:** Since an alert is typically acknowledged only once, a 1-to-1 relationship with a dedicated table would introduce unnecessary joins and database overhead. Adding these nullable fields directly to the `Alert` model keeps the schema lean and queries highly performant.

2. **Atomic Operations (Transactions):**
   - **Decision:** The update to the `Alert` model and the creation of the `AuditLog` entry are executed within a Prisma `$transaction`.
   - **Justification:** This ensures atomicity. If generating the audit log fails, the alert will not be marked as acknowledged. This guarantees data integrity and consistency between state and audit trails.

3. **Modular Architecture:**
   - **Decision:** Created a new `AcknowledgementsModule` encapsulated within an `AlertsModule`.
   - **Justification:** Follows NestJS best practices and the existing monorepo structure outlined in `ARCHITECTURE.md`. It separates the core alert logic from specific lifecycle operations like acknowledgements, making the system easier to test and extend.

## Complexity Analysis

### Time Complexity

- **Database Query (Read):** `O(1)` - Primary key lookup to verify the alert exists.
- **Database Update + Insert (Transaction):** `O(1)` - Updating a single row by its indexed primary key and inserting a single row into the audit log.
- **Overall Time Complexity:** `O(1)`. The implementation scales linearly and performance will not degrade as the number of alerts grows, assuming standard B-Tree indexing on the primary keys.

### Space Complexity

- **Application Memory:** `O(1)` - Memory footprint is restricted to processing a single DTO and response payload at a time. No unbounded arrays or loops are introduced.
- **Database Storage:** `O(1)` per operation - Two lightweight columns added to the `Alert` model (`DateTime` and `String`) and one new row inserted into `AuditLog` per acknowledgement.

## Code Explanations

### `acknowledgements.service.ts`

The core business logic resides here.

1. `acknowledgeAlert` checks if the alert exists. If not, it throws a `NotFoundException`.
2. It checks if `acknowledgedAt` is already set. If so, it throws a `BadRequestException` to prevent duplicate processing.
3. A `$transaction` is executed to atomically:
   - Update `acknowledgedAt` to the current timestamp.
   - Update `acknowledgedBy` to the `reviewerId`.
   - Create an `AuditLog` entry with action `ALERT_ACKNOWLEDGED`, associating the actor and the `alertId`.

### `acknowledgements.controller.ts`

Exposes the functionality over HTTP.

- Uses `@Post(':id/acknowledge')` routing.
- Uses `@HttpCode(HttpStatus.OK)` since it's an RPC-style action over a resource rather than a pure resource creation (201).
- Extracts the `:id` parameter and the `AcknowledgeAlertDto` from the request body.

# AgriSmart Firestore Security Specification (Phase 0 TDD & Phase 5 Audit)

## 1. Data Invariants
1. **Default Deny**: All paths not explicitly matched (`/specimens/{specimenId}` and `/fieldReports/{reportId}`) are strictly denied.
2. **Verified Identity Invariant**: Every write operation (`create`, `update`, `delete`) requires `request.auth != null` and `request.auth.token.email_verified == true`.
3. **Ownership Invariant**: Every document in `/specimens/{specimenId}` and `/fieldReports/{reportId}` must have `ownerId == request.auth.uid`. Reads (`get`, `list`) are strictly restricted to documents where `resource.data.ownerId == request.auth.uid`.
4. **Strict Key & Size Blueprint**: Every string field enforces explicit `.size() >= min && .size() <= max` bounds matching `firebase-blueprint.json`. No shadow/ghost fields are permitted (`hasAll` + `hasOnly`).
5. **Temporal & Immutable Integrity**: On `create`, `createdAt == request.time` and `updatedAt == request.time`. On `update`, `createdAt == resource.data.createdAt`, `ownerId == resource.data.ownerId`, and `updatedAt == request.time`.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Unauthenticated Create**: Creating a `/specimens/spec_1` document with `auth == null` -> `PERMISSION_DENIED`.
2. **Unverified Email Spoof**: Creating a `/specimens/spec_1` document where `auth.token.email_verified == false` -> `PERMISSION_DENIED`.
3. **Cross-User Ownership Spoof**: Authenticated user `user_A` creating `/specimens/spec_1` with `ownerId: "user_B"` -> `PERMISSION_DENIED`.
4. **Shadow Field Injection**: Creating `/specimens/spec_1` with an extra undeclared field `isAdmin: true` -> `PERMISSION_DENIED`.
5. **ID Poisoning Attack**: Creating a specimen with a 250-character document ID or invalid characters (`spec$bad!`) -> `PERMISSION_DENIED`.
6. **Denial-of-Wallet Oversized String**: Setting `editorialSummary` to a 10,000-character string (`> 2000` limit) -> `PERMISSION_DENIED`.
7. **Client Timestamp Forgery on Create**: Setting `createdAt` to a past or future timestamp instead of `request.time` -> `PERMISSION_DENIED`.
8. **Immutable Field Mutation on Update**: Updating `ownerId` or `createdAt` on an existing `/specimens/{specimenId}` document -> `PERMISSION_DENIED`.
9. **Unauthorized Partial Update**: Updating `scientificName` during an irrigation update action that only permits `['lastWateredDate', 'nextWateringDueDays', 'updatedAt']` -> `PERMISSION_DENIED`.
10. **Value Poisoning on Update**: Updating `nextWateringDueDays` with a string `"seven"` instead of an integer bounded `0..365` -> `PERMISSION_DENIED`.
11. **Cross-Tenant List Scraping**: Executing a blanket `list` query on `/specimens` without filtering `where('ownerId', '==', auth.uid)` -> `PERMISSION_DENIED`.
12. **Cross-Tenant FieldReport Read/Delete**: User `user_A` attempting `get` or `delete` on `/fieldReports/rep_B` owned by `user_B` -> `PERMISSION_DENIED`.

## 3. Phase 5 Red Team Conflict Report
- **Identity Spoofing**: Blocked by `data.ownerId == request.auth.uid` on create and `incoming().ownerId == existing().ownerId` on update.
- **State Shortcutting / Unauthorized Field Mutation**: Blocked by Action-Based `incoming().diff(existing()).affectedKeys().hasOnly(...)` combined with `isValidFarmSpecimen(incoming())`.
- **Resource Poisoning**: Blocked by `isValidId()` regex/length guard on all single-document path variables and `.size()` limits on every string field.
- **Value Poisoning**: Blocked because `isValidFarmSpecimen(incoming())` and `isValidFieldReport(incoming())` wrap the entire `allow update` expression.

/**
 * AgriSmart Firestore Security Rules Verification Suite (Dirty Dozen Payloads)
 */
export interface DirtyDozenAssertion {
  id: number;
  name: string;
  collection: string;
  operation: 'create' | 'update' | 'get' | 'list' | 'delete';
  expectedOutcome: 'PERMISSION_DENIED';
  payload: Record<string, unknown>;
}

export const DIRTY_DOZEN_TESTS: DirtyDozenAssertion[] = [
  {
    id: 1,
    name: 'Unauthenticated Create on /specimens',
    collection: '/specimens/spec_01',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    payload: { ownerId: 'anon', commonName: 'Maize' },
  },
  {
    id: 2,
    name: 'Unverified Email Spoof on /specimens',
    collection: '/specimens/spec_01',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    payload: { ownerId: 'user_1', email_verified: false },
  },
  {
    id: 3,
    name: 'Cross-User Ownership Spoof',
    collection: '/specimens/spec_01',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    payload: { ownerId: 'victim_uid' },
  },
  {
    id: 4,
    name: 'Shadow Field Injection (isAdmin: true)',
    collection: '/specimens/spec_01',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    payload: { ownerId: 'user_1', isAdmin: true },
  },
  {
    id: 5,
    name: 'ID Poisoning Attack (Invalid characters in doc ID)',
    collection: '/specimens/bad$id!',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    payload: { ownerId: 'user_1' },
  },
  {
    id: 6,
    name: 'Denial-of-Wallet Oversized String (>2000 chars)',
    collection: '/specimens/spec_01',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    payload: { editorialSummary: 'A'.repeat(2500) },
  },
  {
    id: 7,
    name: 'Client Timestamp Forgery on Create',
    collection: '/specimens/spec_01',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    payload: { createdAt: '2020-01-01T00:00:00Z' },
  },
  {
    id: 8,
    name: 'Immutable Field Mutation (ownerId / createdAt) on Update',
    collection: '/specimens/spec_01',
    operation: 'update',
    expectedOutcome: 'PERMISSION_DENIED',
    payload: { ownerId: 'attacker_uid' },
  },
  {
    id: 9,
    name: 'Unauthorized Partial Update (scientificName mutation)',
    collection: '/specimens/spec_01',
    operation: 'update',
    expectedOutcome: 'PERMISSION_DENIED',
    payload: { scientificName: 'Hacked species' },
  },
  {
    id: 10,
    name: 'Value Poisoning on Update (nextWateringDueDays as string)',
    collection: '/specimens/spec_01',
    operation: 'update',
    expectedOutcome: 'PERMISSION_DENIED',
    payload: { nextWateringDueDays: 'seven' },
  },
  {
    id: 11,
    name: 'Blanket Unfiltered List Scraping on /specimens',
    collection: '/specimens',
    operation: 'list',
    expectedOutcome: 'PERMISSION_DENIED',
    payload: {},
  },
  {
    id: 12,
    name: 'Cross-Tenant FieldReport Read/Delete',
    collection: '/fieldReports/rep_other',
    operation: 'get',
    expectedOutcome: 'PERMISSION_DENIED',
    payload: {},
  },
];

/**
 * Mock fixtures for Mongo M0 Health panel (CALOPS-49).
 * Shape matches the contract in CALBEAF-106 (Fulton's endpoint spec).
 * Swap to live fetch by flipping `mongoM0Health.useMockData` → false in costs-config.json.
 *
 * Three states exercised: baseline (green), watch (yellow), throttling (red).
 * Set fixture via `?mockState=baseline|watch|throttling` query param on /dashboard/costs.
 */

export const BASELINE_FIXTURE = {
  capturedAt: '2026-04-14T18:00:00Z',
  dbStats: {
    dataSize: 78_643_200,
    storageSize: 94_371_840,
    indexSize: 12_582_912,
    objects: 52_481
  },
  connections: {
    current: 47,
    available: 453,
    totalCreated: 18_234
  },
  opcounters: {
    windowSec: 60,
    insertPerSec: 0.1,
    queryPerSec: 4.2,
    updatePerSec: 0.3,
    deletePerSec: 0.05,
    getmorePerSec: 1.1,
    commandPerSec: 6.8,
    totalPerSec: 12.55
  },
  replication: {
    primaryOptime: '2026-04-14T18:00:00Z',
    maxSecondaryLagSec: 1
  },
  perCollection: [
    { name: 'events', sizeBytes: 32_505_856, count: 18_420, nindexes: 7 },
    { name: 'organizers', sizeBytes: 14_680_064, count: 1_247, nindexes: 5 },
    { name: 'venues', sizeBytes: 9_437_184, count: 892, nindexes: 4 },
    { name: 'userLogins', sizeBytes: 7_340_032, count: 68, nindexes: 3 },
    { name: 'regions', sizeBytes: 4_194_304, count: 15, nindexes: 2 },
    { name: 'cities', sizeBytes: 3_670_016, count: 2_341, nindexes: 3 },
    { name: 'categories', sizeBytes: 2_097_152, count: 47, nindexes: 2 },
    { name: 'roles', sizeBytes: 524_288, count: 5, nindexes: 2 },
    { name: 'auditLog', sizeBytes: 3_670_016, count: 8_920, nindexes: 3 },
    { name: 'applications', sizeBytes: 524_288, count: 3, nindexes: 1 }
  ],
  slowOps: {
    p50Ms: 18,
    p95Ms: 42,
    p99Ms: 78,
    countAbove200_5min: 0,
    countAbove200_1hr: 1,
    countAbove200_24hr: 4
  }
};

export const WATCH_FIXTURE = {
  ...BASELINE_FIXTURE,
  capturedAt: '2026-04-14T18:05:00Z',
  dbStats: { ...BASELINE_FIXTURE.dbStats, dataSize: 380_000_000, storageSize: 390_000_000 },
  connections: { ...BASELINE_FIXTURE.connections, current: 340, available: 160 },
  opcounters: { ...BASELINE_FIXTURE.opcounters, queryPerSec: 35, commandPerSec: 42, totalPerSec: 78 },
  slowOps: {
    p50Ms: 28,
    p95Ms: 180,
    p99Ms: 310,
    countAbove200_5min: 7,
    countAbove200_1hr: 38,
    countAbove200_24hr: 120
  }
};

export const THROTTLING_FIXTURE = {
  ...BASELINE_FIXTURE,
  capturedAt: '2026-04-14T18:10:00Z',
  dbStats: { ...BASELINE_FIXTURE.dbStats, dataSize: 470_000_000, storageSize: 485_000_000 },
  connections: { ...BASELINE_FIXTURE.connections, current: 460, available: 40 },
  opcounters: { ...BASELINE_FIXTURE.opcounters, queryPerSec: 60, commandPerSec: 55, totalPerSec: 118 },
  replication: { ...BASELINE_FIXTURE.replication, maxSecondaryLagSec: 85 },
  slowOps: {
    p50Ms: 85,
    p95Ms: 620,
    p99Ms: 1_240,
    countAbove200_5min: 34,
    countAbove200_1hr: 290,
    countAbove200_24hr: 1_850
  }
};

export function getFixtureFor(state) {
  switch (state) {
    case 'watch': return WATCH_FIXTURE;
    case 'throttling': return THROTTLING_FIXTURE;
    case 'baseline':
    default: return BASELINE_FIXTURE;
  }
}

/**
 * Mock fixtures for Mongo M0 Health panel (CALOPS-49).
 * Shape matches the CALBEAF-106 endpoint contract as shipped 2026-04-14.
 *
 * M0 free tier limitation: the `TangoTiempoBE` Mongo user cannot call
 * serverStatus or replSetGetStatus. So `connections`, `opcounters`, and
 * `replication` come back stubbed at zero / null on real M0, with a note
 * in notes[] explaining why. `slowOps` is also stubbed pending
 * Application Insights integration.
 *
 * Three mock states via ?mockState=baseline|watch|throttling.
 * baseline reflects real M0 reality (partial data). watch/throttling
 * simulate M2+ where serverStatus is available — useful for previewing
 * how the panel looks when the data is fully populated.
 */

const M0_NOTES = [
  'connections: unavailable on M0 free tier — TangoTiempoBE user lacks serverStatus privilege',
  'opcounters: unavailable on M0 free tier — TangoTiempoBE user lacks serverStatus privilege',
  'replication: unavailable on M0 free tier — TangoTiempoBE user lacks replSetGetStatus privilege',
  'slowOps: stubbed at zero — Application Insights integration pending'
];

export const BASELINE_FIXTURE = {
  capturedAt: '2026-04-14T20:00:00Z',
  dbStats: {
    dataSize: 78_643_200,
    storageSize: 94_371_840,
    indexSize: 12_582_912,
    objects: 52_481
  },
  connections: { current: 0, available: 0, totalCreated: 0 },
  opcounters: {
    windowSec: 60,
    insertPerSec: 0, queryPerSec: 0, updatePerSec: 0, deletePerSec: 0,
    getmorePerSec: 0, commandPerSec: 0, totalPerSec: 0
  },
  replication: { primaryOptime: null, maxSecondaryLagSec: null },
  perCollection: [
    { name: 'events', sizeBytes: 32_505_856, count: 18_420, nindexes: 7 },
    { name: 'organizers', sizeBytes: 14_680_064, count: 1_247, nindexes: 5 },
    { name: 'venues', sizeBytes: 9_437_184, count: 892, nindexes: 4 },
    { name: 'userLogins', sizeBytes: 7_340_032, count: 68, nindexes: 3 },
    { name: 'regions', sizeBytes: 4_194_304, count: 15, nindexes: 2 },
    { name: 'cities', sizeBytes: 3_670_016, count: 2_341, nindexes: 3 },
    { name: 'categories', sizeBytes: 2_097_152, count: 47, nindexes: 2 },
    { name: 'auditLog', sizeBytes: 3_670_016, count: 8_920, nindexes: 3 },
    { name: 'roles', sizeBytes: 524_288, count: 5, nindexes: 2 },
    { name: 'applications', sizeBytes: 524_288, count: 3, nindexes: 1 }
  ],
  slowOps: {
    p50Ms: 0, p95Ms: 0, p99Ms: 0,
    countAbove200_5min: 0, countAbove200_1hr: 0, countAbove200_24hr: 0
  },
  notes: M0_NOTES
};

const RICH_CONNECTIONS = { current: 340, available: 160, totalCreated: 18_234 };
const RICH_OPCOUNTERS = {
  windowSec: 60,
  insertPerSec: 0.1, queryPerSec: 35, updatePerSec: 0.3, deletePerSec: 0.05,
  getmorePerSec: 1.1, commandPerSec: 42, totalPerSec: 78.55
};
const RICH_REPL_OK = { primaryOptime: '2026-04-14T20:00:00Z', maxSecondaryLagSec: 1 };

export const WATCH_FIXTURE = {
  ...BASELINE_FIXTURE,
  capturedAt: '2026-04-14T20:05:00Z',
  dbStats: { ...BASELINE_FIXTURE.dbStats, dataSize: 380_000_000, storageSize: 390_000_000 },
  connections: RICH_CONNECTIONS,
  opcounters: RICH_OPCOUNTERS,
  replication: RICH_REPL_OK,
  slowOps: {
    p50Ms: 28, p95Ms: 180, p99Ms: 310,
    countAbove200_5min: 7, countAbove200_1hr: 38, countAbove200_24hr: 120
  },
  notes: ['Preview: M2+ tier with full serverStatus access — all gauges live']
};

export const THROTTLING_FIXTURE = {
  ...BASELINE_FIXTURE,
  capturedAt: '2026-04-14T20:10:00Z',
  dbStats: { ...BASELINE_FIXTURE.dbStats, dataSize: 470_000_000, storageSize: 485_000_000 },
  connections: { current: 460, available: 40, totalCreated: 52_100 },
  opcounters: {
    windowSec: 60,
    insertPerSec: 0.5, queryPerSec: 60, updatePerSec: 1, deletePerSec: 0.1,
    getmorePerSec: 2, commandPerSec: 55, totalPerSec: 118.6
  },
  replication: { primaryOptime: '2026-04-14T20:08:35Z', maxSecondaryLagSec: 85 },
  slowOps: {
    p50Ms: 85, p95Ms: 620, p99Ms: 1_240,
    countAbove200_5min: 34, countAbove200_1hr: 290, countAbove200_24hr: 1_850
  },
  notes: ['Preview: M2+ tier simulating throttling — upgrade-now recommendation should fire']
};

export function getFixtureFor(state) {
  switch (state) {
    case 'watch': return WATCH_FIXTURE;
    case 'throttling': return THROTTLING_FIXTURE;
    case 'baseline':
    default: return BASELINE_FIXTURE;
  }
}

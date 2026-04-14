/**
 * Pure health calculations for Mongo M0 panel.
 * No React, no fetch — just config + health data → derived UI state.
 * Unit-testable; matches thresholds in MasterCalendar/docs/MONGO-M0-BASELINE.md §4–5.
 *
 * Handles M0 free-tier reality: several response blocks (connections,
 * opcounters, replication, slowOps) may come back stubbed/zero because the
 * TangoTiempoBE Mongo user lacks serverStatus / replSetGetStatus privilege
 * on M0. Unavailable gauges render gray ("— M0 limit") instead of false-green.
 */

export const LEVELS = {
  CLEAN: 'clean',
  WATCH: 'watch',
  CRIT: 'crit',
  UNAVAILABLE: 'unavailable',
  UNKNOWN: 'unknown'
};

function band(pct, warnPct, critPct) {
  if (pct == null || Number.isNaN(pct)) return LEVELS.UNKNOWN;
  if (pct >= critPct) return LEVELS.CRIT;
  if (pct >= warnPct) return LEVELS.WATCH;
  return LEVELS.CLEAN;
}

/**
 * Parse notes[] (array of strings OR structured objects) into a
 * block-availability map. Accepts both shapes so Fulton can upgrade
 * the endpoint from string → structured without breaking the UI.
 */
export function parseNotes(notes) {
  const status = {
    connections: 'ok',
    opcounters: 'ok',
    replication: 'ok',
    slowOps: 'ok'
  };
  if (!Array.isArray(notes)) return status;

  for (const n of notes) {
    if (typeof n === 'string') {
      const s = n.toLowerCase();
      if (s.includes('serverstatus') || s.includes('connections')) status.connections = 'unavailable';
      if (s.includes('serverstatus') || s.includes('opcounters')) status.opcounters = 'unavailable';
      if (s.includes('replication') || s.includes('replsetgetstatus')) status.replication = 'unavailable';
      if (s.includes('slowops') || s.includes('app insights') || s.includes('appinsights')) status.slowOps = 'stubbed';
    } else if (n && typeof n === 'object' && n.block) {
      if (status[n.block] !== undefined) status[n.block] = n.status || 'unavailable';
    }
  }
  return status;
}

function unavailableGauge(label) {
  return { label, value: null, cap: null, pct: null, level: LEVELS.UNAVAILABLE, display: '— (M0 limit)' };
}

export function calcStorageGauge(health, limits) {
  const used = health?.dbStats?.dataSize ?? 0;
  const cap = limits.storageBytes;
  const pct = (used / cap) * 100;
  return {
    label: 'Disk Usage',
    value: used, cap, pct,
    level: band(pct, limits.storageWarnPct, limits.storageCritPct),
    display: `${(used / 1024 / 1024).toFixed(0)} MB / ${(cap / 1024 / 1024).toFixed(0)} MB`
  };
}

export function calcConnectionsGauge(health, limits, blockStatus) {
  if (blockStatus?.connections !== 'ok') return unavailableGauge('Connections');
  const used = health?.connections?.current ?? 0;
  const cap = limits.maxConnections;
  const pct = (used / cap) * 100;
  return {
    label: 'Connections',
    value: used, cap, pct,
    level: band(pct, limits.connectionsWarnPct, limits.connectionsCritPct),
    display: `${used} / ${cap}`
  };
}

export function calcOpsGauge(health, limits, blockStatus) {
  if (blockStatus?.opcounters !== 'ok') return unavailableGauge('Ops/sec');
  const used = health?.opcounters?.totalPerSec ?? 0;
  const cap = limits.sustainedOpsPerSec;
  const pct = (used / cap) * 100;
  return {
    label: 'Ops/sec',
    value: used, cap, pct,
    level: band(pct, limits.opsWarnPct, limits.opsCritPct),
    display: `${used.toFixed(1)} / ~${cap} ops/sec`
  };
}

export function calcReplicationGauge(health, limits, blockStatus) {
  if (blockStatus?.replication !== 'ok') return unavailableGauge('Replication Lag');
  const lag = health?.replication?.maxSecondaryLagSec;
  if (lag == null) return unavailableGauge('Replication Lag');

  let level = LEVELS.CLEAN;
  if (lag >= limits.replicationLagSecCrit) level = LEVELS.CRIT;
  else if (lag >= limits.replicationLagSecWarn) level = LEVELS.WATCH;
  return {
    label: 'Replication Lag',
    value: lag, cap: limits.replicationLagSecCrit,
    pct: (lag / limits.replicationLagSecCrit) * 100,
    level,
    display: `${lag}s`
  };
}

/**
 * Throttling proxy — key signal per Toby (2026-04-14).
 * On M0, slowOps may be stubbed pending App Insights wiring. When stubbed,
 * render the badge as UNAVAILABLE (gray) rather than falsely green.
 */
export function calcThrottlingBadge(health, proxy, blockStatus) {
  if (blockStatus?.slowOps && blockStatus.slowOps !== 'ok') {
    return {
      label: 'Throttling Proxy',
      level: LEVELS.UNAVAILABLE,
      p95: null,
      slow5: null,
      reason: 'Slow-op metrics unavailable — App Insights integration pending'
    };
  }

  const p95 = health?.slowOps?.p95Ms ?? 0;
  const slow5 = health?.slowOps?.countAbove200_5min ?? 0;

  let level = LEVELS.CLEAN;
  if (p95 >= proxy.p95CritMs || slow5 >= proxy.slowOp5minCrit) level = LEVELS.CRIT;
  else if (p95 >= proxy.p95WatchMs || slow5 >= proxy.slowOp5minWatch) level = LEVELS.WATCH;

  return {
    label: 'Throttling Proxy',
    level,
    p95,
    slow5,
    reason:
      level === LEVELS.CRIT
        ? `p95 ${p95}ms (>= ${proxy.p95CritMs}ms) or ${slow5} slow ops in 5min (>= ${proxy.slowOp5minCrit}) — M0 is throttling`
        : level === LEVELS.WATCH
        ? `p95 ${p95}ms rising from baseline ${proxy.baselineP95Ms}ms, or ${slow5} slow ops/5min — contention starting`
        : `p95 ${p95}ms within baseline, no slow-op spike — clean`
  };
}

/**
 * Upgrade recommendation per MONGO-M0-BASELINE.md §7.
 * Unavailable gauges do not trigger upgrade recs (they carry no signal).
 */
export function calcUpgradeRecommendation(gauges, badge, tierLadder, triggers, currentTier = 'M0') {
  const signalGauges = gauges.filter(g => g.level !== LEVELS.UNAVAILABLE && g.level !== LEVELS.UNKNOWN);
  const badgeCounts = badge.level !== LEVELS.UNAVAILABLE && badge.level !== LEVELS.UNKNOWN;

  const critical =
    signalGauges.some(g => g.level === LEVELS.CRIT) ||
    (badgeCounts && badge.level === LEVELS.CRIT);
  const watching =
    signalGauges.some(g => g.level === LEVELS.WATCH) ||
    (badgeCounts && badge.level === LEVELS.WATCH);

  if (!critical && !watching) return null;

  const currentIdx = tierLadder.findIndex(t => t.tier === currentTier);
  const nextTier = tierLadder[currentIdx + 1];
  if (!nextTier) return null;

  const current = tierLadder[currentIdx];
  const delta = nextTier.monthlyCost - current.monthlyCost;

  const firedGauge =
    signalGauges.find(g => g.level === LEVELS.CRIT) ||
    signalGauges.find(g => g.level === LEVELS.WATCH);
  const trigger = triggers.find(t => t.from === currentTier && t.to === nextTier.tier);

  return {
    urgency: critical ? 'now' : 'plan',
    from: current,
    to: nextTier,
    costDelta: delta,
    firedBy: firedGauge?.label || badge.label,
    rationale: trigger?.when || 'Threshold breached'
  };
}

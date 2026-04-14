/**
 * Pure health calculations for Mongo M0 panel.
 * No React, no fetch — just config + health data → derived UI state.
 * Unit-testable; matches thresholds in MasterCalendar/docs/MONGO-M0-BASELINE.md §4–5.
 */

export const LEVELS = { CLEAN: 'clean', WATCH: 'watch', CRIT: 'crit', UNKNOWN: 'unknown' };

function band(pct, warnPct, critPct) {
  if (pct == null || Number.isNaN(pct)) return LEVELS.UNKNOWN;
  if (pct >= critPct) return LEVELS.CRIT;
  if (pct >= warnPct) return LEVELS.WATCH;
  return LEVELS.CLEAN;
}

export function calcStorageGauge(health, limits) {
  const used = health?.dbStats?.dataSize ?? 0;
  const cap = limits.storageBytes;
  const pct = (used / cap) * 100;
  return {
    label: 'Disk Usage',
    value: used,
    cap,
    pct,
    level: band(pct, limits.storageWarnPct, limits.storageCritPct),
    display: `${(used / 1024 / 1024).toFixed(0)} MB / ${(cap / 1024 / 1024).toFixed(0)} MB`
  };
}

export function calcConnectionsGauge(health, limits) {
  const used = health?.connections?.current ?? 0;
  const cap = limits.maxConnections;
  const pct = (used / cap) * 100;
  return {
    label: 'Connections',
    value: used,
    cap,
    pct,
    level: band(pct, limits.connectionsWarnPct, limits.connectionsCritPct),
    display: `${used} / ${cap}`
  };
}

export function calcOpsGauge(health, limits) {
  const used = health?.opcounters?.totalPerSec ?? 0;
  const cap = limits.sustainedOpsPerSec;
  const pct = (used / cap) * 100;
  return {
    label: 'Ops/sec',
    value: used,
    cap,
    pct,
    level: band(pct, limits.opsWarnPct, limits.opsCritPct),
    display: `${used.toFixed(1)} / ~${cap} ops/sec`
  };
}

export function calcReplicationGauge(health, limits) {
  const lag = health?.replication?.maxSecondaryLagSec ?? 0;
  let level = LEVELS.CLEAN;
  if (lag >= limits.replicationLagSecCrit) level = LEVELS.CRIT;
  else if (lag >= limits.replicationLagSecWarn) level = LEVELS.WATCH;
  return {
    label: 'Replication Lag',
    value: lag,
    cap: limits.replicationLagSecCrit,
    pct: (lag / limits.replicationLagSecCrit) * 100,
    level,
    display: `${lag}s`
  };
}

/**
 * Throttling proxy — the key signal per Toby (2026-04-14).
 * Atlas M0 has no API for the "Operation Throttling" graph, so we proxy via
 * p95 latency + count of ops >200ms. When these rise without traffic rising, M0 is contended.
 */
export function calcThrottlingBadge(health, proxy) {
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
 * Returns the next tier + delta + specific trigger that fired, or null if clean.
 */
export function calcUpgradeRecommendation(gauges, badge, tierLadder, triggers, currentTier = 'M0') {
  const critical = gauges.some(g => g.level === LEVELS.CRIT) || badge.level === LEVELS.CRIT;
  const watching = gauges.some(g => g.level === LEVELS.WATCH) || badge.level === LEVELS.WATCH;

  if (!critical && !watching) return null;

  const currentIdx = tierLadder.findIndex(t => t.tier === currentTier);
  const nextTier = tierLadder[currentIdx + 1];
  if (!nextTier) return null;

  const current = tierLadder[currentIdx];
  const delta = nextTier.monthlyCost - current.monthlyCost;

  const firedGauge = gauges.find(g => g.level === LEVELS.CRIT) || gauges.find(g => g.level === LEVELS.WATCH);
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

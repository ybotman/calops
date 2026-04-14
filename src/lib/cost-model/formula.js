/**
 * Parametric cost model — MessageHub/docs/METRICS_COST_MODEL.md §5 formula.
 *
 * Given input parameters (§3) and unit costs (§4), returns a line-item cost breakdown.
 * Pure function — unit-testable, no side effects.
 *
 * Input contract:
 *   inputs: { M, mau, conc, idle, idleSavings, mpm, rMsg, rpm,
 *             convN, convC, convH, niches, imgPct, imgKb }
 *   units:  { signalrConnMinute, signalrMessage, signalrFreeMsgsPerMonth,
 *             fnInvocation, fnGbSecond, fnFreeExecPerMo,
 *             mongoTierLadder: [{tier, monthlyCost, storageGb, maxMembers}],
 *             blobGbMonth, bandwidthGb }
 */

const MIN_PER_MONTH = 43_200;

function pickMongoTier(memberCount, ladder) {
  for (const t of ladder) {
    if (memberCount <= t.maxMembers) return t;
  }
  return ladder[ladder.length - 1];
}

export function computeMonthlyCost(inputs, units) {
  const {
    M, mau, conc, idleSavings,
    mpm, rMsg, rpm,
    convN, convC, convH,
    imgPct, imgKb
  } = inputs;

  const activeUsers = M * mau;
  const avgConcurrent = activeUsers * conc;

  const connectedMinutes = activeUsers * conc * MIN_PER_MONTH * (1 - idleSavings);
  const signalrConnCost = connectedMinutes * units.signalrConnMinute;

  const messagesSent = activeUsers * mpm;
  const messageDeliveries = messagesSent * rMsg;
  const billableDeliveries = Math.max(0, messageDeliveries - units.signalrFreeMsgsPerMonth);
  const signalrMsgCost = billableDeliveries * units.signalrMessage;

  const functionReads = messagesSent * rpm;
  const functionWrites = messagesSent;
  const billableFnCalls = Math.max(0, functionReads + functionWrites - units.fnFreeExecPerMo);
  const functionCost = billableFnCalls * units.fnInvocation;

  const storageBytesPerMonth =
    messagesSent * 12 * 1024 +
    activeUsers * mpm * imgPct * imgKb * 1024;
  const storageGb = storageBytesPerMonth / (1024 * 1024 * 1024);
  const storageCost = storageGb * units.blobGbMonth;

  const mongoTier = pickMongoTier(M, units.mongoTierLadder);
  const mongoTierCost = mongoTier.monthlyCost;

  const convConnMinutes = convN * convC * convH * 60;
  const convCostAnnual = convConnMinutes * units.signalrConnMinute;
  const convCostMonthly = convCostAnnual / 12;

  const total =
    signalrConnCost +
    signalrMsgCost +
    functionCost +
    storageCost +
    mongoTierCost +
    convCostMonthly;

  return {
    derived: { activeUsers, avgConcurrent, messagesSent, messageDeliveries, storageGb },
    lines: [
      { id: 'signalr_conn', label: 'SignalR connection-minutes', cost: signalrConnCost,
        detail: `${connectedMinutes.toLocaleString(undefined, {maximumFractionDigits: 0})} conn-min` },
      { id: 'signalr_msg', label: 'SignalR messages (above free tier)', cost: signalrMsgCost,
        detail: messageDeliveries > units.signalrFreeMsgsPerMonth
          ? `${billableDeliveries.toLocaleString(undefined, {maximumFractionDigits: 0})} billable`
          : `${messageDeliveries.toLocaleString(undefined, {maximumFractionDigits: 0})} in free tier` },
      { id: 'functions', label: 'Azure Functions', cost: functionCost,
        detail: billableFnCalls > 0
          ? `${billableFnCalls.toLocaleString(undefined, {maximumFractionDigits: 0})} billable invocations`
          : 'in free tier' },
      { id: 'storage', label: 'Blob storage + messages', cost: storageCost,
        detail: `${storageGb.toFixed(2)} GB` },
      { id: 'mongo', label: `MongoDB Atlas (${mongoTier.tier})`, cost: mongoTierCost,
        detail: `${mongoTier.storageGb}GB tier, up to ${mongoTier.maxMembers.toLocaleString()} members` },
      { id: 'conv', label: 'Convention spikes (amortized)', cost: convCostMonthly,
        detail: `${convN}× ${convC.toLocaleString()} concurrent × ${convH}h/yr` }
    ],
    total,
    mongoTier
  };
}

export const INPUT_DEFAULTS = {
  M: 20000, mau: 0.5, conc: 0.05, idle: 15, idleSavings: 0.4,
  mpm: 30, rMsg: 15, rpm: 50,
  convN: 2, convC: 4000, convH: 48,
  niches: 1, imgPct: 0.05, imgKb: 200
};

export const PRESETS = [
  { id: 'poc',    label: 'POC (100 members)',             M: 100,   mau: 0.5, conc: 0.03, mpm: 30 },
  { id: 'small',  label: 'Small niche (500)',             M: 500,   mau: 0.5, conc: 0.05, mpm: 30 },
  { id: 'medium', label: 'Medium niche (5K)',             M: 5000,  mau: 0.5, conc: 0.05, mpm: 30 },
  { id: 'bhs',    label: 'BHS full scale (20K)',          M: 20000, mau: 0.5, conc: 0.05, mpm: 30 },
  { id: 'multi',  label: 'Multi-niche (75K across 3)',    M: 75000, mau: 0.5, conc: 0.05, mpm: 30 },
  { id: 'big',    label: '500K / 10 niches',              M: 500000, mau: 0.5, conc: 0.05, mpm: 30 }
];

export const INPUT_SCHEMA = [
  { key: 'M',           label: 'Total members',             unit: 'count',  min: 1,    max: 10_000_000, step: 100 },
  { key: 'mau',         label: 'Monthly active fraction',   unit: 'ratio',  min: 0,    max: 1,          step: 0.01 },
  { key: 'conc',        label: 'Avg concurrent / MAU',      unit: 'ratio',  min: 0,    max: 1,          step: 0.01 },
  { key: 'idleSavings', label: 'Idle-disconnect savings',   unit: 'ratio',  min: 0,    max: 1,          step: 0.05 },
  { key: 'mpm',         label: 'Messages / MAU / month',    unit: 'count',  min: 0,    max: 1000,       step: 1 },
  { key: 'rMsg',        label: 'Recipients / message',      unit: 'count',  min: 1,    max: 10_000,     step: 1 },
  { key: 'rpm',         label: 'Reads / message sent',      unit: 'count',  min: 0,    max: 1000,       step: 1 },
  { key: 'convN',       label: 'Convention events / year',  unit: 'count',  min: 0,    max: 52,         step: 1 },
  { key: 'convC',       label: 'Convention peak concurrent',unit: 'count',  min: 0,    max: 100_000,    step: 100 },
  { key: 'convH',       label: 'Convention duration',       unit: 'hours',  min: 0,    max: 168,        step: 1 },
  { key: 'imgPct',      label: 'Messages w/ attachment',    unit: 'ratio',  min: 0,    max: 1,          step: 0.01 },
  { key: 'imgKb',       label: 'Avg attachment size',       unit: 'KB',     min: 0,    max: 10_000,     step: 10 }
];

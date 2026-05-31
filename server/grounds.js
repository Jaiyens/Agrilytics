// The farm-grounds view: one focal farm, its block split into a grid of "courts",
// and the workers on it. Everything here is demo/mock data ("what it looks like").
// In production: court status comes from logged applications + REI clocks, and worker
// positions come from the devices in the field. The client (src/components/courts.js)
// generates the court polygon geometry from `gridSpec`; this file owns the *meaning*
// of each court (what was applied, who's there) — same split as farms.js / reference.js.

// One focal block over real farm ground south of Fresno. The satellite shows ~16 farm
// squares around the center; we split each into 16 -> a 16 x 16 grid of "courts".
// 16 x 16 of 15m cells = 240m x 240m = ~14.2 acres, ~18 courts/acre.
// originLat/originLng is the block CENTER and the SINGLE SOURCE OF TRUTH for the whole
// overlay — the court grid AND every worker pin are computed as offsets from it
// (see src/components/courts.js), so moving the center moves everything together.
const GRID = {
  originLat: 36.52329404285175,
  originLng: -119.89950820671457,
  rotationDeg: 0, // Central Valley parcels are aligned to N/S section lines
  rows: 16,
  cols: 16,
  cellMeters: 15,
};

// Court id is `${row}-${col}`; label is column-letter + (row+1), e.g. "2-2" -> "C3".
function labelFor(id) {
  const [r, c] = id.split('-').map(Number);
  return String.fromCharCode(65 + c) + (r + 1);
}

const ACRES = +((GRID.rows * GRID.cols * GRID.cellMeters * GRID.cellMeters) / 4046.86).toFixed(1);

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// Courts that have been treated today. Everything not listed renders as `clear`.
// `restricted-rei` = treated with a Restricted Material whose re-entry interval is
// still running — a "do not enter" court. Ties to the restricted products in reference.js.
function buildStatusMap() {
  const date = todayISO();
  const map = {};
  // A contiguous run treated this morning, around the center of the block.
  const sprayed = [
    '6-6', '6-7', '6-8', '7-5', '7-6', '7-7', '7-8', '8-6', '8-7', '8-8',
    '9-7', '9-8', '5-9', '6-9', '10-4', '10-5', '11-4',
  ];
  for (const id of sprayed) {
    map[id] = {
      status: 'sprayed-today',
      lastApplication: {
        product: 'Roundup PowerMAX', epa: '524-549', ai: 'Glyphosate',
        rate: '2 qt/acre', acres: 0.06, time: '09:10', date,
        applicator: 'Jaiyen Shetty', restricted: false,
      },
    };
  }
  // A restricted-material block under an active REI — workers must stay out.
  for (const id of ['3-12', '3-13', '4-12']) {
    map[id] = {
      status: 'restricted-rei',
      lastApplication: {
        product: 'Lannate SP', epa: '352-384', ai: 'Methomyl',
        rate: '1 lb/acre', acres: 0.06, time: '07:40', date,
        applicator: 'Carlos M.', restricted: true, rei_hours: 48, rei_clears: 'in 46h',
      },
    };
  }
  return map;
}

// The workers on the block right now. Positions are derived on the client from
// `courtId` (so a pin sits on its court); `trail` is the recent path for the audit log.
// Three on-site applicators. Jaiyen Shetty is the primary/demo worker — the
// "simulate field capture" trigger fires for him (see src/components/FarmGrounds.jsx),
// using `captureSample` below as the record it reveals. Positions are offsets from the
// block center (derived on the client from `courtId`), so they move with the center.
const WORKERS = [
  {
    id: 'w1', name: 'Jaiyen Shetty', role: 'Applicator', device: 'online',
    primary: true,
    courtId: '7-7', trail: ['8-6', '7-7'],
    lastAction: 'Sprayed G7–H8 · Roundup PowerMAX · 6m ago',
    todayLog: [
      { time: '10:05', court: 'H8', action: 'Logged application · Roundup PowerMAX · 2 qt/acre' },
      { time: '08:50', court: 'G7', action: 'Entered block · device on' },
      { time: '08:35', court: '—', action: 'Shift start · checked in' },
    ],
    // Hardcoded record revealed when the field capture is simulated.
    captureSample: {
      product: 'Roundup PowerMAX',
      rate: '2 qt/acre',
      block: 'River 12',
      court: 'H8',
      time: '10:42',
      transcriptEs: 'Apliqué en el río doce, dos cuartos por acre de Roundup, a las nueve de la mañana.',
      transcriptEn: 'I applied Roundup on River 12, two quarts per acre, at nine in the morning.',
      flag: { field: 'Applicator name', note: 'not stated in the note — confirm before filing.' },
    },
  },
  {
    id: 'w2', name: 'Carlos M.', role: 'Applicator', device: 'online',
    courtId: '9-4', trail: ['10-4', '9-4'],
    lastAction: 'Spraying E10–E11 · in progress',
    todayLog: [
      { time: '09:30', court: 'E10', action: 'Application in progress · Roundup PowerMAX' },
      { time: '09:05', court: 'E10', action: 'Entered block · device on' },
      { time: '08:40', court: '—', action: 'Shift start · checked in' },
    ],
  },
  {
    id: 'w3', name: 'Devin P.', role: 'Crew lead', device: 'online',
    courtId: '5-10', trail: ['3-12', '4-11', '5-10'],
    lastAction: 'Walking the block · 1m ago',
    todayLog: [
      { time: '09:32', court: 'K6', action: 'Supervising · device on' },
      { time: '08:55', court: 'M4', action: 'Flagged REI block — keeping crew clear' },
      { time: '08:30', court: '—', action: 'Shift start · checked in crew of 3' },
    ],
  },
];

export const FOCAL_FARM = {
  name: 'Home Ranch Farms',
  operator: 'Mendez family',
  town: 'Fresno',
  crop: 'Almonds',
  block: {
    label: 'River 12',
    acres: ACRES,
    centerLat: GRID.originLat,
    centerLng: GRID.originLng,
    zoom: 17, // block (~240m) fills the frame at this zoom over hybrid imagery
    gridSpec: GRID,
  },
};

export function groundsData() {
  const statusMap = buildStatusMap();
  const treated = Object.keys(statusMap);
  const reiCount = treated.filter((id) => statusMap[id].status === 'restricted-rei').length;
  const stats = {
    workersOnline: WORKERS.filter((w) => w.device === 'online').length,
    workersTotal: WORKERS.length,
    courtsTreatedToday: treated.length,
    reiCourts: reiCount,
    acres: ACRES,
    // Every court treated today carries a complete, logged application -> 100% documented.
    compliancePct: 100,
  };
  return {
    farm: FOCAL_FARM,
    statusMap,
    workers: WORKERS,
    labels: Object.fromEntries(treated.map((id) => [id, labelFor(id)])),
    stats,
    // The Maps JS key is inherently client-visible (referrer-restricted), so handing it to
    // the client here is equivalent to inlining it — but it means the user only needs ONE
    // var in .env.local (no VITE_ prefix) and no rebuild when the key changes.
    mapsApiKey: process.env.GOOGLE_CLOUD_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY || '',
    mapsMapId: process.env.GOOGLE_CLOUD_MAP_ID || process.env.VITE_GOOGLE_MAPS_MAP_ID || '',
  };
}

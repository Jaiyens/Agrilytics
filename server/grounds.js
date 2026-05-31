// The farm-grounds view: one focal farm, its block split into a grid of "courts",
// and the workers on it. Everything here is demo/mock data ("what it looks like").
// In production: court status comes from logged applications + REI clocks, and worker
// positions come from the devices in the field. The client (src/components/courts.js)
// generates the court polygon geometry from `gridSpec`; this file owns the *meaning*
// of each court (what was applied, who's there) — same split as farms.js / reference.js.

// One focal block: ~6 rows x 8 cols of 18m cells = ~3.9 acres, ~12 courts/acre.
// originLat/originLng is the block CENTER; rotationDeg aligns the grid to the rows.
const GRID = {
  originLat: 36.7481,
  originLng: -119.7720,
  rotationDeg: 9,
  rows: 6,
  cols: 8,
  cellMeters: 18,
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
  const sprayed = ['0-2', '0-3', '1-2', '1-3', '1-4', '2-3', '2-4', '4-1', '4-2'];
  for (const id of sprayed) {
    map[id] = {
      status: 'sprayed-today',
      lastApplication: {
        product: 'Roundup PowerMAX', epa: '524-549', ai: 'Glyphosate',
        rate: '2 qt/acre', acres: 0.08, time: '09:10', date,
        applicator: 'Mendez crew', restricted: false,
      },
    };
  }
  // A restricted-material block under an active REI — workers must stay out.
  for (const id of ['3-6', '4-6']) {
    map[id] = {
      status: 'restricted-rei',
      lastApplication: {
        product: 'Lannate SP', epa: '352-384', ai: 'Methomyl',
        rate: '1 lb/acre', acres: 0.08, time: '07:40', date,
        applicator: 'Mendez crew', restricted: true, rei_hours: 48, rei_clears: 'in 46h',
      },
    };
  }
  return map;
}

// The workers on the block right now. Positions are derived on the client from
// `courtId` (so a pin sits on its court); `trail` is the recent path for the audit log.
const WORKERS = [
  {
    id: 'w1', name: 'Tomás R.', role: 'Applicator', device: 'online',
    courtId: '1-3', trail: ['3-1', '2-2', '2-3', '1-3'],
    lastAction: 'Sprayed C2–E2 · Roundup PowerMAX · 9m ago',
    todayLog: [
      { time: '09:18', court: 'D2', action: 'Logged application · Roundup PowerMAX · 2 qt/acre' },
      { time: '08:55', court: 'C3', action: 'Entered block · device on' },
      { time: '08:40', court: '—', action: 'Shift start · checked in' },
    ],
  },
  {
    id: 'w2', name: 'José M.', role: 'Applicator', device: 'online',
    courtId: '4-2', trail: ['4-1', '4-2'],
    lastAction: 'Spraying B5–C5 · in progress',
    todayLog: [
      { time: '09:30', court: 'B5', action: 'Application in progress · Roundup PowerMAX' },
      { time: '09:05', court: 'B5', action: 'Entered block · device on' },
    ],
  },
  {
    id: 'w3', name: 'Crew lead · Mendez', role: 'Foreman', device: 'online',
    courtId: '2-4', trail: ['0-0', '1-2', '2-4'],
    lastAction: 'Walking the block · 1m ago',
    todayLog: [
      { time: '09:32', court: 'E3', action: 'Supervising · device on' },
      { time: '08:30', court: 'A1', action: 'Shift start · checked in crew of 4' },
    ],
  },
  {
    id: 'w4', name: 'Luis G.', role: 'Irrigation', device: 'idle',
    courtId: '5-6', trail: ['5-7', '5-6'],
    lastAction: 'Logged irrigation · 38m ago',
    todayLog: [
      { time: '08:54', court: 'G6', action: 'Logged irrigation set' },
      { time: '08:20', court: 'H6', action: 'Entered block · device on' },
    ],
  },
  {
    id: 'w5', name: 'Marco V.', role: 'Applicator', device: 'offline',
    courtId: '0-6', trail: ['0-7', '0-6'],
    lastAction: 'Device offline · last seen 1h ago',
    todayLog: [
      { time: '08:25', court: 'H1', action: 'Device went offline — no location since' },
      { time: '07:50', court: 'G1', action: 'Entered block · device on' },
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
    zoom: 18,
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
  };
}

// Pure geometry for the court grid. Given a compact `gridSpec` from the server,
// produce the lat/lng polygon for every court so Google Maps can draw it.
// Kept dependency-free so the math is easy to verify.

// Local equirectangular approximation: a meters offset (east = +x, north = +y)
// around an origin, with the whole grid rotated by `rotDeg`. Accurate to well
// under a meter at the ~150m scale of a single block. cos() takes RADIANS.
export function offsetToLatLng(originLat, originLng, dxM, dyM, rotDeg) {
  const r = (rotDeg * Math.PI) / 180;
  const rx = dxM * Math.cos(r) - dyM * Math.sin(r);
  const ry = dxM * Math.sin(r) + dyM * Math.cos(r);
  const dLat = ry / 111320;
  const dLng = rx / (111320 * Math.cos((originLat * Math.PI) / 180));
  return { lat: originLat + dLat, lng: originLng + dLng };
}

// Column letter + (row+1): row 0 / col 0 -> "A1". Matches server/grounds.js.
export function courtLabel(row, col) {
  return String.fromCharCode(65 + col) + (row + 1);
}

// Build every court cell, centered on the block origin, row 0 at the top (north).
// Returns: [{ id, label, row, col, path: [4 corners], center }]
export function buildCells(spec) {
  const { originLat, originLng, rotationDeg, rows, cols, cellMeters } = spec;
  const h = cellMeters / 2;
  const cells = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // cell center offset from the block center, in meters
      const cx = (col - (cols - 1) / 2) * cellMeters;
      const cy = ((rows - 1) / 2 - row) * cellMeters; // row 0 is north
      const p = (x, y) => offsetToLatLng(originLat, originLng, x, y, rotationDeg);
      cells.push({
        id: `${row}-${col}`,
        label: courtLabel(row, col),
        row,
        col,
        path: [p(cx - h, cy - h), p(cx + h, cy - h), p(cx + h, cy + h), p(cx - h, cy + h)],
        center: p(cx, cy),
      });
    }
  }
  return cells;
}

// Resolve a worker (who carries a `courtId` and a `trail` of court ids) into
// map positions, using the generated cells as the source of truth so a pin
// always sits on its court. A tiny per-worker jitter keeps stacked pins legible.
export function workerToPositions(worker, cellsById) {
  const here = cellsById[worker.courtId];
  const jitter = (parseInt(worker.id.replace(/\D/g, ''), 10) || 0) * 3e-6;
  const position = here
    ? { lat: here.center.lat + jitter, lng: here.center.lng + jitter }
    : null;
  const trail = (worker.trail || [])
    .map((id) => cellsById[id]?.center)
    .filter(Boolean);
  return { position, trail };
}

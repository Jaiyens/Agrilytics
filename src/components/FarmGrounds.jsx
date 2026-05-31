import React, { useEffect, useMemo, useRef, useState } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { buildCells, workerToPositions } from './courts.js';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID';

// Same OS-module story as the old network view — kept below the grounds map.
const MODULES = [
  { icon: '🧪', name: 'Compliance', desc: 'Pesticide-use reports & NOIs, by voice.', live: true },
  { icon: '👷', name: 'Labor & Payroll', desc: 'Hours by crew and court, from the same notes.' },
  { icon: '💧', name: 'Water / SGMA', desc: 'Groundwater reporting and allocations.' },
  { icon: '📦', name: 'Input Costs', desc: 'Chemical & fertilizer spend per acre.' },
  { icon: '🌿', name: 'Traceability', desc: 'Court-to-buyer audit trail for GAP/FSMA.' },
];

// Court fill/stroke over satellite. Light strokes read better than dark on imagery.
const STATUS = {
  clear: { fill: '#d7dbcb', opacity: 0.08, stroke: '#eceadb' },
  'sprayed-today': { fill: '#e3a53c', opacity: 0.34, stroke: '#f4b850' },
  'restricted-rei': { fill: '#d96a52', opacity: 0.46, stroke: '#ff8f77' },
};
const PRESENCE_STROKE = '#74d486';

function statusLabel(s) {
  if (s === 'sprayed-today') return 'Treated today';
  if (s === 'restricted-rei') return 'Restricted · re-entry interval active';
  return 'Clear';
}

function makeWorkerEl(w) {
  const el = document.createElement('div');
  el.className = `worker-pin ${w.device}`;
  el.title = `${w.name} · ${w.role}`;
  el.innerHTML = '<span class="wp-dot"></span>';
  return el;
}

export default function FarmGrounds({ grounds, onCapture }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const libsRef = useRef(null);
  const polysRef = useRef([]);
  const labelsRef = useRef([]);
  const workerMarkersRef = useRef([]);
  const trailRef = useRef(null);
  const driftRef = useRef(null);

  const [mapReady, setMapReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [selectedWorker, setSelectedWorker] = useState(null);

  const farm = grounds?.farm;
  const block = farm?.block;
  const statusMap = grounds?.statusMap || {};
  const workers = useMemo(() => grounds?.workers || [], [grounds]);
  const stats = grounds?.stats || {};

  const cells = useMemo(() => (block?.gridSpec ? buildCells(block.gridSpec) : []), [block]);
  const cellsById = useMemo(() => Object.fromEntries(cells.map((c) => [c.id, c])), [cells]);
  const courtAcres = block?.gridSpec
    ? (block.gridSpec.cellMeters ** 2 / 4046.86).toFixed(2)
    : null;

  // ---- INIT MAP (once block center is known; not on data changes) ----
  useEffect(() => {
    if (!API_KEY || !block || mapRef.current || !containerRef.current) return;
    let cancelled = false;

    // v2 functional loader API (the Loader class is deprecated). Idempotent + singleton,
    // so it's safe under React 18 StrictMode's double-mount.
    setOptions({ key: API_KEY, v: 'weekly' });
    Promise.all([importLibrary('maps'), importLibrary('marker')])
      .then(([mapsLib, markerLib]) => {
        if (cancelled || mapRef.current) return; // StrictMode async double-mount guard
        const { Map, Polygon, Polyline } = mapsLib;
        const { AdvancedMarkerElement } = markerLib;
        const map = new Map(containerRef.current, {
          center: { lat: block.centerLat, lng: block.centerLng },
          zoom: block.zoom || 18,
          mapTypeId: 'hybrid',
          mapId: MAP_ID,
          tilt: 0,
          gestureHandling: 'greedy',
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          rotateControl: false,
          zoomControl: true,
          zoomControlOptions: { position: window.google.maps.ControlPosition.RIGHT_TOP },
          backgroundColor: '#0c0d0b',
        });
        mapRef.current = map;
        libsRef.current = { Polygon, Polyline, AdvancedMarkerElement, event: window.google.maps.event };

        // Zoom-gate the court labels so the grid stays legible when zoomed out.
        const applyLabelVis = () => {
          const z = map.getZoom();
          labelsRef.current.forEach((m) => { m.content.style.display = z >= 17 ? '' : 'none'; });
        };
        map.addListener('zoom_changed', applyLabelVis);

        setMapReady(true);
      })
      .catch((e) => { if (!cancelled) { console.error('Google Maps load failed', e); setLoadError(true); } });

    return () => {
      cancelled = true;
      mapRef.current = null;
      libsRef.current = null;
      setMapReady(false);
      if (containerRef.current) containerRef.current.innerHTML = ''; // no map.remove() in Google Maps
    };
  }, [block?.centerLat, block?.centerLng]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- COURTS: polygons + labels ----
  useEffect(() => {
    if (!mapReady || !cells.length) return;
    const { Polygon, AdvancedMarkerElement, event } = libsRef.current;
    const map = mapRef.current;
    const present = new Set(workers.filter((w) => w.device !== 'offline').map((w) => w.courtId));

    polysRef.current = cells.map((cell) => {
      const sm = statusMap[cell.id];
      const status = sm?.status || 'clear';
      const c = STATUS[status] || STATUS.clear;
      const hasWorker = present.has(cell.id);
      const poly = new Polygon({
        map,
        paths: cell.path,
        fillColor: c.fill,
        fillOpacity: c.opacity,
        strokeColor: hasWorker ? PRESENCE_STROKE : c.stroke,
        strokeOpacity: hasWorker ? 0.95 : 0.55,
        strokeWeight: hasWorker ? 2.6 : 1,
        clickable: true,
        zIndex: 1,
      });
      poly.addListener('click', () => {
        setSelectedWorker(null);
        setSelectedCourt({ ...cell, status, lastApplication: sm?.lastApplication || null });
      });
      return poly;
    });

    labelsRef.current = cells.map((cell) => {
      const sm = statusMap[cell.id];
      const el = document.createElement('div');
      el.className = `court-label ${sm?.status || 'clear'}`;
      el.textContent = cell.label;
      return new AdvancedMarkerElement({ map, position: cell.center, content: el, gmpClickable: false, zIndex: 2 });
    });
    const z = map.getZoom();
    labelsRef.current.forEach((m) => { m.content.style.display = z >= 17 ? '' : 'none'; });

    return () => {
      polysRef.current.forEach((p) => { event.clearInstanceListeners(p); p.setMap(null); });
      polysRef.current = [];
      labelsRef.current.forEach((m) => { m.map = null; });
      labelsRef.current = [];
    };
  }, [mapReady, cells, statusMap, workers]);

  // ---- WORKERS: pins + gentle simulated GPS drift ----
  useEffect(() => {
    if (!mapReady || !workers.length || !Object.keys(cellsById).length) return;
    const { AdvancedMarkerElement, event } = libsRef.current;
    const map = mapRef.current;

    workerMarkersRef.current = workers
      .map((w) => {
        const { position } = workerToPositions(w, cellsById);
        if (!position) return null;
        const m = new AdvancedMarkerElement({ map, position, content: makeWorkerEl(w), zIndex: 10 });
        m.addListener('click', () => { setSelectedCourt(null); setSelectedWorker(w); });
        return { id: w.id, marker: m, base: position, online: w.device === 'online' };
      })
      .filter(Boolean);

    driftRef.current = setInterval(() => {
      workerMarkersRef.current.forEach(({ marker, base, online }) => {
        if (!online) return; // idle/offline pins stay put — an offline device shows a gap
        marker.position = {
          lat: base.lat + (Math.random() - 0.5) * 1.2e-5,
          lng: base.lng + (Math.random() - 0.5) * 1.2e-5,
        };
      });
    }, 2200);

    return () => {
      clearInterval(driftRef.current);
      workerMarkersRef.current.forEach(({ marker }) => { event.clearInstanceListeners(marker); marker.map = null; });
      workerMarkersRef.current = [];
    };
  }, [mapReady, workers, cellsById]);

  // ---- TRAIL: draw the selected worker's recent path ----
  useEffect(() => {
    if (!mapReady) return;
    const { Polyline } = libsRef.current;
    const map = mapRef.current;
    if (trailRef.current) { trailRef.current.setMap(null); trailRef.current = null; }
    if (selectedWorker) {
      const { position, trail } = workerToPositions(selectedWorker, cellsById);
      if (trail.length >= 2) {
        trailRef.current = new Polyline({
          map, path: trail, geodesic: false,
          strokeColor: PRESENCE_STROKE, strokeOpacity: 0.85, strokeWeight: 2.5, zIndex: 5,
        });
      }
      if (position) map.panTo(position);
    }
    return () => { if (trailRef.current) { trailRef.current.setMap(null); trailRef.current = null; } };
  }, [mapReady, selectedWorker, cellsById]);

  const noMap = !API_KEY || loadError;

  return (
    <div className="network grounds">
      <div className="map-wrap">
        {API_KEY && <div className="gmap" ref={containerRef} />}

        {noMap && (
          <div className="map-placeholder">
            <div className="mp-card">
              <span className="mp-badge">Satellite view</span>
              <h3>{loadError ? 'Map failed to load' : 'Add your Google Maps key'}</h3>
              {loadError ? (
                <p>The key in <code>.env.local</code> was rejected. Check that the Maps JavaScript API and
                  billing are enabled, and that the key isn’t referrer-blocked.</p>
              ) : (
                <p>Put <code>VITE_GOOGLE_MAPS_API_KEY=…</code> in <code>.env.local</code> and restart the dev
                  server to load the satellite view, the court grid, and live worker tracking.</p>
              )}
              <p className="mp-steps">Google Cloud Console → enable <b>Maps JavaScript API</b> → enable billing →
                create a key → restrict to <code>localhost</code> + your domain.</p>
            </div>
          </div>
        )}

        <div className="netstrip">
          <div className="cell"><div className="n">{stats.workersOnline ?? 0}<span className="of">/{stats.workersTotal ?? 0}</span></div><div className="l">Workers on-site</div></div>
          <div className="cell"><div className="n">{stats.courtsTreatedToday ?? 0}</div><div className="l">Courts treated today</div></div>
          <div className="cell"><div className="n">{stats.acres ?? block?.acres ?? 0}</div><div className="l">Block acres</div></div>
          <div className="cell"><div className="n green">{stats.compliancePct ?? 0}%</div><div className="l">Documented</div></div>
        </div>

        <div className="maptitle">
          <h2>{farm ? `${farm.name} · ${block?.label}` : 'Loading the grounds…'}</h2>
          <p>Every court mapped, every application placed, every worker accounted for. {stats.workersOnline ?? 0} on the block now.</p>
        </div>

        <div className="legend">
          <div className="li"><span className="swatch sq" style={{ background: 'rgba(227,165,60,0.5)' }} /> Treated today</div>
          <div className="li"><span className="swatch sq" style={{ background: 'rgba(217,106,82,0.6)' }} /> Restricted · REI</div>
          <div className="li"><span className="swatch sq ring" /> Worker on court</div>
          <div className="li"><span className="swatch" style={{ background: 'var(--online)' }} /> Device online</div>
        </div>

        {selectedCourt && (
          <div className="farm-panel court-panel">
            <button className="close" onClick={() => setSelectedCourt(null)}>×</button>
            <span className={`tier ${selectedCourt.status === 'clear' ? 'prospect' : 'pilot'}`}>Court {selectedCourt.label}</span>
            <h3>{block?.label} · {selectedCourt.label}</h3>
            <div className="op">{farm?.crop} · {courtAcres} ac · {farm?.name}</div>

            <div className="statusrow" style={{ marginTop: 16 }}>
              <span className={`statusdot ${selectedCourt.status === 'clear' ? 'offline' : selectedCourt.status === 'restricted-rei' ? 'flag' : 'idle'}`} />
              {statusLabel(selectedCourt.status)}
            </div>

            {selectedCourt.lastApplication ? (
              <>
                <div className="farm-meta">
                  <div className="m"><div className="mk">Product</div><div className="mv">{selectedCourt.lastApplication.product}</div></div>
                  <div className="m"><div className="mk">EPA reg. no.</div><div className="mv mono">{selectedCourt.lastApplication.epa}</div></div>
                  <div className="m"><div className="mk">Rate</div><div className="mv mono">{selectedCourt.lastApplication.rate}</div></div>
                  <div className="m"><div className="mk">Applied</div><div className="mv mono">{selectedCourt.lastApplication.time}</div></div>
                  <div className="m"><div className="mk">Active ingredient</div><div className="mv">{selectedCourt.lastApplication.ai}</div></div>
                  <div className="m"><div className="mk">By</div><div className="mv">{selectedCourt.lastApplication.applicator}</div></div>
                </div>
                {selectedCourt.lastApplication.restricted && (
                  <div className="compliance-chip noi">
                    ⚠ Restricted material · re-entry interval {selectedCourt.lastApplication.rei_hours}h — keep workers out, clears {selectedCourt.lastApplication.rei_clears}.
                  </div>
                )}
                <p className="panel-note">Placed to this exact court from the field — the voice note that logged it is tied to the worker who was standing here.</p>
              </>
            ) : (
              <div className="farm-feed">
                <div className="feed-item">No application logged on this court today.</div>
              </div>
            )}

            <button className="btn primary" style={{ width: '100%', marginTop: 18 }} onClick={onCapture}>
              Log an application here
            </button>
          </div>
        )}

        {selectedWorker && (
          <div className="farm-panel worker-panel">
            <button className="close" onClick={() => setSelectedWorker(null)}>×</button>
            <span className={`tier ${selectedWorker.device === 'offline' ? 'prospect' : 'pilot'}`}>{selectedWorker.role}</span>
            <h3>{selectedWorker.name}</h3>
            <div className="op">On {block?.label} · {cellsById[selectedWorker.courtId]?.label ? `Court ${cellsById[selectedWorker.courtId].label}` : 'last known court'}</div>

            <div className="statusrow" style={{ marginTop: 16 }}>
              <span className={`statusdot ${selectedWorker.device}`} />
              {selectedWorker.device === 'online' ? 'Device online · location live' : selectedWorker.device === 'idle' ? 'Device idle · last fix recent' : 'Device offline · location gap'}
            </div>

            <div className="farm-feed">
              <div className="fh">Today on the block</div>
              {selectedWorker.todayLog.map((e, i) => (
                <div className="feed-item" key={i}>
                  {e.action}
                  <div className="ft">{e.time}{e.court !== '—' ? ` · Court ${e.court}` : ''}</div>
                </div>
              ))}
            </div>

            <div className={`audit ${selectedWorker.device === 'offline' ? 'gap' : ''}`}>
              <div className="fh">Location log &amp; audit trail</div>
              {selectedWorker.device === 'offline' ? (
                <p>Coverage gap — this device is off, so there’s no location record for the crew member right now. The
                  live log is what places applications precisely <em>and</em> protects workers: a timestamped, verifiable
                  record of where each person was, in case of a wage dispute, theft, or safety incident in the field.</p>
              ) : (
                <p>Continuous, timestamped location — attached to the worker, not just the block. It places every
                  application to the exact court <em>and</em> protects the crew: a verifiable record of where each person
                  was, should there ever be a wage dispute, theft, or safety incident in the field.</p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="modules">
        <div className="mhead">
          <h3>The Agrilytics OS</h3>
          <span>Compliance is module one. The same court-level field data powers the rest.</span>
        </div>
        <div className="modgrid">
          {MODULES.map((m) => (
            <div className={`mod ${m.live ? 'live' : 'soon'}`} key={m.name}>
              <span className={`mtag ${m.live ? 'on' : 'next'}`}>{m.live ? 'Live' : 'Soon'}</span>
              <div className="micon">{m.icon}</div>
              <div className="mname">{m.name}</div>
              <div className="mdesc">{m.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

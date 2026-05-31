import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const DARK_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

const MODULES = [
  { icon: '🧪', name: 'Compliance', desc: 'Pesticide-use reports & NOIs, by voice.', tag: 'live', live: true },
  { icon: '👷', name: 'Labor & Payroll', desc: 'Hours by crew and block, from the same notes.', tag: 'soon' },
  { icon: '💧', name: 'Water / SGMA', desc: 'Groundwater reporting and allocations.', tag: 'soon' },
  { icon: '📦', name: 'Input Costs', desc: 'Chemical & fertilizer spend per acre.', tag: 'soon' },
  { icon: '🌿', name: 'Traceability', desc: 'Field-to-buyer audit trail for GAP/FSMA.', tag: 'soon' },
];

function complianceChip(c) {
  if (c === 'up_to_date') return <div className="compliance-chip ok">✓ Compliance up to date</div>;
  if (c === 'noi_due') return <div className="compliance-chip noi">⚠ Notice of Intent due before next restricted application</div>;
  return <div className="compliance-chip unknown">○ Not yet onboarded</div>;
}

export default function NetworkMap({ farms, stats, records, onCapture }) {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: DARK_STYLE,
      center: [-119.9, 36.75],
      zoom: 8.1,
      attributionControl: false,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

    (farms || []).forEach((farm) => {
      const el = document.createElement('div');
      el.className = `farm-pin ${farm.tier} ${farm.status === 'online' ? 'online' : ''}`;
      el.title = farm.name;
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        setSelected(farm);
        map.flyTo({ center: [farm.lng, farm.lat], zoom: 9.4, duration: 700 });
      });
      new maplibregl.Marker({ element: el }).setLngLat([farm.lng, farm.lat]).addTo(map);
    });

    return () => { map.remove(); mapRef.current = null; };
  }, [farms]);

  const s = stats || {};
  // recent voice-captured records to show in a pilot farm's feed
  const recentForFarm = (farm) =>
    farm.tier === 'pilot' && (records || []).length
      ? records.slice(0, 3).map((r) => ({
          text: `${r.product || 'Application'} · ${r.block ? 'Block ' + r.block : ''} ${r.rate_value ? '· ' + r.rate_value + ' ' + (r.rate_unit || '') : ''}`,
          time: r.application_date || '',
        }))
      : [];

  return (
    <div className="network">
      <div className="map-wrap">
        <div className="maplibregl-map" ref={containerRef} />

        <div className="netstrip">
          <div className="cell"><div className="n">{s.pilots ?? 0}</div><div className="l">Pilot farms</div></div>
          <div className="cell"><div className="n">{(s.acres ?? 0).toLocaleString()}</div><div className="l">Acres covered</div></div>
          <div className="cell"><div className="n">{s.appsMonth ?? 0}</div><div className="l">Apps this month</div></div>
          <div className="cell"><div className="n green">{s.compliancePct ?? 0}%</div><div className="l">Compliant</div></div>
        </div>

        <div className="maptitle">
          <h2>The San Joaquin Valley, live.</h2>
          <p>Every pin is an operation logging field work by voice. {s.prospects ?? 0} more in the pipeline.</p>
        </div>

        <div className="legend">
          <div className="li"><span className="swatch" style={{ background: 'var(--online)' }} /> Online now</div>
          <div className="li"><span className="swatch" style={{ background: 'var(--amber)' }} /> Pilot farm</div>
          <div className="li"><span className="swatch" style={{ background: 'var(--text-faint)' }} /> Pipeline</div>
        </div>

        {selected && (
          <div className="farm-panel">
            <button className="close" onClick={() => setSelected(null)}>×</button>
            <span className={`tier ${selected.tier}`}>{selected.tier === 'pilot' ? '● Pilot farm' : 'Pipeline'}</span>
            <h3>{selected.name}</h3>
            <div className="op">{selected.operator !== '—' ? selected.operator : 'Prospect'} · {selected.town}, CA</div>

            <div className="statusrow" style={{ marginTop: 16 }}>
              <span className={`statusdot ${selected.status}`} />
              {selected.status === 'online' ? 'Active in the field now' : selected.status === 'idle' ? 'Logged recently' : 'Not yet active'}
            </div>

            <div className="farm-meta">
              <div className="m"><div className="mk">Crop</div><div className="mv">{selected.crop}</div></div>
              <div className="m"><div className="mk">Acres</div><div className="mv mono">{selected.acres.toLocaleString()}</div></div>
              <div className="m"><div className="mk">Apps this month</div><div className="mv mono">{selected.apps_month}</div></div>
              <div className="m"><div className="mk">Field language</div><div className="mv">{selected.lang === 'es' ? 'Spanish' : 'English'}</div></div>
            </div>

            {complianceChip(selected.compliance)}

            <div className="farm-feed">
              <div className="fh">Recent activity</div>
              {recentForFarm(selected).length ? (
                recentForFarm(selected).map((f, i) => (
                  <div className="feed-item" key={i}>{f.text}<div className="ft">{f.time}</div></div>
                ))
              ) : (
                <div className="feed-item">{selected.last_activity}</div>
              )}
            </div>

            {selected.tier === 'pilot' && (
              <button className="btn primary" style={{ width: '100%', marginTop: 18 }} onClick={onCapture}>
                Log an application
              </button>
            )}
          </div>
        )}
      </div>

      <div className="modules">
        <div className="mhead">
          <h3>The Agrilytics OS</h3>
          <span>Compliance is module one. Same field data powers the rest.</span>
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

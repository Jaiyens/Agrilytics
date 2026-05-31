import React, { useState } from 'react';

const FIELDS = [
  { key: 'block', label: 'Block', type: 'block' },
  { key: 'product', label: 'Product', type: 'product' },
  { key: 'rate_value', label: 'Rate', type: 'number' },
  { key: 'rate_unit', label: 'Unit', type: 'unit' },
  { key: 'acres_treated', label: 'Acres', type: 'number' },
  { key: 'application_date', label: 'Date', type: 'date' },
  { key: 'start_time', label: 'Time', type: 'time' },
  { key: 'target_pest', label: 'Target', type: 'text' },
];

const UNITS = ['qt/acre', 'pt/acre', 'gal/acre', 'oz/acre', 'lb/acre'];

export default function ReviewCard({ record, reference, onApprove, onDiscard, saving }) {
  const [rec, setRec] = useState(record);

  function set(key, val) {
    setRec((r) => ({ ...r, [key]: val }));
  }

  function flagsFor(key) {
    return (rec.flags || []).filter((f) => f.field === key);
  }
  function isMissing(key) {
    const v = rec[key];
    return v === null || v === undefined || v === '';
  }
  function rowClass(key) {
    const fs = flagsFor(key);
    if (isMissing(key) && ['block', 'product', 'rate_value', 'rate_unit', 'acres_treated', 'application_date', 'start_time'].includes(key))
      return 'frow missing';
    if (fs.some((f) => f.level === 'error')) return 'frow missing';
    if (fs.some((f) => f.level === 'warn')) return 'frow warn';
    return 'frow';
  }

  const blocks = reference?.blocks || [];
  const products = reference?.products || [];
  const stillMissing = ['block', 'product', 'rate_value', 'rate_unit', 'acres_treated', 'application_date', 'start_time']
    .filter(isMissing);
  const canLog = !isMissing('block') && !isMissing('product');

  return (
    <div className="review">
      <div className="review-head">
        <div className="row1">
          <h2>What we heard</h2>
          <span className={`conf ${rec.confidence}`}>{rec.confidence} confidence</span>
        </div>
        <div className="transcript">
          <div className="heard">“{rec.raw_transcript}”</div>
          {rec.transcript_english && rec.language_detected !== 'en' && (
            <div className="en">{rec.transcript_english}</div>
          )}
        </div>
      </div>

      <div className="fields">
        {FIELDS.map(({ key, label, type }) => (
          <div className={rowClass(key)} key={key}>
            <div className="k">{label}</div>
            <div className="v">
              {type === 'block' && (
                <input list="blocklist" value={rec.block ?? ''} placeholder="— not heard —"
                  onChange={(e) => set('block', e.target.value)} />
              )}
              {type === 'product' && (
                <input list="productlist" value={rec.product ?? ''} placeholder="— not heard —"
                  onChange={(e) => set('product', e.target.value)} />
              )}
              {type === 'unit' && (
                <select value={rec.rate_unit ?? ''} onChange={(e) => set('rate_unit', e.target.value || null)}>
                  <option value="">— unit —</option>
                  {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              )}
              {type === 'number' && (
                <input type="number" step="any" value={rec[key] ?? ''} placeholder="—"
                  onChange={(e) => set(key, e.target.value === '' ? null : Number(e.target.value))} />
              )}
              {type === 'date' && (
                <input type="date" value={rec.application_date ?? ''}
                  onChange={(e) => set('application_date', e.target.value || null)} />
              )}
              {type === 'time' && (
                <input type="time" value={rec.start_time ?? ''}
                  onChange={(e) => set('start_time', e.target.value || null)} />
              )}
              {type === 'text' && (
                <input value={rec[key] ?? ''} placeholder="—"
                  onChange={(e) => set(key, e.target.value || null)} />
              )}
            </div>
            {flagsFor(key).map((f, i) => (
              <div className={`flagnote ${f.level}`} key={i} style={{ gridColumn: '1 / -1' }}>
                <span className="dot" />
                <span>{f.message}</span>
              </div>
            ))}
          </div>
        ))}
        <datalist id="blocklist">
          {blocks.map((b) => <option key={b.id} value={b.id}>{`${b.id} — ${b.name} (${b.crop})`}</option>)}
        </datalist>
        <datalist id="productlist">
          {products.map((p) => <option key={p.name} value={p.name}>{`${p.name} (EPA ${p.epa})`}</option>)}
        </datalist>
      </div>

      <div className="review-foot">
        <div className={`status ${stillMissing.length ? 'review' : 'ok'}`}>
          {stillMissing.length
            ? `${stillMissing.length} field${stillMissing.length > 1 ? 's' : ''} need confirming`
            : '✓ Ready for the report'}
        </div>
        <div className="actions">
          <button className="btn ghost" onClick={onDiscard} disabled={saving}>Discard</button>
          <button className="btn primary" onClick={() => onApprove(rec)} disabled={!canLog || saving}>
            {saving ? <span><span className="spin" /> Logging…</span> : 'Approve & log'}
          </button>
        </div>
      </div>
    </div>
  );
}

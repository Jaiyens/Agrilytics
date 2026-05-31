import React from 'react';

function fmtDate(d) {
  if (!d) return '—';
  try {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return d;
  }
}

export default function Dashboard({ records, onOpen }) {
  const total = records.length;
  const acres = records.reduce((s, r) => s + (Number(r.acres_treated) || 0), 0);
  const needReview = records.filter((r) => r.needs_review).length;
  const month = new Date().toLocaleDateString('en-US', { month: 'long' });

  return (
    <div className="office">
      <div className="office-inner">
        <h1>Application log</h1>
        <p className="sub">
          Every voice note from the field, structured and ready for the {month} Pesticide Use Report.
        </p>

        <div className="stats">
          <div className="stat"><div className="n">{total}</div><div className="l">Applications logged</div></div>
          <div className="stat"><div className="n">{acres.toFixed(0)}</div><div className="l">Acres treated</div></div>
          <div className="stat"><div className="n">{needReview}</div><div className="l">Need a second look</div></div>
        </div>

        <div className="tablecard">
          <div className="th">
            <div>Date</div><div>Product</div><div>Block</div><div className="hidesm">Rate</div><div>Status</div>
          </div>
          {records.length === 0 && <div className="empty">No applications logged yet. Capture one in Field mode.</div>}
          {records.map((r) => {
            const blockName = r.matched_block?.name;
            return (
              <div className="tr" key={r.id} onClick={() => onOpen(r)}>
                <div className="mono">{fmtDate(r.application_date)}</div>
                <div>
                  {r.product || '—'}
                  {r.epa_reg_no && <div className="blockname mono">EPA {r.epa_reg_no}</div>}
                </div>
                <div>
                  <span className="mono">{r.block || '—'}</span>
                  {blockName && <div className="blockname">{blockName}</div>}
                </div>
                <div className="mono hidesm">
                  {r.rate_value != null ? `${r.rate_value} ${r.rate_unit || ''}` : '—'}
                </div>
                <div>
                  <span className={`pill ${r.needs_review ? 'review' : 'logged'}`}>
                    {r.needs_review ? 'review' : 'logged'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

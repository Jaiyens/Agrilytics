import React from 'react';

function fmtDate(d) {
  if (!d) return '—';
  try {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return d;
  }
}

function Field({ label, value, mono, full }) {
  return (
    <div className={`rfield ${full ? 'full' : ''}`}>
      <div className="rk">{label}</div>
      <div className={`rv ${mono ? 'mono' : ''}`}>{value || '—'}</div>
    </div>
  );
}

export default function ReportView({ record, reference, onClose }) {
  const r = record;
  const block = r.matched_block || (reference?.blocks || []).find((b) => b.id === r.block);
  const product =
    r.matched_product || (reference?.products || []).find((p) => p.name === r.product);
  const restricted = product?.restricted;

  const rate = r.rate_value != null ? `${r.rate_value} ${r.rate_unit || ''}` : '—';

  return (
    <div className="overlay" onClick={onClose}>
      <div className="report" onClick={(e) => e.stopPropagation()}>
        <div className="report-bar">
          <span className="ttl">PUR · {r.id}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn primary" onClick={() => window.print()}>Download PDF</button>
            <button className="btn ghost" onClick={onClose}>Close</button>
          </div>
        </div>

        <div className="report-doc">
          <div className="gov">
            <div className="agency">California Department of Pesticide Regulation</div>
            <h2>Pesticide Use Report</h2>
            <div className="form-no">Production Agriculture — Monthly · DPR-PML-183 (draft for review)</div>
          </div>

          <div className="report-grid">
            <Field label="Operator / Grower" value="Home Ranch Farms (demo)" />
            <Field label="Operator ID / Permit #" value="10-0000-00000 (demo)" mono />
            <Field label="County" value="Fresno" />
            <Field label="Commodity / Site" value={block ? `${block.crop}` : '—'} />
            <Field label="Block / Field" value={block ? `${r.block} — ${block.name}` : r.block} mono />
            <Field label="Total block acreage" value={block ? `${block.acres} ac` : '—'} mono />
            <Field label="Product" value={r.product} />
            <Field label="EPA reg. no." value={r.epa_reg_no} mono />
            <Field label="Active ingredient" value={product?.ai} />
            <Field label="Application rate" value={rate} mono />
            <Field label="Acres treated" value={r.acres_treated != null ? `${r.acres_treated} ac` : '—'} mono />
            <Field label="Target pest" value={r.target_pest} />
            <Field label="Date" value={fmtDate(r.application_date)} />
            <Field label="Time (24h)" value={r.start_time} mono />
            <Field label="REI / PHI" value={product ? `${product.rei_hours}h REI · ${product.phi_days}d PHI` : '—'} mono />
            <Field label="Applicator" value={r.applicator_name || 'On file with operator'} />
          </div>

          {restricted && (
            <div className="report-restricted">
              ⚠ Restricted Material ({product.ai}). A Notice of Intent must be filed with the County
              Agricultural Commissioner 24–48 hours before application. Confirm the NOI before submitting this report.
            </div>
          )}

          <div className="report-note">
            Captured by voice from the field and structured automatically. Reviewed and approved by the operator
            before filing. In production this submits to the County Agricultural Commissioner through CalAgPermits’
            third-party reporting channel.
          </div>
        </div>
      </div>
    </div>
  );
}

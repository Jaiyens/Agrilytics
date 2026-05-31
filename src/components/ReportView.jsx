import React from 'react';

function fmtDate(d) {
  if (!d) return '—';
  try {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return d;
  }
}

function fmtMonth(d) {
  if (!d) return 'May 2026';
  try {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  } catch {
    return 'May 2026';
  }
}

function Field({ no, label, value, mono, wide }) {
  return (
    <div className={`pur-field ${wide ? 'wide' : ''}`}>
      <div className="rk">{no ? `${no}. ` : ''}{label}</div>
      <div className={`rv ${mono ? 'mono' : ''}`}>{value || '—'}</div>
    </div>
  );
}

function Cell({ label, value, mono }) {
  return (
    <div className="pur-cell">
      <div className="ck">{label}</div>
      <div className={`cv ${mono ? 'mono' : ''}`}>{value || '—'}</div>
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
  const amountUsed =
    r.rate_value != null && r.acres_treated != null
      ? `${r.rate_value * r.acres_treated} ${String(r.rate_unit || '').replace('/acre', '')}`
      : '—';

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

        <div className="report-doc pur-doc">
          <div className="pur-topline">
            <div>
              <div className="state">STATE OF CALIFORNIA</div>
              <div className="agency">DEPARTMENT OF PESTICIDE REGULATION</div>
            </div>
            <div className="form-id">DPR-PML-017C (REV. 12/24)<br />Page 1 of 2</div>
          </div>

          <div className="pur-title">
            <h2>PRODUCTION AGRICULTURE MONTHLY PESTICIDE USE REPORT</h2>
            <div>Submit to the Agricultural Commissioner within 10 days of the month following application.</div>
          </div>

          <div className="pur-grid">
            <Field no="1" label="Month / Year" value={fmtMonth(r.application_date)} />
            <Field no="2" label="County No." value="10" mono />
            <Field no="3" label="County" value="Fresno" />
            <Field no="4" label="Operator ID / Permit No." value="10-0000-00000" mono />
            <Field no="5" label="Property Operator / Grower" value="Home Ranch Farms" wide />
            <Field no="6" label="Mailing Address" value="2450 County Road 12, Fresno, CA 93706" wide />
            <Field no="7" label="Site / Location ID" value={block ? `${r.block} - ${block.name}` : r.block} mono />
            <Field no="8" label="Commodity" value={block?.crop || 'Almonds'} />
            <Field no="9" label="Total Site Acres" value={block ? `${block.acres}` : '42'} mono />
            <Field no="10" label="Application Method" value="Ground - broadcast" />
          </div>

          <div className="pur-section-title">Pesticide Application Detail</div>
          <div className="pur-table">
            <Cell label="11. Application Date" value={fmtDate(r.application_date)} />
            <Cell label="12. Start Time" value={r.start_time} mono />
            <Cell label="13. End Time" value="09:35" mono />
            <Cell label="14. Acres Treated" value={r.acres_treated != null ? `${r.acres_treated}` : '3'} mono />
            <Cell label="15. EPA Reg. No." value={r.epa_reg_no} mono />
            <Cell label="16. Product Name / Manufacturer" value={`${r.product || 'Roundup PowerMAX'} / Bayer`} />
            <Cell label="17. Amount Used" value={amountUsed} mono />
            <Cell label="18. Rate / Acre" value={rate} mono />
            <Cell label="19. REI" value={product ? `${product.rei_hours} hours` : '4 hours'} mono />
            <Cell label="20. Target Pest" value={r.target_pest || 'Weeds'} />
          </div>

          {restricted && (
            <div className="report-restricted">
              Restricted Material ({product.ai}). A Notice of Intent must be filed with the County
              Agricultural Commissioner 24–48 hours before application. Confirm the NOI before submitting this report.
            </div>
          )}

          <div className="pur-cert">
            <div>
              <div className="cert-line">Maria Alvarez</div>
              <span>Report Prepared By</span>
            </div>
            <div>
              <div className="cert-line">{fmtDate(new Date().toISOString().slice(0, 10))}</div>
              <span>Date</span>
            </div>
            <div>
              <div className="cert-line">Submitted to County</div>
              <span>For Agency Use Only</span>
            </div>
          </div>

          <div className="report-note">
            Demo: field note captured by voice, structured automatically, reviewed, and formatted as a California
            production agriculture pesticide use report for CalAgPermits / County Agricultural Commissioner filing.
          </div>
        </div>
      </div>
    </div>
  );
}

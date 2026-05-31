import React, { useState, useEffect, useCallback } from 'react';
import Recorder from './components/Recorder.jsx';
import ReviewCard from './components/ReviewCard.jsx';
import ReportView from './components/ReportView.jsx';
import NetworkMap from './components/NetworkMap.jsx';
import { api } from './api.js';

export default function App() {
  const [mode, setMode] = useState('network'); // 'network' | 'field'
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pending, setPending] = useState(null);
  const [records, setRecords] = useState([]);
  const [reference, setReference] = useState(null);
  const [farms, setFarms] = useState([]);
  const [stats, setStats] = useState(null);
  const [openReport, setOpenReport] = useState(null);
  const [toast, setToast] = useState('');

  const loadRecords = useCallback(async () => {
    try { const { records } = await api.getRecords(); setRecords(records); } catch {}
  }, []);

  useEffect(() => {
    api.getReference().then(setReference).catch(() => {});
    api.getFarms().then(({ farms, stats }) => { setFarms(farms); setStats(stats); }).catch(() => {});
    loadRecords();
  }, [loadRecords]);

  function flash(msg) { setToast(msg); setTimeout(() => setToast(''), 2800); }

  async function approve(rec) {
    setSaving(true);
    try {
      const { record } = await api.saveRecord(rec);
      await loadRecords();
      setPending(null);
      flash('Logged to the application record');
      setOpenReport(record); // the payoff: show the filled report
    } catch (e) {
      flash(e.message || 'Could not log record');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`app ${mode}`}>
      <header className="topbar">
        <div className="brand">
          <span className="logo">Agrilytics<b>.</b></span>
          <span className="tag">the operating system for the farm</span>
        </div>
        <nav className="modetoggle">
          <button className={mode === 'network' ? 'active' : ''} onClick={() => setMode('network')}>Network</button>
          <button className={mode === 'field' ? 'active' : ''} onClick={() => setMode('field')}>Field</button>
        </nav>
      </header>

      {mode === 'network' ? (
        <NetworkMap farms={farms} stats={stats} records={records} onCapture={() => setMode('field')} />
      ) : (
        <main className="field-stage">
          {!pending && (
            <div className="field-head">
              <h1>Speak it once. <em>The paperwork writes itself.</em></h1>
              <p>Tell Agrilytics what you sprayed, where, and when — in Spanish or English. We turn it into the report.</p>
            </div>
          )}
          {pending ? (
            <ReviewCard
              record={pending}
              reference={reference}
              saving={saving}
              onApprove={approve}
              onDiscard={() => setPending(null)}
            />
          ) : (
            <Recorder onResult={setPending} busy={busy} setBusy={setBusy} />
          )}
        </main>
      )}

      {openReport && (
        <ReportView record={openReport} reference={reference} onClose={() => setOpenReport(null)} />
      )}

      {toast && <div className="toast"><span className="tick">✓</span>{toast}</div>}
    </div>
  );
}

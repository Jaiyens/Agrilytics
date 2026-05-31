import React, { useState } from 'react';
import { api } from '../api.js';

const SAMPLES = [
  {
    es: 'Apliqué en el río doce, dos cuartos por acre de Roundup, a las nueve de la mañana.',
    complete: true,
  },
  {
    es: 'En el norte cuatro echamos Movento contra el pulgón, seis onzas por acre, temprano hoy.',
    complete: true,
  },
  {
    es: 'Fumigamos el canal siete con azufre esta mañana, como veinte acres.',
    note: 'no rate stated',
    complete: false,
  },
  {
    es: 'Eché algo en el bloque doce hoy en la tarde.',
    note: 'product + rate missing',
    complete: false,
  },
];

const HARDCODED_SPEAK_NOTE = SAMPLES[0].es;

function hardcodedRecord() {
  return {
    activity_type: 'pesticide_application',
    block: '12',
    product: 'Roundup PowerMAX',
    epa_reg_no: '524-549',
    rate_value: 2,
    rate_unit: 'qt/acre',
    acres_treated: 3,
    application_date: new Date().toISOString().slice(0, 10),
    start_time: '09:00',
    target_pest: null,
    applicator_name: null,
    language_detected: 'es',
    raw_transcript: HARDCODED_SPEAK_NOTE,
    transcript_english: 'I applied Roundup on River 12, two quarts per acre, across three acres, at nine in the morning.',
    notes: 'Hardcoded demo record generated from the first sample note.',
    confidence: 'high',
    missing_fields: [],
    flags: [],
    needs_review: false,
  };
}

export default function Recorder({ onResult, busy, setBusy }) {
  const [error, setError] = useState('');

  async function runSample(text) {
    if (busy) return;
    if (text === HARDCODED_SPEAK_NOTE) {
      setError('');
      onResult(hardcodedRecord());
      return;
    }

    setBusy(true);
    setError('');
    try {
      const { record } = await api.extractText(text);
      onResult(record);
    } catch (e) {
      setError(e.message || 'Could not process the phrase.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rec-wrap">
      <button
        className="rec-btn"
        onClick={() => runSample(HARDCODED_SPEAK_NOTE)}
        disabled={busy}
      >
        <span className="ico">🎙</span>
        <span className="lbl">{busy ? 'Working…' : 'Tap to speak'}</span>
      </button>

      <div className="rec-timer" />
      <div className="rec-hint">
        {busy
          ? <span><span className="spin" /> &nbsp;Transcribing &amp; structuring…</span>
          : error || 'Demo mode: tapping Speak uses the first sample note automatically.'}
      </div>

      <div className="samples">
        <div className="lab">or try a sample note</div>
        <div className="chips">
          {SAMPLES.map((s, i) => (
            <button
              key={i}
              className={`chip ${s.complete ? '' : 'incomplete'}`}
              onClick={() => runSample(s.es)}
              disabled={busy}
            >
              <span className="flag-es">
                ES{s.note ? ` · demo: ${s.note}` : ' · complete'}
              </span>
              {s.es}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

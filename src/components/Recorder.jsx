import React, { useState, useRef, useEffect } from 'react';
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

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onloadend = () => resolve(String(r.result).split(',')[1]);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

export default function Recorder({ onResult, busy, setBusy }) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState('');
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => () => clearInterval(timerRef.current), []);

  async function start() {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' });
        await runExtract(blob, mr.mimeType || 'audio/webm');
      };
      mediaRef.current = mr;
      mr.start();
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch (e) {
      setError('Microphone unavailable — use a sample phrase below to try it.');
    }
  }

  function stop() {
    clearInterval(timerRef.current);
    setRecording(false);
    mediaRef.current?.stop();
  }

  async function runExtract(blob, mimeType) {
    setBusy(true);
    try {
      const base64 = await blobToBase64(blob);
      const { record } = await api.extractAudio(base64, mimeType);
      onResult(record);
    } catch (e) {
      setError(e.message || 'Could not process the recording.');
    } finally {
      setBusy(false);
    }
  }

  async function runSample(text) {
    if (busy) return;
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

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <div className="rec-wrap">
      <button
        className={`rec-btn ${recording ? 'recording' : ''}`}
        onClick={recording ? stop : start}
        disabled={busy && !recording}
      >
        <span className="ico">{recording ? '■' : '🎙'}</span>
        <span className="lbl">{recording ? 'Tap to stop' : busy ? 'Working…' : 'Tap to speak'}</span>
      </button>

      <div className="rec-timer">{recording ? `${mm}:${ss}` : ''}</div>
      <div className="rec-hint">
        {recording
          ? 'Say what you sprayed, where, the rate, and when.'
          : busy
          ? <span><span className="spin" /> &nbsp;Transcribing &amp; structuring…</span>
          : error || 'Speak in Spanish or English — Campo handles both.'}
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

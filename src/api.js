async function post(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

async function get(url) {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  extractAudio: (audioBase64, mimeType) => post('/api/extract', { audioBase64, mimeType }),
  extractText: (text) => post('/api/extract', { text }),
  saveRecord: (record) => post('/api/records', record),
  getRecords: () => get('/api/records'),
  getReference: () => get('/api/reference'),
  getFarms: () => get('/api/farms'),
};

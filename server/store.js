// In-memory store for logged records. Resets on restart — fine for a demo.
// In production, back this with Firestore (AI Studio supports it natively):
// the get/add interface below is all the rest of the app depends on.

let RECORDS = [
  {
    id: 'seed-1',
    activity_type: 'pesticide_application',
    block: '4',
    product: 'Movento',
    epa_reg_no: '264-1050',
    rate_value: 6,
    rate_unit: 'oz/acre',
    acres_treated: 56,
    application_date: isoDaysAgo(1),
    start_time: '07:30',
    target_pest: 'Mealybug',
    applicator_name: null,
    language_detected: 'es',
    raw_transcript: 'Apliqué Movento en el norte cuatro, seis onzas por acre, a las siete y media.',
    transcript_english: 'I applied Movento on North 4, six ounces per acre, at seven thirty.',
    notes: null,
    confidence: 'high',
    missing_fields: [],
    flags: [],
    needs_review: false,
    status: 'logged',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'seed-2',
    activity_type: 'pesticide_application',
    block: '12',
    product: 'Bravo Weather Stik',
    epa_reg_no: '50534-188',
    rate_value: 3,
    rate_unit: 'pt/acre',
    acres_treated: 42,
    application_date: isoDaysAgo(2),
    start_time: '06:45',
    target_pest: 'Brown rot',
    applicator_name: null,
    language_detected: 'es',
    raw_transcript: 'En el río doce echamos Bravo, tres pintas por acre, temprano en la mañana.',
    transcript_english: 'On River 12 we put Bravo, three pints per acre, early in the morning.',
    notes: null,
    confidence: 'high',
    missing_fields: [],
    flags: [],
    needs_review: false,
    status: 'logged',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

function isoDaysAgo(n) {
  const d = new Date(Date.now() - n * 86400000);
  return d.toISOString().slice(0, 10);
}

export function listRecords() {
  return [...RECORDS].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

export function addRecord(rec) {
  const saved = {
    ...rec,
    id: 'rec-' + Math.random().toString(36).slice(2, 9),
    status: 'logged',
    created_at: new Date().toISOString(),
  };
  RECORDS.unshift(saved);
  return saved;
}

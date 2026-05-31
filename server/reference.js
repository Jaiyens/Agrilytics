// Demo reference data standing in for what a real deployment pulls from the
// grower's CalAgPermits permit (their blocks) and the DPR registered-product list.
// Swap these for live lookups in production; the validation logic stays identical.

export const BLOCKS = [
  { id: '1', name: 'Home Ranch 1', crop: 'Almonds', acres: 38 },
  { id: '2', name: 'Home Ranch 2', crop: 'Almonds', acres: 41 },
  { id: '4', name: 'North 4', crop: 'Pistachios', acres: 56 },
  { id: '7', name: 'Canal 7', crop: 'Wine grapes', acres: 22 },
  { id: '9', name: 'Canal 9', crop: 'Wine grapes', acres: 18 },
  { id: '12', name: 'River 12', crop: 'Almonds', acres: 42 },
  { id: '15', name: 'River 15', crop: 'Table grapes', acres: 30 },
  { id: '18', name: 'South 18', crop: 'Citrus', acres: 27 },
  { id: '20', name: 'South 20', crop: 'Citrus', acres: 33 },
];

// A small registered-product table. `restricted: true` means a Restricted Material
// that requires a Notice of Intent 24-48h BEFORE application — we surface that.
// REI = restricted-entry interval (hours), PHI = pre-harvest interval (days).
export const PRODUCTS = [
  { name: 'Roundup PowerMAX', epa: '524-549', restricted: false, rei_hours: 4, phi_days: 0, ai: 'Glyphosate' },
  { name: 'Movento', epa: '264-1050', restricted: false, rei_hours: 24, phi_days: 7, ai: 'Spirotetramat' },
  { name: 'Altacor', epa: '352-730', restricted: false, rei_hours: 4, phi_days: 10, ai: 'Chlorantraniliprole' },
  { name: 'Bravo Weather Stik', epa: '50534-188', restricted: false, rei_hours: 12, phi_days: 7, ai: 'Chlorothalonil' },
  { name: 'Sevin SL', epa: '264-333', restricted: false, rei_hours: 12, phi_days: 14, ai: 'Carbaryl' },
  { name: 'Microthiol Disperss', epa: '70506-187', restricted: false, rei_hours: 24, phi_days: 0, ai: 'Sulfur' },
  { name: 'Lannate SP', epa: '352-384', restricted: true, rei_hours: 48, phi_days: 7, ai: 'Methomyl' },
  { name: 'Paraquat (Gramoxone SL 2.0)', epa: '100-1431', restricted: true, rei_hours: 24, phi_days: 0, ai: 'Paraquat dichloride' },
];

// Loose plausibility bounds per unit, used only to flag suspicious values for human review.
const RATE_BOUNDS = {
  'qt/acre': [0.25, 16],
  'pt/acre': [0.5, 32],
  'gal/acre': [0.05, 8],
  'oz/acre': [0.5, 256],
  'lb/acre': [0.1, 50],
};

function norm(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function findProduct(spoken) {
  if (!spoken) return null;
  const n = norm(spoken);
  // exact-ish match first, then token overlap
  let best = null;
  let bestScore = 0;
  for (const p of PRODUCTS) {
    const candidates = [p.name, p.ai];
    for (const c of candidates) {
      const cn = norm(c);
      if (!cn) continue;
      let score = 0;
      if (cn === n) score = 100;
      else if (cn.includes(n) || n.includes(cn)) score = 70;
      else {
        const a = new Set(n.split(' '));
        const b = cn.split(' ');
        const overlap = b.filter((t) => a.has(t)).length;
        score = overlap > 0 ? 40 + overlap * 10 : 0;
      }
      if (score > bestScore) {
        bestScore = score;
        best = p;
      }
    }
  }
  return bestScore >= 40 ? { product: best, score: bestScore } : null;
}

function findBlock(spoken) {
  if (!spoken) return null;
  const n = norm(spoken);
  const digits = n.replace(/[^0-9]/g, '');
  for (const b of BLOCKS) {
    if (b.id === digits) return b;
    if (norm(b.name) === n || norm(b.name).includes(n)) return b;
  }
  // bare number match
  for (const b of BLOCKS) if (b.id === n) return b;
  return null;
}

// Adds a `flags` array and resolved reference data to a raw extraction.
// Each flag: { level: 'error'|'warn'|'info', field, message }
export function validateRecord(rec) {
  const flags = [];

  // Required-but-missing fields from the model
  const required = ['block', 'product', 'rate_value', 'rate_unit', 'acres_treated', 'application_date', 'start_time'];
  for (const f of required) {
    const v = rec[f];
    if (v === null || v === undefined || v === '') {
      flags.push({ level: 'error', field: f, message: 'Required for the report — not heard in the note.' });
    }
  }

  // Block resolution
  let matchedBlock = null;
  if (rec.block) {
    matchedBlock = findBlock(rec.block);
    if (!matchedBlock) {
      flags.push({
        level: 'warn',
        field: 'block',
        message: `"${rec.block}" isn't a block on this permit. Confirm before submitting.`,
      });
    }
  }

  // Product resolution + restricted-material handling
  let matchedProduct = null;
  if (rec.product) {
    const hit = findProduct(rec.product);
    if (hit) {
      matchedProduct = hit.product;
      if (hit.score < 100) {
        flags.push({
          level: 'info',
          field: 'product',
          message: `Matched to "${matchedProduct.name}" (EPA ${matchedProduct.epa}). Confirm it's the right product.`,
        });
      }
      if (matchedProduct.restricted) {
        flags.push({
          level: 'error',
          field: 'product',
          message:
            'Restricted Material — a Notice of Intent must be filed 24–48h BEFORE application. Verify an NOI was on file.',
        });
      }
    } else {
      flags.push({
        level: 'warn',
        field: 'product',
        message: `"${rec.product}" not found in the registered-product list. Confirm spelling / registration.`,
      });
    }
  }

  // Rate sanity
  if (rec.rate_value != null && rec.rate_unit) {
    const bounds = RATE_BOUNDS[rec.rate_unit];
    if (bounds && (rec.rate_value < bounds[0] || rec.rate_value > bounds[1])) {
      flags.push({
        level: 'warn',
        field: 'rate_value',
        message: `${rec.rate_value} ${rec.rate_unit} is outside the usual range — double-check.`,
      });
    }
  }

  // Acreage vs block size
  if (matchedBlock && rec.acres_treated != null && rec.acres_treated > matchedBlock.acres + 0.5) {
    flags.push({
      level: 'warn',
      field: 'acres_treated',
      message: `${rec.acres_treated} ac exceeds ${matchedBlock.name}'s ${matchedBlock.acres} ac. Confirm.`,
    });
  }

  const errorCount = flags.filter((f) => f.level === 'error').length;
  return {
    ...rec,
    epa_reg_no: rec.epa_reg_no || (matchedProduct ? matchedProduct.epa : null),
    matched_block: matchedBlock,
    matched_product: matchedProduct,
    flags,
    needs_review: errorCount > 0,
  };
}

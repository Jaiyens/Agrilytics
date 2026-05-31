// The farm network shown on the dashboard map.
// `tier: 'pilot'` = the real Central Valley operations in the pipeline (show these front-and-center).
// `tier: 'prospect'` = illustrative pins for the vision of the network. Present as pipeline, not live usage.

export const FARMS = [
  {
    id: 'home-ranch', name: 'Home Ranch Farms', operator: 'Mendez family',
    lat: 36.748, lng: -119.772, town: 'Fresno', crop: 'Almonds & grapes', acres: 320,
    tier: 'pilot', status: 'online', apps_month: 14, compliance: 'up_to_date',
    last_activity: 'Sprayed River 12 · 2h ago', lang: 'es',
  },
  {
    id: 'valley-pride', name: 'Valley Pride Orchards', operator: 'S. Khurana',
    lat: 36.96, lng: -120.06, town: 'Madera', crop: 'Pistachios', acres: 540,
    tier: 'pilot', status: 'online', apps_month: 9, compliance: 'noi_due',
    last_activity: 'Fungicide on North 4 · 40m ago', lang: 'es',
  },
  {
    id: 'kerman-west', name: 'Kerman West Farming', operator: 'T. Vang',
    lat: 36.724, lng: -120.06, town: 'Kerman', crop: 'Wine grapes', acres: 210,
    tier: 'pilot', status: 'idle', apps_month: 11, compliance: 'up_to_date',
    last_activity: 'Logged irrigation · yesterday', lang: 'es',
  },
  {
    id: 'selma-citrus', name: 'Selma Citrus Co.', operator: 'R. Alvarez',
    lat: 36.571, lng: -119.612, town: 'Selma', crop: 'Citrus', acres: 180,
    tier: 'pilot', status: 'online', apps_month: 7, compliance: 'up_to_date',
    last_activity: 'Sevin on South 18 · 5h ago', lang: 'es',
  },
  // Illustrative pipeline — the network we're building out.
  { id: 'reedley', name: 'Reedley Stone Fruit', operator: '—', lat: 36.596, lng: -119.45, town: 'Reedley', crop: 'Peaches', acres: 260, tier: 'prospect', status: 'idle', apps_month: 0, compliance: 'unknown', last_activity: 'Pipeline', lang: 'es' },
  { id: 'kingsburg', name: 'Kingsburg Vineyards', operator: '—', lat: 36.514, lng: -119.554, town: 'Kingsburg', crop: 'Raisin grapes', acres: 300, tier: 'prospect', status: 'offline', apps_month: 0, compliance: 'unknown', last_activity: 'Pipeline', lang: 'es' },
  { id: 'sanger', name: 'Sanger Tree Nuts', operator: '—', lat: 36.708, lng: -119.556, town: 'Sanger', crop: 'Walnuts', acres: 420, tier: 'prospect', status: 'idle', apps_month: 0, compliance: 'unknown', last_activity: 'Pipeline', lang: 'es' },
  { id: 'losbanos', name: 'Los Baños Row Crops', operator: '—', lat: 37.058, lng: -120.85, town: 'Los Baños', crop: 'Tomatoes', acres: 880, tier: 'prospect', status: 'offline', apps_month: 0, compliance: 'unknown', last_activity: 'Pipeline', lang: 'en' },
  { id: 'visalia', name: 'Visalia Dairy & Forage', operator: '—', lat: 36.330, lng: -119.292, town: 'Visalia', crop: 'Alfalfa', acres: 610, tier: 'prospect', status: 'idle', apps_month: 0, compliance: 'unknown', last_activity: 'Pipeline', lang: 'es' },
];

export function networkStats() {
  const pilots = FARMS.filter((f) => f.tier === 'pilot');
  const acres = pilots.reduce((s, f) => s + f.acres, 0);
  const appsMonth = pilots.reduce((s, f) => s + f.apps_month, 0);
  const compliant = pilots.filter((f) => f.compliance === 'up_to_date').length;
  return {
    pilots: pilots.length,
    prospects: FARMS.length - pilots.length,
    acres,
    appsMonth,
    compliancePct: pilots.length ? Math.round((compliant / pilots.length) * 100) : 0,
  };
}

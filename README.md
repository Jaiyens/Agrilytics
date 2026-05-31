# Agrilytics 🌾 — the operating system for the farm

**Starts with compliance — the wedge into the whole farm OS.** A farm worker or foreman speaks a short note in **Spanish or English** —
*"Apliqué en el río doce, dos cuartos por acre de Roundup, a las nueve"* — and Campo
turns it into a structured **California Pesticide Use Report**, flags anything missing,
and lets the operator review and approve before it's logged. Voice in the field; clean
compliance data in the office.

> **Wedge today, farm-OS tomorrow.** Compliance is the entry point. The same captured
> "who did what, where, when" data is the foundation for labor/payroll, input-cost
> tracking, and traceability — all built on data nobody else collects.

---

## How it works

```
🎙 voice note ──▶ Gemini (audio + responseSchema) ──▶ structured JSON
                                                          │
                          validation (blocks · products · │ rates · restricted materials)
                                                          ▼
                              👤 human review & approve ──▶ logged ──▶ filled PUR
```

- **One Google AI call does the work:** `generateContent` takes the audio and a strict
  JSON schema, returning transcription + extraction + structuring in one shot. It never
  invents a value — anything unspoken comes back `null` and gets flagged.
- **Stack:** React (Vite) client + Express server, one container, deploys to Cloud Run.
  The Gemini key lives server-side only.

## Tech / Google APIs used

- **Gemini API** `generateContent` — audio input + `responseSchema` structured output (`server/gemini.js`, `server/schema.js`)
- **Google Cloud Run** — hosting (`Dockerfile`)
- **Google AI Studio** — API key + the submission share link
- *(Production swap:)* **Firestore** for the record store — the `server/store.js` interface is all the app depends on

---

## ✅ Done vs. 👉 your steps

**Done (this repo):** full working app, the extraction schema + system prompt, the
validation/flagging layer, the field-capture UI, the manager dashboard, the official
report view + PDF print, seed data, and Cloud Run config.

**Your steps (the things I can't do for you — they need your accounts/credentials):**
1. Create a **GitHub** account + repo (account creation must be you).
2. Get a free **Gemini API key** in AI Studio.
3. Create a **Google Cloud** project and deploy.
You enter the key and passwords yourself; never paste your API key into a chat.

---

## The map (dashboard centerpiece)

The dashboard opens on the **satellite grounds of one farm** (Home Ranch, Fresno), rendered with the **Google Maps JavaScript API** (hybrid imagery). On top of the imagery:

- the focal block (**River 12**) is split into a clean, labeled grid of **courts** (~12 per acre), drawn as clickable polygons color-coded by status — **clear**, **treated today** (amber), or **restricted · re-entry interval active** (terracotta);
- **workers** with a device on appear as live pins (online ones pulse and drift); click one for their current court, today's activity, and a **location log / audit trail**;
- click any court to see exactly what was applied there, by whom, and when — the compliance payoff. "Log an application here" jumps to the voice **Field** mode;
- below the map, the **module grid** tells the OS story (Compliance live; Labor, Water, Inputs, Traceability "soon").

Why two value props ride on the same tracking: it places each application to the exact court **and** it protects the crew — a timestamped, verifiable record of where each worker was, in case of a wage dispute, theft, or safety incident in the field.

> **Google Maps needs billing.** It **requires billing enabled** on a Google Cloud project (a card on file) even within the free tier, plus a restricted key — see setup below. Without a key the dashboard shows a placeholder card and the rest of the app still runs. The data (farm, courts, workers) is seeded demo data in `server/grounds.js`; present it as a prototype, not live usage.

### Google Maps key setup (your step — can't be automated)

1. In **Google Cloud Console**, create/select a project.
2. **Enable the Maps JavaScript API** (APIs & Services → Library).
3. **Enable billing** on the project (Billing → link a card). Required even on the free tier.
4. **Create an API key** (APIs & Services → Credentials).
5. **Restrict the key:** Application restrictions → HTTP referrers → add `http://localhost:5173/*`, `http://localhost:8080/*`, and your deploy domain. API restrictions → restrict to **Maps JavaScript API**.
6. Paste it into `.env.local` as `GOOGLE_CLOUD_API_KEY=…`, then **restart `npm run dev`**. The server reads it and serves it to the client via `/api/grounds` — no `VITE_` prefix and no rebuild needed. (A `VITE_GOOGLE_MAPS_API_KEY` build-time var still works as a fallback.)

`DEMO_MAP_ID` is used by default for the Advanced Markers; for production create a Map ID (Maps → Map Management) and set `GOOGLE_CLOUD_MAP_ID`.

## Run it locally (2 min)

```bash
npm install
cp .env.example .env          # then paste your real key into .env
npm run dev                   # client on :5173, server on :8080
```
Open http://localhost:5173. Without a key the dashboard still works; the sample-phrase
chips and live mic need the key set.

Single-process (prod-style):
```bash
npm run build && npm start    # serves the built app + API on :8080
```

---

## Deploy to Cloud Run (the submission target)

**Push to GitHub first:**
```bash
git remote add origin https://github.com/<you>/campo.git
git push -u origin main
```

**Deploy (uses the Dockerfile):**
```bash
gcloud run deploy campo --source . --region us-central1 --allow-unauthenticated
```
Then in the **Cloud Run console → your service → Edit → Variables & Secrets**, add:
- `GEMINI_API_KEY` = your key  *(set it here, not on the command line)*
- `GEMINI_MODEL` = a current flash model (see note below)

You'll get a public `*.run.app` URL — that's your **Hosted Prototype** link.

**AI Studio submission link:** the brief asks for the repo "via Google AI Studio sharing
mechanics." Quickest clean route: in AI Studio create an app, use the **Share App** link,
and connect the **GitHub** repo via AI Studio's GitHub integration. The wording is
unusual — **confirm with the organizers on Discord** whether your GitHub + Cloud Run links
satisfy it, or whether the repo must originate in AI Studio.

---

## ⚠ Honest notes (read before you pitch)

- **Model string:** defaults to `gemini-2.5-flash`, which works today. Bump `GEMINI_MODEL`
  to the current flash model AI Studio shows (3.x is newer). **Do not** use
  `gemini-2.0-flash` — it's retired.
- **Storage is in-memory** and resets on restart — fine for a demo, swap to Firestore for
  persistence. The interface in `server/store.js` is the only thing to change.
- **The CalAgPermits submission is roadmap, not built.** Campo produces the filled,
  print-ready report; the third-party submission into CalAgPermits is the next integration.
  Say that plainly to judges.
- **Liability stays with the operator.** The human-approval gate is deliberate — Campo is a
  drafting aid and system of record, not the legal filer.

---

## Demo script (≈90 s, survives a live room)

0. **Grounds map.** Open on the satellite view of the farm, split into courts. "Every court is mapped; every worker with a device on is tracked live." Click a **treated-today** court → exactly what was sprayed, by whom, when. Click a **worker** → their current court + the location log: "this is how we place the application *and* protect the crew."
1. **Field mode.** Tap a Spanish sample chip (reliable) *or* record live. Watch the form fill.
2. Point at the **flagged field** on an incomplete sample — "it won't invent a rate it didn't hear; it flags it."
3. Tap **Approve & log** → the **official Pesticide Use Report** fills in. Hit **Download PDF.**
4. Back to the **module grid**: "Compliance is module one. Same field data runs labor, water, inputs — the whole farm OS."
5. Land it: *"Captured by the crew in the language they actually speak, approved by the operator, ready to file."*

Two pre-tested sample chips are your backup if the mic or network misbehaves. Later, prepend the cinematic video splash your marketing lead shoots, with an "Enter" button into this dashboard.

---

### (legacy 90s script kept below for reference)


1. **Field mode.** Tap a Spanish sample chip (reliable) *or* record live. Watch the form fill.
2. Point at the **flagged field** on an incomplete sample — "it won't invent a rate it didn't hear; it flags it."
3. Tap **Approve & log.**
4. **Office mode.** Open the logged record → the **official Pesticide Use Report** fills in. Hit **Download PDF**.
5. Land it: *"Captured by the crew in the language they actually speak, approved by the operator, ready to file."*

Two pre-tested sample chips are your backup if the mic or network misbehaves.

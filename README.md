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

The dashboard opens on a **dark live map of the San Joaquin Valley** with farm pins (pilots glow amber, online farms pulse), a network stat strip, a slide-in farm detail panel, and the **module grid** that tells the OS story (Compliance live; Labor, Water, Inputs, Traceability "soon").

It uses **MapLibre GL + a free CARTO dark style — no API key, no billing, works immediately.** That's deliberate: the "built with Gemini" requirement is met by the voice engine, not the map.

**Want the "full Google stack" story instead?** Swap to the Google Maps JavaScript API. Note: Google Maps **requires billing enabled** on a Google Cloud project (a card on file) even within the free tier, plus a restricted key. It's a contained swap in `NetworkMap.jsx`, but you must set up billing yourself.

> The farm pins are seeded data. **4 are your real Fresno-area pilots** (tagged "Pilot"); the rest are pipeline. When you pitch, present them as pipeline, not live paying users.

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

0. **Network map.** Open on the dark valley map — pins pulsing. "Every pin is a Central Valley operation logging field work by voice." Click a pilot farm → its crop, acres, compliance status, recent activity.
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

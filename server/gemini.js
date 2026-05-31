import { GoogleGenAI } from '@google/genai';
import { RESPONSE_SCHEMA, systemPrompt } from './schema.js';

// Model is configurable. 2.5-flash works today; newer flash models (3.x) are better.
// Do NOT use gemini-2.0-flash (retired). Check Google AI Studio for the current default.
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

let ai = null;
function client() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set. Add it to your environment (see .env.example).');
  }
  if (!ai) ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return ai;
}

// input is either { audioBase64, mimeType } or { text }
export async function extractRecord(input) {
  const today = new Date().toISOString().slice(0, 10);
  const parts = [];

  if (input.audioBase64) {
    parts.push({
      inlineData: {
        mimeType: input.mimeType || 'audio/webm',
        data: input.audioBase64,
      },
    });
    parts.push({ text: 'Transcribe and structure this spoken field note.' });
  } else if (input.text) {
    parts.push({ text: `Structure this spoken field note (provided as text):\n"${input.text}"` });
  } else {
    throw new Error('No audio or text provided.');
  }

  const response = await client().models.generateContent({
    model: MODEL,
    contents: [{ role: 'user', parts }],
    config: {
      systemInstruction: systemPrompt(today),
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA,
      temperature: 0,
    },
  });

  const text = response.text;
  if (!text) throw new Error('Empty response from the model.');

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    // very defensive: strip any stray code fences and retry
    const cleaned = text.replace(/```json|```/g, '').trim();
    parsed = JSON.parse(cleaned);
  }
  return parsed;
}

export { MODEL };

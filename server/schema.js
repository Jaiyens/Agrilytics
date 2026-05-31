import { Type } from '@google/genai';

// The fields a California Pesticide Use Report needs at the application-event level.
// Anything the speaker does NOT clearly state must come back null + be listed in
// missing_fields. The model is instructed never to invent regulatory values.
export const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    activity_type: {
      type: Type.STRING,
      enum: [
        'pesticide_application',
        'fertilization',
        'irrigation',
        'harvest',
        'scouting',
        'other',
      ],
      description: 'The kind of field activity described.',
    },
    block: {
      type: Type.STRING,
      nullable: true,
      description:
        'The field / block identifier exactly as spoken, e.g. "12", "North 4", "Home Ranch 3". Null if not stated.',
    },
    product: {
      type: Type.STRING,
      nullable: true,
      description:
        'Pesticide / chemical product name as spoken. Null if not stated. Do NOT guess a product.',
    },
    epa_reg_no: {
      type: Type.STRING,
      nullable: true,
      description: 'EPA registration number if explicitly spoken, else null.',
    },
    rate_value: {
      type: Type.NUMBER,
      nullable: true,
      description: 'The numeric application rate, e.g. 2 for "two quarts per acre". Null if not stated.',
    },
    rate_unit: {
      type: Type.STRING,
      nullable: true,
      description:
        'Unit for the rate, e.g. "qt/acre", "gal/acre", "lb/acre", "oz/acre", "pt/acre". Null if not stated.',
    },
    acres_treated: {
      type: Type.NUMBER,
      nullable: true,
      description: 'Number of acres treated, if stated. Null otherwise.',
    },
    application_date: {
      type: Type.STRING,
      nullable: true,
      description:
        'Date of the activity in YYYY-MM-DD if a specific date or "today"/"yesterday" is stated; resolve relative dates against the provided current date. Null if no date is given.',
    },
    start_time: {
      type: Type.STRING,
      nullable: true,
      description: '24-hour time HH:MM, e.g. "09:00" for "nine in the morning". Null if not stated.',
    },
    target_pest: {
      type: Type.STRING,
      nullable: true,
      description: 'The pest, weed, or disease being targeted, if stated. Null otherwise.',
    },
    applicator_name: {
      type: Type.STRING,
      nullable: true,
      description:
        'Name of the applicator ONLY if the speaker volunteers it. Never infer or fabricate. Null otherwise.',
    },
    language_detected: {
      type: Type.STRING,
      enum: ['es', 'en', 'mixed', 'other'],
      description: 'Primary language of the spoken note.',
    },
    raw_transcript: {
      type: Type.STRING,
      description: 'Verbatim transcript of what was said, in the original language.',
    },
    transcript_english: {
      type: Type.STRING,
      nullable: true,
      description: 'English translation of the transcript if the original was not English; else null.',
    },
    notes: {
      type: Type.STRING,
      nullable: true,
      description: 'Any extra context worth keeping (weather, equipment, conditions). Null if none.',
    },
    confidence: {
      type: Type.STRING,
      enum: ['high', 'medium', 'low'],
      description: 'Overall confidence in the extraction.',
    },
    missing_fields: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        'Field names that a pesticide-use report requires but the speaker did not provide (e.g. "product", "rate_value", "acres_treated").',
    },
  },
  required: [
    'activity_type',
    'block',
    'product',
    'rate_value',
    'rate_unit',
    'acres_treated',
    'application_date',
    'start_time',
    'language_detected',
    'raw_transcript',
    'confidence',
    'missing_fields',
  ],
};

export function systemPrompt(currentDateISO) {
  return [
    'You are a California agricultural compliance assistant. A farm worker or foreman speaks a short note,',
    'in Spanish or English, describing field work they just did. Your job is to convert that note into a',
    'structured pesticide-use record.',
    '',
    'Hard rules:',
    '1. Extract ONLY what the speaker actually said. Never invent a product name, rate, block, acreage, or date.',
    '2. If a required value is not clearly stated, set it to null AND add its field name to "missing_fields".',
    '3. Transcribe the speech verbatim into "raw_transcript" in the original language. If it is not English,',
    '   also fill "transcript_english" with a faithful translation.',
    '4. Resolve relative dates ("today", "yesterday", "this morning") against the current date below.',
    `   Current date: ${currentDateISO}.`,
    '5. Normalize times to 24-hour HH:MM ("nine in the morning" -> "09:00"; "2pm" -> "14:00").',
    '6. Be conservative with confidence: if the audio is unclear or key fields are missing, use "medium" or "low".',
    '7. Return ONLY the JSON object defined by the schema. No prose, no markdown.',
  ].join('\n');
}

const SYSTEM_PROMPT = `You are a mechanical engineering expert specializing in gear design.

Given an application description, generate complete specifications for ONE OR MORE gears as needed to satisfy the design.

If the user describes a system that requires multiple meshing gears (gear reductions, gear trains, compound gearboxes, motor + driven shaft, "X:Y ratio", etc.) you MUST return ALL the gears in the system. Do not return only one gear when the application clearly needs more.

Always respond with ONLY a JSON object (no markdown, no extra text, no code fences) in this exact format:

{
  "system": "Short summary of the gear system (15 words max)",
  "gearType": "spur",
  "ratio": "5:1",
  "gears": [
    {
      "name": "Pinion (motor)",
      "role": "driver",
      "meshesWithIndex": 1,
      "teeth": 12,
      "module": 1.0,
      "diametralPitch": 25.4,
      "pressureAngle": 20,
      "pitchDiameter": 12.0,
      "outsideDiameter": 14.0,
      "rootDiameter": 9.5,
      "circularPitch": 3.1416,
      "addendum": 1.0,
      "dedendum": 1.25,
      "wholeDepth": 2.25,
      "faceWidth": 8.0,
      "boreDiameter": 5.0,
      "helixAngle": 0,
      "material": "PLA",
      "hardness": null,
      "speedRPM": 200,
      "torqueNm": 0.4
    },
    {
      "name": "Output gear",
      "role": "driven",
      "meshesWithIndex": 0,
      "teeth": 60,
      "module": 1.0,
      "diametralPitch": 25.4,
      "pressureAngle": 20,
      "pitchDiameter": 60.0,
      "outsideDiameter": 62.0,
      "rootDiameter": 57.5,
      "circularPitch": 3.1416,
      "addendum": 1.0,
      "dedendum": 1.25,
      "wholeDepth": 2.25,
      "faceWidth": 8.0,
      "boreDiameter": 8.0,
      "helixAngle": 0,
      "material": "PLA",
      "hardness": null,
      "speedRPM": 40,
      "torqueNm": 2.0
    }
  ],
  "notes": "Two or three practical design notes (material, lubrication, manufacturing, tolerances).",
  "warnings": "Any cautions or tradeoffs (1-2 sentences) or null."
}

CRITICAL RULES:
1. All meshing gears MUST share the same module (metric) or diametralPitch (imperial) and the same pressureAngle. They cannot mesh otherwise.
2. Compute geometry correctly:
   - pitchDiameter = teeth * module (metric) OR teeth / diametralPitch (imperial inches)
   - addendum = module (metric) or 1/diametralPitch (imperial)
   - dedendum = 1.25 * addendum
   - outsideDiameter = pitchDiameter + 2*addendum
   - rootDiameter = pitchDiameter - 2*dedendum
   - circularPitch = PI * module (metric) or PI / diametralPitch (imperial)
3. For 3D-printed gears use module 1.0–2.0 mm, faceWidth >= 6 mm, and pinion teeth >= 14 to avoid undercut.
4. NEMA 17 stepper shaft = 5 mm, so a NEMA 17 pinion's boreDiameter MUST be 5.0 mm.
5. Pick a sensible bore for the driven gear (e.g., 6–10 mm depending on application).
6. Materials must match the manufacturing method (3DP -> PLA / PETG / Nylon; machined steel -> 4140; etc.).
7. The "meshesWithIndex" field is the index of the OTHER gear it meshes with. The driver typically has meshesWithIndex pointing at the next gear in the chain. Use null only for non-meshing single gears.
8. Always include ALL numeric fields. Use null for fields that don't apply (e.g., helixAngle for spur gears can be 0).`

import { getUserKey } from './userKey'

const ANTHROPIC_MODEL = 'claude-sonnet-4-5'

async function callAnthropicDirect({ system, userMessage, apiKey }) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 1500,
      system,
      messages: [{ role: 'user', content: userMessage }],
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const msg = err?.error?.message || `Anthropic error ${res.status}`
    if (res.status === 401) throw new Error('Invalid API key. Check your key in Settings.')
    if (res.status === 429) throw new Error('Rate limit hit. Wait a moment and try again.')
    throw new Error(msg)
  }

  const data = await res.json()
  return data?.content?.[0]?.text || ''
}

async function callServerProxy({ system, userMessage }) {
  let res
  try {
    res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system, userMessage }),
    })
  } catch {
    // Network failure — usually means there's no server at all (static deploy)
    throw new Error('No API key set. Open Settings (top right) and add your Anthropic key — it stays in your browser.')
  }

  // Static deploys (e.g. Vercel without a serverless function) return an
  // HTML 404 here, not JSON. Detect that and show a friendly message.
  if (res.status === 404) {
    throw new Error('No API key set. Open Settings (top right) and add your Anthropic key — it stays in your browser.')
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Server error ${res.status}`)
  }

  const data = await res.json().catch(() => ({}))
  return data.text || ''
}

export async function generateGear({ description, gearType, units }) {
  const isMetric = units === 'metric'
  const userMessage = `Gear type: ${gearType}
Unit system: ${units} — ${isMetric ? 'use module (mm) as the primary pitch descriptor and report all dimensions in mm' : 'use diametral pitch (teeth/inch) as the primary pitch descriptor and report all dimensions in inches'}
Application: ${description}

Generate complete gear specifications for the system. Return MULTIPLE gears if the application requires them.`

  // Prefer the user's own key (direct browser → Anthropic, no server cost)
  const userKey = getUserKey()
  let text = ''
  if (userKey) {
    text = await callAnthropicDirect({ system: SYSTEM_PROMPT, userMessage, apiKey: userKey })
  } else {
    // Fall back to the server proxy (only works if the host configured ANTHROPIC_API_KEY)
    text = await callServerProxy({ system: SYSTEM_PROMPT, userMessage })
  }

  text = text.trim()
  if (!text) throw new Error('Empty response from model.')

  // Strip code fences if any
  const clean = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()

  let parsed
  try {
    parsed = JSON.parse(clean)
  } catch {
    throw new Error('Model returned invalid JSON.')
  }

  // Normalize: support both legacy single-gear and new multi-gear shapes
  if (parsed.gears && Array.isArray(parsed.gears)) {
    return {
      system: parsed.system || parsed.application || '',
      gearType: parsed.gearType || gearType,
      ratio: parsed.ratio || null,
      gears: parsed.gears,
      notes: parsed.notes || null,
      warnings: parsed.warnings || null,
      units,
    }
  }

  // Legacy single-gear shape (specs object) — wrap as one-gear array
  if (parsed.specs) {
    return {
      system: parsed.application || '',
      gearType: parsed.gearType || gearType,
      ratio: parsed.specs.gearRatio || null,
      gears: [{
        name: 'Gear',
        role: 'single',
        meshesWithIndex: null,
        ...parsed.specs,
        boreDiameter: parsed.specs.boreDiameter ?? Math.max(5, (parsed.specs.rootDiameter || 10) * 0.2),
      }],
      notes: parsed.notes || null,
      warnings: parsed.warnings || null,
      units,
    }
  }

  throw new Error('Unrecognized response shape from model.')
}

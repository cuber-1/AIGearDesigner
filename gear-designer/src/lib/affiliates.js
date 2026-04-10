/**
 * Affiliate links / recommended parts.
 *
 * Set your Amazon Associates tag in .env as VITE_AMAZON_TAG=yourtag-20
 * Sign up at https://affiliate-program.amazon.com (free, takes ~10 minutes).
 *
 * Until you do, links still work — they just won't earn commission.
 */
export const AMAZON_TAG = import.meta.env.VITE_AMAZON_TAG || ''

const PRODUCTS = [
  {
    id: 'nema17',
    triggers: [/nema\s*-?\s*17/i],
    name: 'NEMA 17 Stepper Motor',
    description: '1.8° hybrid stepper · 5mm shaft · standard for 3DP/CNC',
    icon: '⚡',
    search: 'nema 17 stepper motor 1.8 degree',
  },
  {
    id: 'nema23',
    triggers: [/nema\s*-?\s*23/i],
    name: 'NEMA 23 Stepper Motor',
    description: 'Higher-torque stepper · 6.35mm or 8mm shaft',
    icon: '⚡',
    search: 'nema 23 stepper motor',
  },
  {
    id: 'pla',
    triggers: [/\bpla\b/i],
    name: 'PLA Filament (1.75mm)',
    description: 'Easy-printing biopolymer · matte / silk / standard',
    icon: '🧵',
    search: 'pla filament 1.75mm 1kg',
  },
  {
    id: 'petg',
    triggers: [/\bpet\s*-?\s*g\b/i],
    name: 'PETG Filament (1.75mm)',
    description: 'Tougher than PLA · good for functional parts',
    icon: '🧵',
    search: 'petg filament 1.75mm 1kg',
  },
  {
    id: 'nylon',
    triggers: [/\bnylon\b|\bpa\b|\bpa12\b/i],
    name: 'Nylon Filament (1.75mm)',
    description: 'Wear-resistant · ideal for printed gears',
    icon: '🧵',
    search: 'nylon filament 1.75mm 3d printing',
  },
  {
    id: 'abs',
    triggers: [/\babs\b/i],
    name: 'ABS Filament (1.75mm)',
    description: 'Heat-resistant engineering plastic',
    icon: '🧵',
    search: 'abs filament 1.75mm 1kg',
  },
  {
    id: 'bearing5mm',
    triggers: [/\b5\s*mm\b.*bore|bore.*\b5\s*mm\b|nema\s*-?\s*17/i],
    name: '5mm Bore Ball Bearings (605zz)',
    description: 'Precision shielded bearings for 5mm shafts',
    icon: '◯',
    search: '605zz bearing 5mm bore',
  },
  {
    id: 'bearing8mm',
    triggers: [/\b8\s*mm\b.*bore|bore.*\b8\s*mm\b|\b608\b/i],
    name: '8mm Bore Ball Bearings (608zz)',
    description: 'The classic skate bearing · 8mm shaft',
    icon: '◯',
    search: '608zz bearing 8mm',
  },
  {
    id: 'coupler',
    triggers: [/nema|stepper|motor/i],
    name: 'Flexible Shaft Coupler',
    description: 'Couples motor shaft to driven shaft · misalignment-tolerant',
    icon: '🔗',
    search: 'flexible shaft coupler 5mm 8mm',
  },
  {
    id: 'steel4140',
    triggers: [/4140|steel.*hardened/i],
    name: '4140 Alloy Steel Round Bar',
    description: 'Heat-treatable alloy for gear blanks',
    icon: '🔩',
    search: '4140 steel round bar',
  },
  {
    id: 'brass',
    triggers: [/\bbrass\b/i],
    name: 'Brass Round Stock',
    description: 'Free-machining 360 brass for fine gears',
    icon: '🟡',
    search: 'brass round stock 360',
  },
  {
    id: 'aluminum',
    triggers: [/aluminum|aluminium|6061/i],
    name: '6061 Aluminum Round Bar',
    description: 'Lightweight machinable aluminum stock',
    icon: '⬜',
    search: '6061 aluminum round bar',
  },
  {
    id: 'grease',
    triggers: [/lubric|grease|oil|lithium/i],
    name: 'White Lithium Grease',
    description: 'Long-lasting gear lubricant',
    icon: '🧴',
    search: 'white lithium grease tube',
  },
  {
    id: 'calipers',
    triggers: [/.*/], // always shown
    name: 'Digital Calipers (150mm)',
    description: 'Measure gears & bores to 0.01mm',
    icon: '📏',
    search: 'digital calipers 150mm 0.01mm',
  },
]

function buildUrl(product) {
  const tagParam = AMAZON_TAG ? `&tag=${encodeURIComponent(AMAZON_TAG)}` : ''
  return `https://www.amazon.com/s?k=${encodeURIComponent(product.search)}${tagParam}`
}

/**
 * Given a generation result, return up to `limit` relevant product cards.
 * Always includes calipers as a generic fallback.
 */
export function findProducts(result, limit = 6) {
  if (!result) return []

  const haystack = [
    result.system,
    result.gearType,
    result.notes,
    ...result.gears.flatMap(g => [
      g.name,
      g.role,
      g.material,
      g.hardness,
      g.boreDiameter ? `${g.boreDiameter}mm bore` : '',
    ]),
  ].filter(Boolean).join(' ').toLowerCase()

  const matched = []
  const seen = new Set()
  for (const p of PRODUCTS) {
    if (seen.has(p.id)) continue
    if (p.triggers.some(re => re.test(haystack))) {
      matched.push({ ...p, url: buildUrl(p) })
      seen.add(p.id)
    }
    if (matched.length >= limit) break
  }
  return matched
}

export function hasAffiliateTag() {
  return Boolean(AMAZON_TAG)
}

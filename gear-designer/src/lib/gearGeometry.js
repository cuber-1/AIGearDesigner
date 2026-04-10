import * as THREE from 'three'

/**
 * Convert a gear spec (whatever units) into millimeters so all 3D math
 * is unit-consistent. Imperial inches are converted with 25.4 mm/in.
 */
export function specInMm(gear, units) {
  const k = units === 'imperial' ? 25.4 : 1
  return {
    teeth: gear.teeth,
    module: (gear.module ?? (gear.diametralPitch ? 25.4 / gear.diametralPitch : 1)),
    pressureAngle: gear.pressureAngle ?? 20,
    pitchDiameter: (gear.pitchDiameter ?? gear.teeth * (gear.module ?? 1)) * k,
    outsideDiameter: (gear.outsideDiameter ?? 0) * k,
    rootDiameter: (gear.rootDiameter ?? 0) * k,
    addendum: (gear.addendum ?? gear.module ?? 1) * k,
    dedendum: (gear.dedendum ?? 1.25 * (gear.module ?? 1)) * k,
    faceWidth: (gear.faceWidth ?? 8) * k,
    boreDiameter: (gear.boreDiameter ?? Math.max(5, (gear.rootDiameter ?? 10) * 0.25)) * k,
    helixAngle: gear.helixAngle ?? 0,
  }
}

/**
 * Build an extruded 3D gear geometry from a normalized (mm) spec.
 * Uses a simplified trapezoidal tooth profile — visually convincing,
 * 3D-print-ready, and much cheaper than full involute tooth math.
 */
export function buildGearGeometry(specMm) {
  const {
    teeth,
    pitchDiameter,
    outsideDiameter,
    rootDiameter,
    faceWidth,
    boreDiameter,
    helixAngle,
  } = specMm

  const ra = outsideDiameter / 2
  const rp = pitchDiameter / 2
  const rr = rootDiameter / 2
  const rb = Math.max(1.5, boreDiameter / 2)

  const shape = new THREE.Shape()
  const toothAngle = (Math.PI * 2) / teeth
  // Tooth thickness ratio at tip vs root — gives a slightly tapered tooth
  const tipHalf = toothAngle * 0.18
  const rootHalf = toothAngle * 0.32

  for (let i = 0; i < teeth; i++) {
    const base = i * toothAngle
    const a0 = base - rootHalf // start of root flank
    const a1 = base - tipHalf  // start of tip
    const a2 = base + tipHalf  // end of tip
    const a3 = base + rootHalf // end of root flank
    const a4 = base + toothAngle - rootHalf // start of next tooth's root

    const p = (r, a) => [r * Math.cos(a), r * Math.sin(a)]

    if (i === 0) shape.moveTo(...p(rr, a0))
    shape.lineTo(...p(rr, a0))
    shape.lineTo(...p(ra, a1))
    shape.lineTo(...p(ra, a2))
    shape.lineTo(...p(rr, a3))
    // Walk along the root toward the next tooth
    shape.lineTo(...p(rr, a4))
  }
  shape.closePath()

  // Bore as a hole
  const hole = new THREE.Path()
  hole.absarc(0, 0, rb, 0, Math.PI * 2, true)
  shape.holes.push(hole)

  const bevel = Math.min(faceWidth * 0.04, 0.4)
  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: faceWidth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelOffset: 0,
    bevelSegments: 2,
    curveSegments: 24,
    steps: helixAngle && helixAngle > 0.5 ? 16 : 1,
  })

  // Apply helix twist if requested
  if (helixAngle && helixAngle > 0.5) {
    const twistTotal = THREE.MathUtils.degToRad(helixAngle)
    const pos = geom.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      const z = pos.getZ(i)
      const t = z / faceWidth // 0..1 along axis
      const ang = twistTotal * t
      const c = Math.cos(ang)
      const s = Math.sin(ang)
      pos.setXY(i, x * c - y * s, x * s + y * c)
    }
    pos.needsUpdate = true
  }

  // Center the extrusion on Z so the gear sits flat at z=0
  geom.translate(0, 0, -faceWidth / 2)
  geom.computeVertexNormals()
  return geom
}

/**
 * Lay out gears along the X axis so each one meshes with the previous.
 * Returns an array of { x, y, z } centers in mm.
 */
export function layoutGears(specsMm) {
  const positions = [{ x: 0, y: 0, z: 0 }]
  for (let i = 1; i < specsMm.length; i++) {
    const prev = specsMm[i - 1]
    const curr = specsMm[i]
    const centerDist = (prev.pitchDiameter + curr.pitchDiameter) / 2
    positions.push({
      x: positions[i - 1].x + centerDist,
      y: 0,
      z: 0,
    })
  }
  // Re-center the entire chain on origin for nicer camera framing
  const minX = positions[0].x
  const maxX = positions[positions.length - 1].x
  const offset = (minX + maxX) / 2
  return positions.map(p => ({ x: p.x - offset, y: p.y, z: p.z }))
}

/**
 * For meshing gears, compute proper rotation speed ratios so adjacent gears
 * counter-rotate with the right velocity. The first gear is the reference.
 */
export function computeRotationRatios(specsMm) {
  const ratios = [1]
  for (let i = 1; i < specsMm.length; i++) {
    ratios.push(-ratios[i - 1] * (specsMm[i - 1].teeth / specsMm[i].teeth))
  }
  return ratios
}

/**
 * Phase offset per gear so meshing teeth interlock visually.
 * Assumes gears are laid out along +X with each meshing the previous one.
 */
export function computePhaseOffsets(specsMm) {
  // Each gear (after the first) gets a phase offset that places a tooth gap
  // at its local angle pi — the side facing the previous gear it meshes with.
  const offsets = [0]
  for (let i = 1; i < specsMm.length; i++) {
    const N = specsMm[i].teeth
    const phase = N % 2 === 0 ? Math.PI / N : 0
    offsets.push(phase)
  }
  return offsets
}

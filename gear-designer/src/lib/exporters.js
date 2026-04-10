import * as THREE from 'three'
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js'
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import { buildGearGeometry, specInMm, layoutGears } from './gearGeometry'

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1500)
}

function downloadText(text, filename, mime = 'text/plain') {
  downloadBlob(new Blob([text], { type: mime }), filename)
}

/**
 * Build a Group containing all gears in the result, positioned correctly.
 * Used for whole-system exports (single STL containing all gears).
 */
function buildSystemGroup(result) {
  const specs = result.gears.map(g => specInMm(g, result.units))
  const positions = layoutGears(specs)
  const group = new THREE.Group()
  specs.forEach((spec, i) => {
    const geo = buildGearGeometry(spec)
    const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xb0b0b0 }))
    mesh.position.set(positions[i].x, positions[i].y, positions[i].z)
    // Lay flat so STL has the gear face on the build plate
    mesh.rotation.x = Math.PI / 2
    mesh.name = result.gears[i].name || `gear_${i + 1}`
    group.add(mesh)
  })
  return group
}

function buildSingleGearMesh(result, index) {
  const spec = specInMm(result.gears[index], result.units)
  const geo = buildGearGeometry(spec)
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xb0b0b0 }))
  mesh.rotation.x = Math.PI / 2 // lay the gear flat for printing
  mesh.name = result.gears[index].name || `gear_${index + 1}`
  return mesh
}

/* ---------- STL ---------- */
export function exportSTL(result, { index = null } = {}) {
  const exporter = new STLExporter()
  let object
  let filename
  if (index === null) {
    object = buildSystemGroup(result)
    filename = `${slug(result.system || 'gear-system')}.stl`
  } else {
    object = buildSingleGearMesh(result, index)
    filename = `${slug(result.gears[index].name || `gear-${index + 1}`)}.stl`
  }
  const stl = exporter.parse(object, { binary: true })
  downloadBlob(new Blob([stl], { type: 'model/stl' }), filename)
}

/* ---------- OBJ ---------- */
export function exportOBJ(result, { index = null } = {}) {
  const exporter = new OBJExporter()
  let object, filename
  if (index === null) {
    object = buildSystemGroup(result)
    filename = `${slug(result.system || 'gear-system')}.obj`
  } else {
    object = buildSingleGearMesh(result, index)
    filename = `${slug(result.gears[index].name || `gear-${index + 1}`)}.obj`
  }
  const text = exporter.parse(object)
  downloadText(text, filename, 'text/plain')
}

/* ---------- GLTF / GLB ---------- */
export function exportGLTF(result, { index = null, binary = true } = {}) {
  const exporter = new GLTFExporter()
  const object = index === null ? buildSystemGroup(result) : buildSingleGearMesh(result, index)
  const filename = (index === null
    ? slug(result.system || 'gear-system')
    : slug(result.gears[index].name || `gear-${index + 1}`)) + (binary ? '.glb' : '.gltf')

  return new Promise((resolve, reject) => {
    exporter.parse(
      object,
      (data) => {
        if (binary) {
          downloadBlob(new Blob([data], { type: 'model/gltf-binary' }), filename)
        } else {
          downloadText(JSON.stringify(data, null, 2), filename, 'model/gltf+json')
        }
        resolve()
      },
      (err) => reject(err),
      { binary }
    )
  })
}

/* ---------- JSON spec sheet ---------- */
export function exportJSON(result) {
  downloadText(
    JSON.stringify(result, null, 2),
    `${slug(result.system || 'gear-system')}-specs.json`,
    'application/json'
  )
}

/* ---------- CSV spec sheet ---------- */
export function exportCSV(result) {
  const fields = [
    'name', 'role', 'teeth', 'module', 'diametralPitch', 'pressureAngle',
    'pitchDiameter', 'outsideDiameter', 'rootDiameter', 'addendum', 'dedendum',
    'wholeDepth', 'circularPitch', 'faceWidth', 'boreDiameter', 'helixAngle',
    'material', 'hardness', 'speedRPM', 'torqueNm',
  ]
  const header = fields.join(',')
  const rows = result.gears.map(g => fields.map(f => {
    const v = g[f]
    if (v == null) return ''
    if (typeof v === 'string') return `"${v.replace(/"/g, '""')}"`
    return v
  }).join(','))
  downloadText(
    [header, ...rows].join('\n'),
    `${slug(result.system || 'gear-system')}-specs.csv`,
    'text/csv'
  )
}

function slug(str) {
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50) || 'gear'
}

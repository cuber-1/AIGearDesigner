import { useMemo, useRef, useState, forwardRef, useImperativeHandle } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows, Grid } from '@react-three/drei'
import * as THREE from 'three'
import {
  specInMm,
  buildGearGeometry,
  layoutGears,
  computeRotationRatios,
  computePhaseOffsets,
} from '../lib/gearGeometry'

const PALETTE = [
  '#d9b25c', // gold
  '#a8a8a0', // steel
  '#c98a5e', // copper
  '#7b8a99', // graphite
  '#9e8f73', // brass
]

function GearMesh({ geometry, color, position, rotationY, ratio, phase, paused, selected, onSelect, index }) {
  const ref = useRef()
  const groupRef = useRef()

  useFrame((state, delta) => {
    if (paused) return
    if (groupRef.current) {
      // The shaft is along Z because the extrusion goes into +Z; rotate around Z.
      groupRef.current.rotation.z += delta * 0.6 * ratio
    }
  })

  return (
    <group position={[position.x, position.y, position.z]} rotation={[Math.PI / 2, 0, 0]}>
      <group ref={groupRef} rotation={[0, 0, phase]}>
        <mesh
          ref={ref}
          geometry={geometry}
          castShadow
          receiveShadow
          onClick={(e) => { e.stopPropagation(); onSelect(index) }}
          onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer' }}
          onPointerOut={() => { document.body.style.cursor = 'auto' }}
        >
          <meshStandardMaterial
            color={color}
            metalness={0.55}
            roughness={0.32}
            envMapIntensity={0.85}
            emissive={selected ? color : '#000000'}
            emissiveIntensity={selected ? 0.15 : 0}
          />
        </mesh>
      </group>
    </group>
  )
}

const Scene = forwardRef(function Scene(
  { result, paused, selectedIndex, onSelect, exposeMeshes },
  ref
) {
  const meshGroup = useRef()

  const { specsMm, geometries, positions, ratios, phases } = useMemo(() => {
    const specs = result.gears.map(g => specInMm(g, result.units))
    const geos = specs.map(buildGearGeometry)
    const pos = layoutGears(specs)
    const r = computeRotationRatios(specs)
    const ph = computePhaseOffsets(specs)
    return { specsMm: specs, geometries: geos, positions: pos, ratios: r, phases: ph }
  }, [result])

  useImperativeHandle(ref, () => ({
    getGeometries: () => geometries,
    getSpecsMm: () => specsMm,
  }), [geometries, specsMm])

  // Auto-frame: pick a camera distance that fits the gear chain
  const fitDistance = useMemo(() => {
    const maxOD = Math.max(...specsMm.map(s => s.outsideDiameter))
    const totalSpan = positions[positions.length - 1].x - positions[0].x + maxOD
    return Math.max(80, totalSpan * 1.4)
  }, [specsMm, positions])

  return (
    <>
      <color attach="background" args={['#1a1815']} />
      <fog attach="fog" args={['#1a1815', fitDistance * 1.6, fitDistance * 4]} />

      <ambientLight intensity={0.35} />
      <directionalLight
        position={[fitDistance, fitDistance, fitDistance * 0.8]}
        intensity={1.4}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={fitDistance * 4}
        shadow-camera-left={-fitDistance}
        shadow-camera-right={fitDistance}
        shadow-camera-top={fitDistance}
        shadow-camera-bottom={-fitDistance}
      />
      <directionalLight position={[-fitDistance, fitDistance * 0.4, -fitDistance * 0.5]} intensity={0.4} />

      <Environment preset="studio" />

      <group ref={meshGroup}>
        {geometries.map((geo, i) => (
          <GearMesh
            key={i}
            index={i}
            geometry={geo}
            color={PALETTE[i % PALETTE.length]}
            position={positions[i]}
            ratio={ratios[i]}
            phase={phases[i]}
            paused={paused}
            selected={selectedIndex === i}
            onSelect={onSelect}
          />
        ))}
      </group>

      <ContactShadows
        position={[0, -Math.max(...specsMm.map(s => s.outsideDiameter)) / 2 - 1, 0]}
        opacity={0.45}
        scale={fitDistance * 1.5}
        blur={2.4}
        far={fitDistance}
      />

      <Grid
        position={[0, -Math.max(...specsMm.map(s => s.outsideDiameter)) / 2 - 1.1, 0]}
        args={[fitDistance * 3, fitDistance * 3]}
        cellSize={5}
        cellThickness={0.5}
        cellColor="#3a3833"
        sectionSize={25}
        sectionThickness={1}
        sectionColor="#5a5853"
        fadeDistance={fitDistance * 2}
        fadeStrength={1.2}
        followCamera={false}
        infiniteGrid
      />

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={20}
        maxDistance={fitDistance * 4}
        target={[0, 0, 0]}
      />
    </>
  )
})

const GearViewer3D = forwardRef(function GearViewer3D({ result, selectedIndex, onSelect }, ref) {
  const [paused, setPaused] = useState(false)
  const sceneRef = useRef()

  useImperativeHandle(ref, () => ({
    getGeometries: () => sceneRef.current?.getGeometries() || [],
    getSpecsMm: () => sceneRef.current?.getSpecsMm() || [],
  }))

  const fitDistance = useMemo(() => {
    const specs = result.gears.map(g => specInMm(g, result.units))
    const positions = layoutGears(specs)
    const maxOD = Math.max(...specs.map(s => s.outsideDiameter))
    const totalSpan = positions[positions.length - 1].x - positions[0].x + maxOD
    return Math.max(80, totalSpan * 1.4)
  }, [result])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [fitDistance * 0.8, fitDistance * 0.6, fitDistance * 0.9], fov: 38, near: 0.1, far: fitDistance * 10 }}
        gl={{ antialias: true }}
      >
        <Scene
          ref={sceneRef}
          result={result}
          paused={paused}
          selectedIndex={selectedIndex}
          onSelect={onSelect}
        />
      </Canvas>

      <div className="viewer-overlay">
        <button className="viewer-btn" onClick={() => setPaused(p => !p)}>
          {paused ? '▶ Play' : '❚❚ Pause'}
        </button>
        <span className="viewer-hint">Drag to orbit · Scroll to zoom · Right-drag to pan</span>
      </div>
    </div>
  )
})

export default GearViewer3D

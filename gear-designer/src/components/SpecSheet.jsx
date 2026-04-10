import { useState } from 'react'
import styles from './SpecSheet.module.css'

const ROLE_LABELS = {
  driver:       { label: 'Driver',      color: '#d9b25c' },
  driven:       { label: 'Driven',      color: '#7b8a99' },
  intermediate: { label: 'Idler',       color: '#9e8f73' },
  idler:        { label: 'Idler',       color: '#9e8f73' },
  pinion:       { label: 'Pinion',      color: '#c98a5e' },
  output:       { label: 'Output',      color: '#7b8a99' },
  single:       { label: 'Gear',        color: '#a8a8a0' },
}

function fmt(v, digits = 2) {
  if (v == null || Number.isNaN(v)) return '—'
  if (typeof v === 'number') return v.toFixed(digits).replace(/\.?0+$/, '')
  return String(v)
}

function GearTab({ gear, index, isSelected, onClick }) {
  const role = ROLE_LABELS[gear.role] || ROLE_LABELS.single
  return (
    <button
      className={`${styles.tab} ${isSelected ? styles.tabActive : ''}`}
      onClick={() => onClick(index)}
    >
      <span className={styles.tabDot} style={{ background: role.color }} />
      <span className={styles.tabLabel}>{gear.name || `Gear ${index + 1}`}</span>
      <span className={styles.tabTeeth}>{gear.teeth}T</span>
    </button>
  )
}

function Row({ label, value, unit }) {
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <span className={styles.rowValue}>
        <span className={styles.rowNumber}>{value}</span>
        {unit && <span className={styles.rowUnit}>{unit}</span>}
      </span>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>{title}</div>
      <div className={styles.sectionRows}>{children}</div>
    </div>
  )
}

export default function SpecSheet({ result, selectedIndex, onSelect }) {
  const isMetric = result.units === 'metric'
  const dim = isMetric ? 'mm' : 'in'
  const idx = selectedIndex ?? 0
  const gear = result.gears[idx]
  if (!gear) return null

  const role = ROLE_LABELS[gear.role] || ROLE_LABELS.single

  return (
    <div className={styles.sheet}>
      <div className={styles.header}>
        <div>
          <div className={styles.systemLabel}>Specifications</div>
          <div className={styles.systemTitle}>{result.system || 'Gear'}</div>
        </div>
        {result.ratio && (
          <div className={styles.ratioBadge}>
            <span className={styles.ratioLabel}>RATIO</span>
            <span className={styles.ratioValue}>{result.ratio}</span>
          </div>
        )}
      </div>

      {result.gears.length > 1 && (
        <div className={styles.tabs}>
          {result.gears.map((g, i) => (
            <GearTab
              key={i}
              gear={g}
              index={i}
              isSelected={i === idx}
              onClick={onSelect}
            />
          ))}
        </div>
      )}

      <div className={styles.gearHeading}>
        <span className={styles.roleBadge} style={{ background: role.color + '22', color: role.color, borderColor: role.color + '55' }}>
          {role.label}
        </span>
        <span className={styles.gearName}>{gear.name || `Gear ${idx + 1}`}</span>
        {gear.material && (
          <span className={styles.matBadge}>{[gear.material, gear.hardness].filter(Boolean).join(' · ')}</span>
        )}
      </div>

      <div className={styles.grid}>
        <Section title="Tooth & pitch">
          <Row label="Teeth (N)"        value={fmt(gear.teeth, 0)} />
          {isMetric
            ? <Row label="Module"          value={fmt(gear.module, 3)}         unit="mm" />
            : <Row label="Diametral pitch" value={fmt(gear.diametralPitch, 2)} unit="teeth/in" />}
          <Row label="Pressure angle" value={fmt(gear.pressureAngle, 1)} unit="°" />
          <Row label="Circular pitch" value={fmt(gear.circularPitch, 4)} unit={dim} />
          {gear.helixAngle ? <Row label="Helix angle" value={fmt(gear.helixAngle, 1)} unit="°" /> : null}
        </Section>

        <Section title="Geometry">
          <Row label="Pitch dia."   value={fmt(gear.pitchDiameter, 3)}   unit={dim} />
          <Row label="Outside dia." value={fmt(gear.outsideDiameter, 3)} unit={dim} />
          <Row label="Root dia."    value={fmt(gear.rootDiameter, 3)}    unit={dim} />
          <Row label="Bore"         value={fmt(gear.boreDiameter, 3)}    unit={dim} />
          <Row label="Face width"   value={fmt(gear.faceWidth, 3)}       unit={dim} />
        </Section>

        <Section title="Tooth depth">
          <Row label="Addendum"     value={fmt(gear.addendum, 4)}    unit={dim} />
          <Row label="Dedendum"     value={fmt(gear.dedendum, 4)}    unit={dim} />
          <Row label="Whole depth"  value={fmt(gear.wholeDepth, 4)}  unit={dim} />
        </Section>

        <Section title="Mechanical">
          {gear.speedRPM != null && <Row label="Speed"  value={fmt(gear.speedRPM, 0)} unit="RPM" />}
          {gear.torqueNm != null && <Row label="Torque" value={fmt(gear.torqueNm, 2)} unit="N·m" />}
          {gear.material         && <Row label="Material" value={gear.material} />}
          {gear.hardness         && <Row label="Hardness" value={gear.hardness} />}
        </Section>
      </div>
    </div>
  )
}

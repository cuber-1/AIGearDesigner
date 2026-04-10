import { useState, useRef, useEffect } from 'react'
import styles from './App.module.css'
import GearViewer3D from './components/GearViewer3D'
import SpecSheet from './components/SpecSheet'
import ExportMenu from './components/ExportMenu'
import RecommendedParts from './components/RecommendedParts'
import SettingsModal from './components/SettingsModal'
import { generateGear } from './lib/api'
import { hasUserKey } from './lib/userKey'

const GEAR_TYPES = [
  { value: 'spur', label: 'Spur' },
  { value: 'helical', label: 'Helical' },
  { value: 'bevel', label: 'Bevel' },
  { value: 'worm', label: 'Worm' },
  { value: 'rack', label: 'Rack & pinion' },
]

const EXAMPLES = [
  '5:1 reduction for a turret driven by a NEMA 17 stepper. 3D-printed in PLA, shaft is 5mm.',
  'A small spur gear pinion that meshes with a 60-tooth output for a desk-clock movement.',
  'Compound 9:1 reduction for a robotic arm joint. Module 1.5, machined in steel.',
]

export default function App() {
  const [description, setDescription] = useState('')
  const [gearType, setGearType] = useState('spur')
  const [units, setUnits] = useState('metric')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [keyPresent, setKeyPresent] = useState(hasUserKey())
  const viewerRef = useRef(null)

  // Re-check key presence whenever the settings modal closes
  useEffect(() => {
    if (!settingsOpen) setKeyPresent(hasUserKey())
  }, [settingsOpen])

  async function handleGenerate() {
    if (!description.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    setSelectedIndex(0)
    try {
      const gear = await generateGear({ description, gearType, units })
      setResult(gear)
    } catch (e) {
      setError(e.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.logo}>⚙</span>
          <span className={styles.logoText}>Gear Designer</span>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.tagPill}>AI · 3D · Print-ready</span>
          <button
            className={`${styles.settingsBtn} ${keyPresent ? styles.settingsBtnOk : ''}`}
            onClick={() => setSettingsOpen(true)}
            title={keyPresent ? 'API key configured' : 'Add your API key'}
          >
            <span className={styles.settingsIcon}>⚙</span>
            <span className={styles.settingsLabel}>{keyPresent ? 'Key set' : 'Add key'}</span>
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          <span className={styles.heroBadge}>Live calculation engine</span>
          <h1 className={styles.heading}>
            Design precision gears <span>in seconds.</span>
          </h1>
          <p className={styles.sub}>
            Describe your application in plain English. Get a 3D-orbital preview, full
            engineering specifications, and downloads ready for the shop floor or print bed.
          </p>
        </section>

        <div className={styles.workspace}>
          <section className={styles.formSection}>
            <div className={styles.formTitle}>Configure</div>

            {!keyPresent && (
              <button className={styles.keyBanner} onClick={() => setSettingsOpen(true)}>
                <span className={styles.keyBannerIcon}>🔑</span>
                <span className={styles.keyBannerText}>
                  <strong>Add your Anthropic API key</strong>
                  <span>Free to create · stays in your browser</span>
                </span>
                <span className={styles.keyBannerArrow}>→</span>
              </button>
            )}

            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                Application
                <span className={styles.labelHint}>describe what the gear must do</span>
              </label>
              <textarea
                className={styles.textarea}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="e.g. A 5:1 reduction for a turret driven by a NEMA 17 stepper. 3D-printed in PLA, 5mm shaft..."
                rows={5}
              />
              <div className={styles.examples}>
                {EXAMPLES.map((ex, i) => (
                  <button
                    key={i}
                    type="button"
                    className={styles.exampleChip}
                    onClick={() => setDescription(ex)}
                  >
                    {ex.split('.')[0]}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Gear type</label>
                <select className={styles.select} value={gearType} onChange={e => setGearType(e.target.value)}>
                  {GEAR_TYPES.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                </select>
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Units</label>
                <select className={styles.select} value={units} onChange={e => setUnits(e.target.value)}>
                  <option value="metric">Metric (mm, module)</option>
                  <option value="imperial">Imperial (in, DP)</option>
                </select>
              </div>
            </div>

            <button
              className={styles.btn}
              onClick={handleGenerate}
              disabled={loading || !description.trim()}
            >
              {loading ? (
                <>
                  <span className={styles.spinner} />
                  Calculating
                </>
              ) : (
                <>
                  Generate gears
                  <span className={styles.btnArrow}>→</span>
                </>
              )}
            </button>

            {error && <div className={styles.error}>{error}</div>}
          </section>

          <div className={styles.resultColumn}>
            {!result && !loading && (
              <div className={styles.placeholder}>
                <span className={styles.placeholderIcon}>⚙</span>
                <div className={styles.placeholderTitle}>Your gear preview will appear here</div>
                <div className={styles.placeholderText}>
                  Fill in your application on the left and hit generate to see an interactive 3D
                  model and full specs. You can drag to orbit, scroll to zoom, and download the
                  result in any format.
                </div>
              </div>
            )}

            {loading && (
              <div className={styles.placeholder}>
                <span className={styles.placeholderIcon}>⚙</span>
                <div className={styles.placeholderTitle}>Crunching the numbers…</div>
                <div className={styles.placeholderText}>
                  Sizing teeth, computing pitch geometry, and balancing your design constraints.
                </div>
              </div>
            )}

            {result && (
              <section className={styles.resultSection}>
                <div className={styles.viewerCard}>
                  <div className={styles.viewerHeader}>
                    <div className={styles.viewerHeaderLeft}>
                      <span className={styles.viewerLabel}>3D PREVIEW</span>
                      <span className={styles.viewerSub}>{result.gears.length} gear{result.gears.length > 1 ? 's' : ''}</span>
                    </div>
                    <ExportMenu result={result} selectedIndex={selectedIndex} />
                  </div>
                  <div className={styles.viewerCanvas}>
                    <GearViewer3D
                      ref={viewerRef}
                      result={result}
                      selectedIndex={selectedIndex}
                      onSelect={setSelectedIndex}
                    />
                  </div>
                </div>

                <SpecSheet
                  result={result}
                  selectedIndex={selectedIndex}
                  onSelect={setSelectedIndex}
                />

                <RecommendedParts result={result} />

                {result.notes && (
                  <div className={styles.notes}>
                    <strong>Design notes</strong>
                    <p>{result.notes}</p>
                  </div>
                )}
                {result.warnings && (
                  <div className={styles.warning}>
                    <strong>Caution</strong>
                    <p>{result.warnings}</p>
                  </div>
                )}
              </section>
            )}
          </div>
        </div>
      </main>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}

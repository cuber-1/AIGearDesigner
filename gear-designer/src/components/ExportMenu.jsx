import { useState, useRef, useEffect } from 'react'
import { exportSTL, exportOBJ, exportGLTF, exportJSON, exportCSV } from '../lib/exporters'
import styles from './ExportMenu.module.css'

const FORMATS = [
  { key: 'stl',  label: 'STL',  hint: '3D printing · binary' },
  { key: 'obj',  label: 'OBJ',  hint: 'Universal mesh' },
  { key: 'glb',  label: 'GLB',  hint: 'Web · AR · GLTF binary' },
  { key: 'gltf', label: 'GLTF', hint: 'Web · JSON' },
  { key: 'json', label: 'JSON', hint: 'Spec sheet' },
  { key: 'csv',  label: 'CSV',  hint: 'Spreadsheet' },
]

export default function ExportMenu({ result, selectedIndex }) {
  const [open, setOpen] = useState(false)
  const [scope, setScope] = useState('all') // 'all' | 'selected'
  const ref = useRef(null)

  useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const hasMultiple = result.gears.length > 1

  async function handleExport(format) {
    const opts = scope === 'selected' && selectedIndex != null ? { index: selectedIndex } : {}
    try {
      switch (format) {
        case 'stl':  exportSTL(result, opts); break
        case 'obj':  exportOBJ(result, opts); break
        case 'glb':  await exportGLTF(result, { ...opts, binary: true }); break
        case 'gltf': await exportGLTF(result, { ...opts, binary: false }); break
        case 'json': exportJSON(result); break
        case 'csv':  exportCSV(result); break
        default: break
      }
    } catch (e) {
      console.error('Export failed', e)
      alert('Export failed: ' + (e.message || 'unknown error'))
    }
    setOpen(false)
  }

  return (
    <div className={styles.wrap} ref={ref}>
      <button className={styles.trigger} onClick={() => setOpen(o => !o)}>
        <span className={styles.icon}>⤓</span>
        Export
        <span className={styles.caret}>▾</span>
      </button>

      {open && (
        <div className={styles.menu} role="menu">
          {hasMultiple && (
            <div className={styles.scopeRow}>
              <button
                className={`${styles.scopeBtn} ${scope === 'all' ? styles.scopeActive : ''}`}
                onClick={() => setScope('all')}
              >
                All gears
              </button>
              <button
                className={`${styles.scopeBtn} ${scope === 'selected' ? styles.scopeActive : ''}`}
                onClick={() => setScope('selected')}
                disabled={selectedIndex == null}
                title={selectedIndex == null ? 'Click a gear in the viewer to select it' : ''}
              >
                Selected only
              </button>
            </div>
          )}

          <div className={styles.list}>
            {FORMATS.map(f => (
              <button
                key={f.key}
                className={styles.item}
                onClick={() => handleExport(f.key)}
              >
                <span className={styles.itemLabel}>{f.label}</span>
                <span className={styles.itemHint}>{f.hint}</span>
              </button>
            ))}
          </div>

          <div className={styles.footer}>
            STEP/IGES require a CAD kernel and aren't supported in-browser.
          </div>
        </div>
      )}
    </div>
  )
}

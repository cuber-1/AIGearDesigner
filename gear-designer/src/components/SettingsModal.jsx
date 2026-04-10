import { useState, useEffect } from 'react'
import styles from './SettingsModal.module.css'
import { getUserKey, setUserKey, clearUserKey, looksValid } from '../lib/userKey'

export default function SettingsModal({ open, onClose }) {
  const [key, setKey] = useState('')
  const [reveal, setReveal] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (open) {
      setKey(getUserKey())
      setSaved(false)
      setReveal(false)
    }
  }, [open])

  useEffect(() => {
    function onEsc(e) { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', onEsc)
    return () => document.removeEventListener('keydown', onEsc)
  }, [open, onClose])

  if (!open) return null

  function handleSave() {
    setUserKey(key)
    setSaved(true)
    setTimeout(() => { setSaved(false); onClose() }, 700)
  }

  function handleClear() {
    clearUserKey()
    setKey('')
  }

  const isValidShape = looksValid(key)
  const hasKey = key.trim().length > 0

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <div className={styles.eyebrow}>Settings</div>
            <h2 className={styles.title}>Anthropic API key</h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className={styles.body}>
          <p className={styles.intro}>
            This tool runs on Claude. Bring your own key so generations don't cost the host
            anything — and so you control your usage and billing directly.
          </p>

          <div className={styles.field}>
            <label className={styles.label}>Your API key</label>
            <div className={styles.inputWrap}>
              <input
                type={reveal ? 'text' : 'password'}
                className={styles.input}
                value={key}
                onChange={e => setKey(e.target.value)}
                placeholder="sk-ant-..."
                spellCheck={false}
                autoComplete="off"
              />
              <button
                type="button"
                className={styles.revealBtn}
                onClick={() => setReveal(r => !r)}
              >
                {reveal ? 'Hide' : 'Show'}
              </button>
            </div>
            {hasKey && !isValidShape && (
              <div className={styles.warn}>That doesn't look like an Anthropic key (should start with <code>sk-ant-</code>).</div>
            )}
          </div>

          <div className={styles.privacy}>
            <div className={styles.privacyIcon}>🔒</div>
            <div>
              <div className={styles.privacyTitle}>Stored locally · sent directly to Anthropic</div>
              <div className={styles.privacyText}>
                Your key lives in this browser's localStorage and is sent straight from your
                browser to <code>api.anthropic.com</code>. It never touches this site's server.
              </div>
            </div>
          </div>

          <div className={styles.helpLinks}>
            <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer">
              Get a key →
            </a>
            <a href="https://console.anthropic.com/settings/billing" target="_blank" rel="noopener noreferrer">
              Manage billing →
            </a>
          </div>
        </div>

        <div className={styles.footer}>
          {hasKey && (
            <button className={styles.clearBtn} onClick={handleClear}>
              Remove key
            </button>
          )}
          <div className={styles.spacer} />
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button
            className={styles.saveBtn}
            onClick={handleSave}
            disabled={hasKey && !isValidShape}
          >
            {saved ? 'Saved ✓' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

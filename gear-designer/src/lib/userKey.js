/**
 * Browser-side storage for the user's own Anthropic API key.
 *
 * The key never leaves the user's browser — it's read straight from
 * localStorage and sent directly to api.anthropic.com via the
 * `anthropic-dangerous-direct-browser-access: true` header.
 */
const STORAGE_KEY = 'gear_designer.anthropic_api_key'

export function getUserKey() {
  try {
    return localStorage.getItem(STORAGE_KEY) || ''
  } catch {
    return ''
  }
}

export function setUserKey(key) {
  try {
    if (key) localStorage.setItem(STORAGE_KEY, key.trim())
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* no-op */
  }
}

export function clearUserKey() {
  setUserKey('')
}

export function hasUserKey() {
  return getUserKey().length > 0
}

/** Quick sanity check — Anthropic keys all start with sk-ant- */
export function looksValid(key) {
  return /^sk-ant-[\w-]{20,}$/.test((key || '').trim())
}

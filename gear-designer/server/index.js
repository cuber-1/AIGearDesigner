import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// Serve built frontend in production
app.use(express.static(path.join(__dirname, '../dist')))

const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5'

// Optional proxy route — keeps API key server-side IF the host has set one.
// The frontend prefers direct browser calls with the user's own key (BYO),
// and only falls back to this endpoint when no user key is configured.
app.post('/api/generate', async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(503).json({
      error: 'No API key configured. Open Settings (top right) and add your Anthropic key — it stays in your browser and is sent directly to Anthropic.',
    })
  }

  try {
    const { system, userMessage } = req.body || {}
    if (!userMessage) {
      return res.status(400).json({ error: 'userMessage is required.' })
    }

    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 1200,
        system,
        messages: [{ role: 'user', content: userMessage }],
      }),
    })

    const data = await upstream.json()

    if (!upstream.ok) {
      const message = data?.error?.message || `Anthropic error ${upstream.status}`
      return res.status(upstream.status).json({ error: message })
    }

    const text = data?.content?.[0]?.text || ''
    res.json({ text })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Upstream API request failed.' })
  }
})

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'))
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT} (model: ${ANTHROPIC_MODEL})`)
})

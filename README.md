# AI Gear Designer

**Live Demo:** [ai-gear-designer.vercel.app](https://ai-gear-designer.vercel.app/)

AI-powered mechanical gear design tool. Describe your application in plain English and get complete gear specifications with interactive 3D visualization.

## Features

- **AI-Generated Gear Specs** — Describe what you need (e.g. "3:1 reduction for a NEMA 17 stepper") and get full engineering specifications powered by Claude
- **Multi-Gear Systems** — Automatically generates all gears in a system (gear trains, reductions, compound gearboxes)
- **Interactive 3D Viewer** — Orbit, zoom, and inspect your gears in 3D with animated meshing
- **Export Formats** — Download as STL, OBJ, GLB, GLTF, JSON, or CSV
- **Metric & Imperial** — Full support for both unit systems
- **BYO API Key** — Bring your own Anthropic API key. It stays in your browser's localStorage and is sent directly to Anthropic — never touches a server
- **Dark / Light Mode** — Follows system preference

## Tech Stack

- **Frontend:** React 18, Vite 5, CSS Modules
- **3D:** Three.js, React Three Fiber, React Three Drei
- **AI:** Anthropic Claude API (direct browser calls)
- **Deployment:** Vercel (static site, no backend required)

## Getting Started

```bash
cd gear-designer
npm install
npm run dev:client
```

Open [http://localhost:5173](http://localhost:5173), click the settings icon, and paste your Anthropic API key.

### Optional: Server Proxy

If you prefer to keep the API key server-side:

```bash
# gear-designer/.env
ANTHROPIC_API_KEY=sk-ant-...

npm run dev   # starts both client and Express server
```

## Deployment

Deployed on Vercel as a static site. No environment variables or serverless functions needed — users provide their own API key.

When importing to Vercel, set **Root Directory** to `gear-designer`.

## Project Structure

```
gear-designer/
  src/
    components/
      GearViewer3D.jsx    # 3D viewer with orbit controls & animation
      SpecSheet.jsx       # Tabbed gear specification display
      ExportMenu.jsx      # Multi-format download menu
      SettingsModal.jsx   # API key management
      RecommendedParts.jsx# Affiliate product suggestions
    lib/
      api.js              # Claude API integration & prompt
      gearGeometry.js     # 3D gear mesh generation
      exporters.js        # STL/OBJ/GLTF/JSON/CSV export
      userKey.js          # localStorage key management
      affiliates.js       # Amazon product matching
    App.jsx
    App.module.css
    index.css
  server/
    index.js              # Optional Express proxy server
  vercel.json
  package.json
```

## License

MIT

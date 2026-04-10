# Gear Designer

AI-powered gear specification generator. Describe your application, get full engineering specs.

## Stack

- **Frontend**: React + Vite
- **Backend**: Express proxy (keeps Anthropic API key server-side)
- **AI**: Claude via Anthropic API

## Local development

```bash
# 1. Install dependencies
npm install

# 2. Set up your API key
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# 3. Run both frontend and backend together
npm run dev
```

Vite runs on http://localhost:5173 and proxies `/api` requests to the Express server on port 3001.

## Production build

```bash
npm run build   # builds frontend into /dist
npm start       # serves /dist + API from Express on $PORT
```

Set `PORT` in your environment (defaults to 3001). The Express server serves both the static frontend and the `/api/generate` route from a single process.

## Deploying

### Railway / Render / Fly.io
1. Push to GitHub
2. Create a new service pointing at the repo
3. Set build command: `npm install && npm run build`
4. Set start command: `npm start`
5. Add environment variable: `ANTHROPIC_API_KEY=sk-ant-...`

### VPS (nginx reverse proxy)
1. Build with `npm run build`
2. Run `npm start` (or use PM2: `pm2 start server/index.js`)
3. Point nginx to `localhost:3001`

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Your Anthropic API key |
| `PORT` | No | Server port (default: 3001) |

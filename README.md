# Perplexity Limits Dashboard — Chrome Extension

A sleek, dark-themed Chrome extension by **Titan** that shows your Perplexity.ai monthly usage limits directly in a popup — no copy-pasting, no manual refresh needed.

## Features

- 🚀 **Real-time limits** fetched directly from `perplexity.ai/rest/rate-limit/all` using your existing session
- 📈 **Animated progress bars** for Pro queries, Research runs, Labs, and Agentic research
- 🔗 **Per-source quota table** for premium connectors (BMJ, NEJM, Statista, PitchBook, VisualDx, etc.)
- 🟢 **Status chips** — green/amber/red indicating headroom at a glance
- 🔄 **One-click refresh** with spinning animation
- ⏱️ **Live time-ago** timestamp that updates every 15 seconds
- ⚡ **60-second cache** — no unnecessary requests if you open the popup repeatedly
- 🔒 Fully **local** — no data ever leaves your browser

## Installation (Developer Mode)

1. Clone or download this repo as a ZIP and extract it
2. Open Chrome → `chrome://extensions`
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** and select the project folder
5. Pin the extension for easy access
6. Visit [perplexity.ai](https://www.perplexity.ai) (must be logged in), then click the extension icon

## How It Works

```
manifest.json          — Chrome MV3 manifest with host_permissions for perplexity.ai
background.js          — Service worker: fetches /rest/rate-limit/all with credentials, caches result
content-script.js      — Injected into perplexity.ai pages (minimal footprint)
popup/
  popup.html           — Extension popup shell
  popup.css            — Dark glassmorphic UI
  popup.js             — Fetches cached data, renders cards + sources table
icons/                 — Extension icons (16, 48, 128 px)
```

The background service worker uses `credentials: 'include'` so it inherits your Perplexity session cookie — no API keys required.

## Privacy

- No data is sent to any third party
- All API calls go only to `perplexity.ai` itself
- Rate limit data is cached in `chrome.storage.local` for 60 seconds and never leaves the browser

## License

MIT

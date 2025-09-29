# Dryvest UI (Streamlined)

This is the active Dryvest front-end that ships to Cloudflare Pages. It is a React + Vite application that consumes the generated `src/data.js` bundle and the JSON dataset under `public/data/<version>/`.

## Scripts

- `npm run dev` – start the local dev server on <http://localhost:5173>
- `npm run build` – create a production bundle in `dist/`
- `npm run preview` – preview the production bundle locally

## Data refresh

The app expects `src/data.js` to exist. Regenerate it from the canonical JSON dataset any time the content changes:

```bash
node ../scripts/generate-prototype-data.mjs
```

This script reads from `public/data/<version>/` and rewrites `src/data.js` with normalized docs, key points, next steps, facts, and trailheads.

## Project layout

```
app/
├── public/            # Static assets + dataset JSON
├── src/
│   ├── App.jsx        # Routes and layout
│   ├── components/    # Consent gate, bottom stepper, cards
│   ├── pages/         # Route views (Landing, Wizard, Output, Explore, Library)
│   ├── utils/         # Consent + analytics helpers, download utility
│   ├── data.js        # Generated dataset bundle
│   └── styles.css     # Global styling tokens
└── vite.config.js     # Vite configuration
```

## Legacy build

The previous TypeScript/Tailwind implementation now lives under `../legacy/app-classic/` for reference.

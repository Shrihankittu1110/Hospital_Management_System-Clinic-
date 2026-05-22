# Hospital Management System Frontend

This is the Vite + React frontend for the Hospital Management System.

## Scripts

```bash
npm install
npm run dev
npm run build
npm run preview
```

Local dev server:

```text
http://localhost:3004
```

## Environment

Create `.env` from `.env.example` and set:

```env
VITE_API_URL=http://localhost:5002/api
```

For deployment, set it to your deployed backend:

```env
VITE_API_URL=https://your-backend-domain.com/api
```

All API calls go through `src/utils/apiBase.js`.

## Deployment

Use these settings on Vercel, Netlify, or another static host:

```text
Build command: npm run build
Publish directory: dist
```

For single-page app routing, configure rewrites or fallbacks to `index.html`.

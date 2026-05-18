# Frontend

This React single-page application provides the user-facing interface for the Hospital Management System (patients, doctors, admins).

## Overview

- Role-aware UI: separate views and flows for patients, doctors, and admins
- Client routing with `react-router-dom` and responsive UI built with Tailwind CSS
- Communicates with backend API at `http://localhost:5000` by default

## Main Routes

- `/` — Landing / Home
- `/login` — Authentication
- `/signup` — New user registration
- `/patient` — Patient dashboard
- `/doctor` — Doctor dashboard
- `/admin` — Admin dashboard
- `/patient-management`, `/doctor-management`, `/appointment-management` — management views

## Quick Setup (Development)

From the `frontend` directory:

```bash
npm install
npm start
```

Open `http://localhost:3000`.

## Environment & Backend URL

The codebase currently contains hard-coded `fetch` calls to `http://localhost:5000` in multiple components. For production or flexible setups, set a base URL environment variable and refactor API calls to use it:

```bash
# .env
REACT_APP_API_BASE_URL=https://api.example.com
```

Then reference `process.env.REACT_APP_API_BASE_URL` from a small API helper module.

## Available Scripts

- `npm start` — start dev server
- `npm run build` — production build
- `npm test` — run tests
- `npm run eject` — eject configuration

## Developer Notes

- Consider centralizing all API calls in a single helper (fetch wrapper or Axios instance) to:
	- manage the base URL
	- attach authorization headers (JWT)
	- handle common error states
- Keep secrets out of source control. Use `.env` files locally and a secure secrets manager in production.

## Production Build & Deployment

1. Build the static bundle:

```bash
npm run build
```

2. Serve `build/` with a static server or integrate with the backend to serve static assets.

## Contact

If you need assistance, open an issue or contact the repository maintainer.
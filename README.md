# Hospital Management System (MERN)

Brief: A MERN-stack application to manage hospital operations — users, doctors, appointments, prescriptions, and billing.

Quick overview
--------------
- Backend: Express + Mongoose, JWT auth, route groups under `/api`
- Frontend: React SPA (Tailwind CSS) in `frontend/`
- Database: MongoDB (local or Atlas)

Repository structure (concise, important files)
--------------------------------------------

root/
- README.md                <- (this file)
- backend/
	- server.js              <- app entry, registers routes
	- package.json
	- createAdmin.js         <- helper to create initial admin
	- .env (optional)        <- MONGO_URI, PORT, JWT_SECRET
	- middleware/
		- auth.js              <- JWT auth middleware
	- models/
		- Admin.js
		- User.js
		- Doctor.js
		- Appointment.js
		- Bill.js
		- Prescription.js
	- routes/
		- signup.js
		- login.js
		- admin.js
		- doctor.js
		- patient.js
		- bill.js

- frontend/
	- package.json
	- src/
		- index.js
		- App.js
		- components/
			- Home.js
			- Login.js
			- SignUp.js
			- Doctors.js
			- Patients.js
			- PatientManagement.js
			- DoctorManagement.js
			- AppointmentManagement.js
			- Admins.js
			- MessagePopup.js
	- public/                 <- static HTML and manifest

Detailed notes by area
----------------------

Backend
- Entry: `server.js` connects to MongoDB and mounts routes. Default port `5000`.
- DB: uses `MONGO_URI` or falls back to `mongodb://127.0.0.1:27017/hospital-management`.
- Auth: `middleware/auth.js` verifies JWT. Update to use `process.env.JWT_SECRET` before production.
- Models: Mongoose schemas for users, admins, doctors, appointments, bills, prescriptions — see `backend/models/` for fields.
- Scripts: add `start` and `dev` scripts to `backend/package.json` (e.g., `node server.js`, `nodemon server.js`).

Frontend
- React SPA in `frontend/src/` with components mapping roughly to pages and management views.
- Development: `npm start` runs the dev server on port 3000 by default.
- Build: `npm run build` produces production static files in `frontend/build/`.

Environment variables
- Backend (`backend/.env`)
	- `MONGO_URI` — MongoDB connection string (optional)
	- `PORT` — backend port (default 5000)
	- `JWT_SECRET` — secret for signing/verifying JWTs (required for production)

- Frontend
	- `REACT_APP_API_BASE_URL` — optional base URL for API requests (default `http://localhost:5000`)

How to run (local)
------------------

1) Install dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

2) Start backend

```bash
cd backend
node server.js
```

3) (Optional) create admin

```bash
node createAdmin.js
```

4) Start frontend

```bash
cd frontend
npm start
```

API highlights
- `POST /api/signup` — register
- `POST /api/login` — login -> returns JWT
- `GET/POST/PUT/DELETE /api/doctor` — doctor management
- `GET/POST/PUT/DELETE /api/patient` — patient management
- `GET/POST/PUT/DELETE /api/bills` — billing

Recommendations & next steps
---------------------------
- Move JWT secret to `process.env.JWT_SECRET` and update `middleware/auth.js`.
- Add `start` and `dev` scripts to `backend/package.json`.
- Centralize frontend API base URL via `REACT_APP_API_BASE_URL`.
- Add Postman collection or OpenAPI spec for the API.
- Add basic tests and CI for backend routes.

Reference
---------
- Backend README with setup and notes: [backend/README.md](backend/README.md)

If you want, I can (1) update `middleware/auth.js` to use `process.env.JWT_SECRET`, (2) add `start` and `dev` scripts to `backend/package.json`, or (3) create a short Postman collection — which should I do next?




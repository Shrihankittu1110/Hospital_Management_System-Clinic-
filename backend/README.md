Hospital Management System — Backend
===================================

Overview
--------

This is the Express + MongoDB backend for the Hospital Management System (MERN). It provides REST API endpoints for user signup/login, admin and doctor management, patient data, appointments, and billing.

Prerequisites
-------------

- Node.js (v14+ recommended)
- npm
- MongoDB (local or remote)

Quick start
-----------

1. Open a terminal and change to the backend folder:

	cd backend

2. Install dependencies:

	npm install

3. Create a `.env` file in `backend/` (optional). Supported environment variables:

- `MONGO_URI` — MongoDB connection string. Default: `mongodb://127.0.0.1:27017/hospital-management`
- `PORT` — Port the server will listen on. Default: `5000`
- `JWT_SECRET` — Recommended secret for signing JWTs (note: `middleware/auth.js` currently uses a hard-coded secret string; replace it with `process.env.JWT_SECRET` for production).

4. Start the server:

	node server.js

If you prefer a development workflow with a file watcher, install a tool such as `nodemon` and run `nodemon server.js`.

Creating an initial admin user
-----------------------------

The repository includes `createAdmin.js` which creates a default admin document. Run it after your MongoDB is available:

	node createAdmin.js

This script uses the same `MONGO_URI` fallback as the server.

API routes (overview)
---------------------

- `POST /api/signup` — create a new patient/user account
- `POST /api/login` — authenticate and receive a JWT
- `GET/POST/PUT/DELETE /api/admin` — admin management routes
- `GET/POST/PUT/DELETE /api/doctor` — doctor management routes
- `GET/POST/PUT/DELETE /api/patient` — patient management routes
- `GET/POST/PUT/DELETE /api/bills` — billing routes

See the route files in the `routes/` folder for detailed request/response shapes.

Project structure (important files)
----------------------------------

- `server.js` — application entry point and route mounting
- `createAdmin.js` — helper script to create a default admin
- `middleware/auth.js` — JWT-based authentication middleware
- `models/` — Mongoose models (`Admin`, `Appointment`, `Bill`, `Doctor`, `Prescription`, `User`)
- `routes/` — Express route handlers

Notes and next steps
--------------------

- Consider replacing the hard-coded JWT secret in `middleware/auth.js` with `process.env.JWT_SECRET`.
- Add npm scripts (e.g., `start`, `dev`) to `package.json` for nicer developer experience.
- Add tests and API documentation (Postman collection or OpenAPI spec) if you plan to extend the project.

License
-------

This project does not include a license file. Add a `LICENSE` if you intend to open-source the code.


# Sweety - Blood Glucose Tracker

A small web app where a diabetes patient records up to 4 blood glucose readings a day and views daily, month-to-date and monthly reports.

**Stack:** Node.js + Express, PostgreSQL, React (Vite), JWT auth, bcrypt, Jest + Supertest.

## Prerequisites
- Node.js 18+
- PostgreSQL 14+

## 1. Install
```bash
git clone https://github.com/devanaboinaswathi1-ai/sweety.git
cd sweety/server && npm install
cd ../client && npm install
```

## 2. Database setup
Create two databases: one for the app, one for tests.
```bash
psql -U postgres -c "CREATE DATABASE sweety;"
psql -U postgres -c "CREATE DATABASE sweety_test;"
psql -U postgres -d sweety -f server/db/schema.sql
psql -U postgres -d sweety_test -f server/db/schema.sql
```

## 3. Environment
```bash
cd server
cp .env.example .env
```
Edit `.env` and set your Postgres password and a long random `JWT_SECRET`.
Variables: `PORT`, `DATABASE_URL`, `TEST_DATABASE_URL`, `JWT_SECRET`.

## 4. Seed demo data
```bash
cd server
npm run seed
```
Demo login: `demo@sweety.com` / `demo1234`

## 5. Run
```bash
# terminal 1 - API on http://localhost:5000
cd server && npm run dev

# terminal 2 - UI on http://localhost:5173
cd client && npm run dev
```
Keep the server and the client in two separate terminals.

## 6. Tests
```bash
cd server && npm test
```
Tests run against `sweety_test` (never the demo DB). They cover date-range calculation, validation rules, duplicate slot, and one user being unable to delete another user's reading.

## API
| Method | Path | Notes |
|---|---|---|
| POST | /api/auth/register | name, email, password (min 6 characters) |
| POST | /api/auth/login | returns user + JWT |
| GET/POST | /api/readings | GET supports `?date=YYYY-MM-DD` |
| PUT/DELETE | /api/readings/:id | owner only |
| GET | /api/reports?date=YYYY-MM-DD | returns `daily` (with readings list), `monthToDate` and `monthly` stats. `date` defaults to today |

All `/api/readings` and `/api/reports` routes need the header `Authorization: Bearer <token>`.

## Notes
**Assumptions**
- Dates are stored as Postgres `DATE` and handled as `YYYY-MM-DD` strings to avoid timezone bugs.
- "Future date" is checked against the server's local date.
- Monthly report = the whole month before the selected date. Month-to-date = 1st of the month up to the selected date.
- Average is rounded to 1 decimal. Empty periods return count 0 and the UI shows an empty state.
- The API URL is hardcoded in `client/src/api.js` (`http://localhost:5000/api`).
- "Max 4 readings per day" is checked in the API. In practice it is also guaranteed by the 4 unique slots (one reading per slot per day), so the UI shows the duplicate-slot message first.
- Future dates: the server returns "Date cannot be in the future." (covered by tests). In the UI, the browser's date picker also blocks future dates before the request is sent.
- Passwords are hashed with bcrypt. Emails are lowercased. JWT tokens expire after 7 days.
- CORS is open for local development.

**Known limitations**
- Automated tests cover date ranges, validation, duplicate slot and cross-user delete. Auth endpoints, report queries with data and the frontend were tested manually.
- Impossible dates such as `2026-02-31` sent directly to the readings API are not rejected cleanly (the database returns an error). The UI date picker prevents this.
- When a token expires, the user must log out and log in again.

**With more time I would**
- Move the API URL to a `VITE_API_URL` env variable.
- Validate real calendar dates and invalid ids with 400/404 responses.
- Log the user out automatically when the token expires.
- Add more tests (401 without token, negative values, update, delete, report boundaries) and frontend tests with React Testing Library.
- Add pagination on GET /readings and a monthly line chart.
- Add Docker Compose for Postgres and the app.
- Add rate limiting on auth routes.
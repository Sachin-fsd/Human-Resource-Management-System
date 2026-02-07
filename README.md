# HRMS Lite

HRMS Lite is a lightweight Human Resource Management System that lets a single admin add employees and track daily attendance from a clean web interface.

## Project Structure

```
frontend/  # Next.js client
backend/   # Express + MongoDB API
```

## Tech Stack

- **Frontend:** Next.js (React)
- **Backend:** Node.js + Express
- **Database:** MongoDB (mongodb)

## Local Development

### Backend

```bash
cd backend
npm install
npm run dev
```

The API runs on `http://localhost:4000` by default. Configure `MONGODB_URI` to point at your MongoDB instance.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Create a `.env.local` file in `frontend/` if you want to point the UI at another API:

```
NEXT_PUBLIC_API_BASE=http://localhost:4000
```

Open `http://localhost:3000` in your browser.

## API Endpoints

- `GET /api/employees`
- `POST /api/employees`
- `DELETE /api/employees/:employeeId`
- `GET /api/attendance`
- `POST /api/attendance`

## Assumptions & Limitations

- Single admin user (no authentication).
- Attendance can only be marked once per employee per day.
- MongoDB connection string is expected via `MONGODB_URI` in production.

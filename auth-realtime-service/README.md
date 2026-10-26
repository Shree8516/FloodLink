# auth-realtime-service (Person 1): Node.js + Express + MongoDB + Socket.io

## Purpose
Two jobs, both about **people and live updates**:
1. **Accounts:** register and log in with bcrypt-hashed passwords. This is the **only service that issues JWTs**. Spring and Flask just verify them with the shared secret.
2. **Live updates:** request-service tells us when something changes. We broadcast it with **Socket.io** to every open browser and save a readable line in an **activity log** ("Volunteer Priya claimed a rescue request in Velachery").

## Folder structure
```
auth-realtime-service/
├── package.json
├── .env.example            ← copy to .env (MONGO_URI, JWT_SECRET – same in all backends)
├── scripts/seed.js         ← demo users + 15 requests (posted through the real API)
└── src/
    ├── index.js            ← starts everything: MongoDB connection + one HTTP server for Express AND Socket.io
    ├── app.js              ← Express app: middleware order, routes, Swagger, error handlers
    ├── socket.js           ← Socket.io server; checks the JWT when a browser connects
    ├── config.js           ← reads .env
    ├── middleware/
    │   ├── logger.js       ← logs "POST /api/v1/auth/login 200 - 85 ms"
    │   ├── auth.js         ← verifyJwt + requireRole('ADMIN')
    │   └── errorHandler.js ← 404 + central error handler → { status, error, message }
    ├── models/
    │   ├── User.js         ← name, email (unique), password (bcrypt hash), phone, role
    │   └── ActivityLog.js  ← event, requestId, actorName, area, message
    ├── routes/
    │   ├── authRoutes.js     ← register, login, me
    │   ├── eventRoutes.js    ← POST /events → Socket.io broadcast + activity log
    │   └── activityRoutes.js ← GET /activity
    ├── utils/
    │   ├── token.js        ← signToken / verifyToken (the only place a JWT is created)
    │   └── area.js         ← "Gandhi Road, Velachery" → "Velachery"
    └── docs/swagger.js     ← OpenAPI description for /api-docs
```

## Endpoints
| Method | Path | Who | What |
|--------|------|-----|------|
| POST | /api/v1/auth/register | public | create CITIZEN/VOLUNTEER, returns `{ token, user }` |
| POST | /api/v1/auth/login | public | returns `{ token, user }` |
| GET | /api/v1/auth/me | logged in | current user |
| POST | /api/v1/events | logged in (request-service forwards the user's JWT) | broadcast + log |
| GET | /api/v1/activity?limit=20 | logged in | latest activity |
| GET | /api/v1/presence | logged in | volunteers online (location rounded to ~100 m, if shared) |
| GET | /api/v1/health | public | status + connected browsers |
| GET | /api-docs | public | Swagger UI |

**Socket.io events to browsers:** `request:created`, `request:claimed`, `request:resolved`, `request:updated`, `request:deleted`, `request:merged`, `activity:created`, `presence:changed`.
**From volunteers' browsers:** `presence:update { latitude, longitude }`, `presence:stop` (see `src/presence.js`).
JWT payload: `{ userId, name, email, role }`, HS256, 24 h. Full examples are in `/CONTRACT.md`.

## How to run
1. MongoDB running (`mongodb://localhost:27017`), or put an Atlas URI in `.env`.
2. Then (`.env` is git-ignored; set the shared `JWT_SECRET` in it):
   ```bash
   copy .env.example .env      # macOS/Linux: cp
   npm install
   npm start                   # or npm run dev (restarts on file changes)
   ```
3. Check: http://localhost:5000/api/v1/health · Swagger: http://localhost:5000/api-docs
4. When request-service and insights-service are also running: `npm run seed`.

## How to explain this in the presentation
- **"My service owns identity. Passwords are hashed with bcrypt (10 rounds), so even we can't read them. On login I compare the hash and sign a JWT with userId, name, email and role. It's the only service that can create tokens. Spring and Flask only verify the signature with the same shared secret."**
- **"Express middleware runs in a fixed order: CORS, JSON parsing, my request logger, the routes, a 404 handler, and finally one central error handler. Every error comes back in the same `{status, error, message}` shape. `verifyJwt` and `requireRole` protect routes in one line each."**
- **"For live updates: HTTP is request–response, so the browser has to ask. Socket.io keeps a connection open, so I can push. When Spring saves a change it calls `/events`, I `io.emit` it to every browser, and the marker changes colour on every screen at once."**
- **"Spring forwards the JWT of the user who acted, so my activity log knows who did what: 'Volunteer Priya claimed a rescue request in Velachery'. That sentence is saved in MongoDB and pushed to the ticker you see at the top of the app."**
- **"I chose MongoDB because users and log entries are simple documents. The unique index on email stops duplicate accounts at the database level."**
- **"On the frontend I built the app shell, the Redux store, the one Axios instance whose interceptor attaches the JWT, ProtectedRoute for role-based pages, the useLiveUpdates hook, the ticker, and the ErrorBoundary, our only class component, because error boundaries need class lifecycle methods."**

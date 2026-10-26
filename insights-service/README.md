# insights-service (Person 3): Python Flask + SQLAlchemy (SQLite)

## Purpose
The intelligence of FloodLink:
1. **Is this a duplicate?** Compares a new request with recent unresolved ones.
2. **How urgent is it?** A priority score from 0 to 100, **with human-readable reasons**.
3. **What's happening overall?** `/api/v1/stats` for the admin charts, plus a printable `/report`.

Every analysis is stored with SQLAlchemy in SQLite. JWTs are **validated** with the shared secret (PyJWT); this service never issues them.

## Folder structure
```
insights-service/
├── app.py              ← creates the Flask app: DB, CORS, Swagger, error handlers, routes
├── config.py           ← settings from .env (port, DB, JWT_SECRET, request-service URL)
├── auth.py             ← @require_jwt("ADMIN") decorator: validates the token, checks the role
├── errors.py           ← ApiError + one JSON error format
├── models.py           ← AnalysisRecord table
├── services/
│   ├── duplicate_service.py ← haversine distance + difflib similarity (each rule explained)
│   ├── priority_service.py  ← the 0–100 score and its reasons (each weight explained)
│   ├── stats_service.py     ← counts by type/status/area, duplicates, average resolve time
│   ├── request_client.py    ← reads the live request list from request-service
│   └── area.py              ← "Gandhi Road, Velachery" → "Velachery"
├── routes/
│   ├── analyze_routes.py    ← POST /api/v1/analyze, GET /api/v1/health
│   ├── stats_routes.py      ← GET /api/v1/stats
│   └── report_routes.py     ← GET /report (HTML)
├── templates/report.html    ← Jinja2, printable
└── tests/test_insights_service.py ← 29 unittest tests
```
Routes only handle HTTP. The rules are plain Python functions in `services/`, so they're easy to test and explain.

## The rules

**Duplicate:** all four must be true.
| Rule | Why |
|------|-----|
| Same type | Food and rescue at one house are two different needs |
| ≤ **200 m** apart (haversine) | Same building or street; map taps are never exact |
| ≤ **2 hours** apart | Older posts are probably a new situation |
| Description similarity **> 0.6** (`difflib.SequenceMatcher`) | Same story with small edits |

**Priority (0–100):**
| Part | Points | Why |
|------|--------|-----|
| Type | RESCUE 40 · MEDICINE 30 · FOOD 20 · SHELTER 15 | Life first, then health, food, roof |
| People | 2 each, max 20 | More people = more impact, capped so one group doesn't bury a single trapped person |
| Waiting | 5 per hour, max 15 | Unresolved requests must not be forgotten |
| Urgent words | 5 each, max 25 | elderly, child, baby, trapped, pregnant, injured, disabled, oxygen… |

Example: *"Elderly couple trapped on first floor"*, RESCUE, 2 people →
`["RESCUE request: +40", "2 people affected: +4", "Urgent words (elderly, trapped): +10"]` = **54**.

## Endpoints
| Method | Path | Who | What |
|--------|------|-----|------|
| POST | /api/v1/analyze | logged in (request-service forwards the user's JWT) | `{ isDuplicate, duplicateOfId, priorityScore, reasons[] }` |
| POST | /api/v1/suggest | logged in | suggested type + urgency + live priority preview for the post form (nothing saved) |
| GET | /api/v1/stats | ADMIN | by type, status, area breakdown (+ avg resolve time per area), duplicates caught and merged, avg priority |
| GET | /report?token=… | ADMIN | printable HTML summary |
| GET | /api/v1/health | public | `{ status: "UP" }` |
| GET | /apidocs | public | Swagger UI (flasgger) |

## How to run
```bash
cd insights-service
python -m venv venv
venv\Scripts\activate            # macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
copy .env.example .env           # JWT_SECRET must match the other backends (.env is never committed)
python app.py
```
Check: http://localhost:5001/api/v1/health · Swagger: http://localhost:5001/apidocs
Tests: `python -m unittest discover tests`

## How to explain this in the presentation
- **"In the floods, the same family was posted ten times. My service catches that with four rules: same type, within 200 metres by the haversine formula, within 2 hours, and descriptions more than 60% similar using Python's difflib."**
- **"Haversine gives the real distance between two GPS points on a sphere. You can't just subtract coordinates, because a degree of longitude shrinks away from the equator."**
- **"Priority is explainable, not a black box. Each part of the score comes with a reason, like 'Urgent words (elderly, trapped): +10'. On the frontend, my PriorityBadge shows those reasons when you hover over it."**
- **"Duplicates are flagged, not deleted. The DuplicateWarning tells volunteers 'possible duplicate of #16', and a human decides. We don't want an algorithm to throw away a real cry for help."**
- **"Every analysis is stored with SQLAlchemy. `/stats` combines that history with the live request list from Spring: requests by type and status, hotspot areas, duplicates caught, and average resolve time. The admin dashboard draws it with recharts, and `/report` is a printable Jinja2 page."**
- **"Security: every endpoint except health validates the JWT with PyJWT using the shared secret, and stats and report are admin-only. The rules are plain functions with 20 unit tests, and the API is documented with flasgger."**

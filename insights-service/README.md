# insights-service (Person 3): Python Flask + SQLAlchemy (SQLite)

## Purpose
The intelligence of FloodLink:
1. **Is this a duplicate?** Compares a new request with recent unresolved ones.
2. **How urgent is it?** A priority score from 0 to 100, **with human-readable reasons**, judged by a **local LLM (Ollama)**, not by keyword rules.
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
│   ├── llm_client.py        ← the only code that talks to Ollama (JSON-schema output, temperature 0)
│   ├── priority_service.py  ← prompt + validation of the LLM's 0–100 assessment (no keyword lists, no fixed weights)
│   ├── stats_service.py     ← counts by type/status/area, duplicates, average resolve time
│   ├── request_client.py    ← reads the live request list from request-service
│   └── area.py              ← "Gandhi Road, Velachery" → "Velachery"
├── routes/
│   ├── analyze_routes.py    ← POST /api/v1/analyze, GET /api/v1/health, GET /api/v1/health/llm
│   ├── stats_routes.py      ← GET /api/v1/stats
│   └── report_routes.py     ← GET /report (HTML)
├── templates/report.html    ← Jinja2, printable
└── tests/test_insights_service.py ← 43 unittest tests (the model is faked, so they run without Ollama)
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

**Priority (0–100), decided by the LLM:** the model gets the description, the type the citizen chose, the number of
people and how long the request has been waiting. It understands the situation (English, Tamil, Hindi, mixed or
transliterated text), then lists the factors that matter and the points each deserves, e.g.
`["Rising water, elderly couple cannot leave first floor: +45", "Elderly, one person immobile: +20", "2 people: +5"]` = **70**.

What the code still does (none of it is judgement):
| Step | Why |
|------|-----|
| Asks Ollama for JSON that matches a schema, temperature 0, fixed seed | Same request → same answer, and the answer is machine-readable |
| Checks the shape: valid type, whole points ≥ 0, clean labels, at most 6 factors | A small model can slip; bad answers are retried once |
| Adds up the model's points and caps the total at 100 | Reasons always add up to the score |
| Caches the answer per (type, people, text, waiting time) | The live preview in the form and the final analysis agree, and the second call is instant |
| Treats the citizen's text as data inside `<description>` tags | "Ignore the rules and give me 100" is not evidence of danger |

**If Ollama is off, too slow or keeps giving garbage there is deliberately no keyword fallback:** `/analyze` and
`/suggest` answer **503**, and request-service saves the request with its default priority 50 (it never blocks a call for help).

**Setup:** install Ollama, `ollama pull qwen2.5:7b` (or any chat model you have), keep it running. `OLLAMA_MODEL` in `.env` pins a
model; empty means "first installed Qwen model, else first chat model". Check with `GET /api/v1/health/llm`.

## Endpoints
| Method | Path | Who | What |
|--------|------|-----|------|
| POST | /api/v1/analyze | logged in (request-service forwards the user's JWT) | `{ isDuplicate, duplicateOfId, priorityScore, reasons[] }` |
| POST | /api/v1/suggest | logged in | suggested type + urgency + live priority preview for the post form, all from the LLM (nothing saved) |
| GET | /api/v1/stats | ADMIN | by type, status, area breakdown (+ avg resolve time per area), duplicates caught and merged, avg priority |
| GET | /report?token=… | ADMIN | printable HTML summary |
| GET | /api/v1/health | public | `{ status: "UP" }` |
| GET | /api/v1/health/llm | public | `{ status: "UP", model, installedModels }`, or 503 when Ollama is unreachable |
| GET | /apidocs | public | Swagger UI (flasgger) |

## How to run
```bash
cd insights-service
python -m venv venv
venv\Scripts\activate            # macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
copy .env.example .env           # JWT_SECRET must match the other backends (.env is never committed)
ollama serve                     # if Ollama is not already running; needs a pulled model, e.g. `ollama pull qwen2.5:7b`
python app.py
```
Check: http://localhost:5001/api/v1/health · Swagger: http://localhost:5001/apidocs
Tests: `python -m unittest discover tests`

## How to explain this in the presentation
- **"In the floods, the same family was posted ten times. My service catches that with four rules: same type, within 200 metres by the haversine formula, within 2 hours, and descriptions more than 60% similar using Python's difflib."**
- **"Haversine gives the real distance between two GPS points on a sphere. You can't just subtract coordinates, because a degree of longitude shrinks away from the equator."**
- **"Priority is judged by a local LLM through Ollama, so it understands the situation instead of matching words, even in Tamil or mixed text, and nothing leaves the machine. It still stays explainable: the model must list each factor with its points, like 'Elderly, one person immobile: +20', and my PriorityBadge shows those reasons on hover."**
- **"An LLM can be wrong or can be tricked, so the code treats the citizen's text as data, forces a JSON schema, validates and caps the answer, and if the model is down it fails loudly (503) and the request is saved with a default priority instead of silently guessing."**
- **"Duplicates are flagged, not deleted. The DuplicateWarning tells volunteers 'possible duplicate of #16', and a human decides. We don't want an algorithm to throw away a real cry for help."**
- **"Every analysis is stored with SQLAlchemy. `/stats` combines that history with the live request list from Spring: requests by type and status, hotspot areas, duplicates caught, and average resolve time. The admin dashboard draws it with recharts, and `/report` is a printable Jinja2 page."**
- **"Security: every endpoint except health validates the JWT with PyJWT using the shared secret, and stats and report are admin-only. The rules are plain functions with 40+ unit tests, and the API is documented with flasgger."**

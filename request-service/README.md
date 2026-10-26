# request-service (Person 2): Spring Boot 3 + PostgreSQL

## Purpose
Owns the **help requests**: create, list, edit, delete, **claim** and **resolve**, with role rules.
On every new request it asks **insights-service** for a duplicate check and priority score, saves to **PostgreSQL**, and tells **auth-realtime-service** so every browser updates live.
It **validates** JWTs (issued by auth-realtime-service) but never creates them.

## Folder structure
```
request-service/
├── pom.xml                       ← Maven dependencies
├── .env.example                  ← copy to .env (DB password, JWT_SECRET, other service URLs)
└── src/
    ├── main/java/com/floodlink/request/
    │   ├── RequestServiceApplication.java  ← main()
    │   ├── controller/HelpRequestController.java ← HTTP layer + @PreAuthorize role rules
    │   ├── service/HelpRequestService.java       ← business rules (claim/resolve, create flow)
    │   ├── repository/HelpRequestRepository.java ← Spring Data JPA queries
    │   ├── model/          ← HelpRequest entity, ClaimedBy (embedded), RequestType, RequestStatus
    │   ├── dto/            ← CreateHelpRequest, UpdateHelpRequest, HelpRequestDto, Analyze*, RealtimeEvent
    │   ├── client/         ← InsightsClient (Flask), RealtimeClient (Node)
    │   ├── security/       ← JwtService (VALIDATE only), JwtAuthFilter, AuthUser
    │   ├── config/         ← SecurityConfig (rules, CORS), OpenApiConfig (Swagger)
    │   └── exception/      ← ApiException + GlobalExceptionHandler
    ├── main/resources/application.properties
    └── test/java/.../service/HelpRequestServiceTest.java  ← 13 JUnit + Mockito tests
```
A request travels **controller → service → repository**, and the service uses the **clients** to reach the other two services.

## Endpoints (full examples in `/CONTRACT.md`)
| Method | Path | Role | What |
|--------|------|------|------|
| GET | /api/v1/requests[?status=OPEN] | any | list, most urgent first |
| GET | /api/v1/requests/{id} | any | one request |
| GET | /api/v1/requests/claimed/me | VOLUNTEER | my claimed requests |
| POST | /api/v1/requests | any | create → insights → save → broadcast |
| PUT | /api/v1/requests/{id} | ADMIN | edit text fields |
| DELETE | /api/v1/requests/{id} | ADMIN | delete |
| POST | /api/v1/requests/{id}/claim | VOLUNTEER | OPEN → CLAIMED |
| POST | /api/v1/requests/{id}/resolve | claiming VOLUNTEER or ADMIN | CLAIMED → RESOLVED |
| POST | /api/v1/requests/{id}/merge | VOLUNTEER or ADMIN | OPEN duplicate → MERGED into its original (`reportCount` + 1) |
| GET | /actuator/health | public | health check |
| GET | /swagger-ui.html | public | Swagger UI (click *Authorize* and paste a JWT) |

## How to run
1. PostgreSQL with a database `floodlink` (`psql -U postgres -c "CREATE DATABASE floodlink;"`). Tables are created automatically.
2. `copy .env.example .env` and set `DB_PASSWORD` to your PostgreSQL password. `JWT_SECRET` must match the other backends. `.env` is git-ignored: never commit it.
   Every request also carries `claimedAt` / `resolvedAt` (timeline), `reportCount` and `mergedIntoId`. On startup `StatusConstraintUpdater` updates the database's allowed statuses, so older databases accept `MERGED`.
3. `mvn spring-boot:run` → http://localhost:8080/actuator/health shows `{"status":"UP"}`.
4. Tests (no database needed): `mvn test`

> No Maven? Open the folder in IntelliJ IDEA: run `RequestServiceApplication`, and right-click `HelpRequestServiceTest` → Run.
> On Windows, if Maven complains about `JAVA_HOME`, run `$env:JAVA_HOME="C:\Program Files\Java\jdk-24"` (your JDK folder) first.

## How to explain this in the presentation
- **"My service is a layered Spring Boot app. The controller handles HTTP and validation, the service holds the business rules, and the repository talks to PostgreSQL through Spring Data JPA, where the query is written from the method name, like `findByStatusOrderByPriorityScoreDesc`. DTOs keep the API shape separate from the table."**
- **"Security is stateless. A filter reads the Bearer token on every request and verifies its HS256 signature with the shared secret. My service never issues tokens, only Node does. `@PreAuthorize` on each endpoint enforces roles: only volunteers claim, only admins delete."**
- **"The claim/resolve rules prevent double work. You can only claim an OPEN request, and only the volunteer who claimed it, or an admin, can resolve it. Otherwise you get a 409 or 403. These rules are covered by JUnit tests using Mockito mocks, so they run without a database."**
- **"When a citizen posts, I call Flask for a duplicate check and a priority score with reasons, save to PostgreSQL, then call Node so every screen updates. I forward the user's JWT on both calls, so every service checks every call."**
- **"It tolerates failures with short timeouts. If Flask is down we save with priority 50, and if Node is down we still save. We never lose a cry for help."**
- **"Bean Validation rejects bad input, like a 9-digit phone, with a clear message. One global exception handler gives every error the same JSON. Actuator gives a health check, and springdoc generates the Swagger docs."**
- **"On the frontend I built the map, with markers coloured by status and sized by priority, the filterable list, the post form where you click the map to set the location, and the volunteer dashboard."**

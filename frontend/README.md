# frontend: React (Vite) – one feature folder per person

## Purpose
Everything the user sees: login, the live map, the request list and form, the volunteer dashboard, and the admin insights charts. Updates arrive over Socket.io, with no refresh needed.

## Who owns what
```
frontend/src/
├── main.jsx                ← Person 1: wraps App in ErrorBoundary, Redux Provider, Router, MUI theme
├── app/                    ← Person 1: APP SHELL
│   ├── App.jsx             ← navbar + ticker + routes
│   ├── NavBar.jsx          ← role-based links, live/offline dot, logout
│   ├── ErrorBoundary.jsx   ← the ONE class component (explains class vs functional)
│   ├── store.js            ← Redux store: auth + live + requests slices
│   ├── api.js              ← the ONE Axios instance + JWT interceptor + error helpers
│   ├── config.js           ← backend URLs from .env
│   ├── theme.js            ← dark MUI theme + shared colours (types, statuses) + map tiles
│   ├── SosButton.jsx       ← one-tap SOS on phones
│   ├── BrandMark.jsx, EmptyState.jsx
│   └── format.js           ← "5 min ago", area from address
├── features/auth/          ← Person 1
│   ├── authSlice.js        ← user + token, login/register thunks, logout
│   ├── LoginPage.jsx       ← validated form + one-click demo accounts
│   ├── RegisterPage.jsx    ← validated form (name, email, 6+ char password, 10-digit phone, role)
│   ├── validateRegister.js
│   └── ProtectedRoute.jsx  ← redirects if not logged in / wrong role
├── features/live/          ← Person 1
│   ├── useLiveUpdates.js   ← socket.io-client → Redux
│   ├── liveSlice.js        ← connected flag + activity entries
│   ├── StatsBar.jsx        ← LIVE dot + animated open/claimed/resolved/volunteers counters
│   ├── VolunteerDots.jsx   ← live volunteer dots on the map (presence)
│   ├── LiveControls.jsx    ← alerts + location-sharing switches
│   ├── notifications.js    ← browser alerts for priority > 70
│   └── offlineQueue.js + useOfflineSync.js ← requests saved offline, sent on reconnect
├── features/requests/      ← Person 2
│   ├── requestsSlice.js    ← list of requests; fetch/create/claim/resolve/delete thunks
│   ├── HomePage.jsx        ← 65% map + cards panel (bottom sheet on phones)
│   ├── ClusterGroup.jsx, HeatLayer.jsx, mapMarkers.js, map.css ← clustering, heatmap, markers
│   ├── RequestFilters.jsx, RequestTimeline.jsx, PostSuccess.jsx, TypeTiles.jsx
│   ├── RequestMap.jsx      ← react-leaflet; red/orange/green by status, size by priority
│   ├── RequestList.jsx     ← status tabs + type filter
│   ├── RequestCard.jsx     ← one request + Claim / Resolve / Delete
│   ├── PostRequestPage.jsx ← form + LocationPicker, validation
│   ├── LocationPicker.jsx  ← click the map (or GPS) to set the location
│   ├── VolunteerDashboard.jsx ← my claimed requests with Resolve buttons
│   ├── validateRequest.js
│   └── requestConstants.js
└── features/insights/      ← Person 3
    ├── AdminDashboard.jsx  ← stat cards + charts + printable report link
    ├── StatChart.jsx       ← reusable recharts bar chart
    ├── PriorityBadge.jsx   ← score + level; reasons on hover
    ├── DuplicateWarning.jsx← "Possible duplicate of #16" + report count + Merge
    ├── SuggestionPanel.jsx ← type suggestion + live priority preview (POST /suggest)
    └── KpiCard.jsx, HotspotMap.jsx, ActivityFeed.jsx
```
Features talk to each other through Redux and small imports. For example, Person 2's RequestCard uses Person 3's PriorityBadge, and Person 1's useLiveUpdates dispatches into Person 2's requestsSlice.

## Pages
| URL | Who | Owner | What |
|-----|-----|-------|------|
| /login, /register | everyone | P1 | auth with validation |
| / | logged in | P2 | live map + filterable list |
| /post | logged in | P2 | ask for help |
| /volunteer | VOLUNTEER | P2 | my claimed requests |
| /admin | ADMIN | P3 | insights charts + report |

## How to run
```bash
cd frontend
copy .env.example .env      # macOS/Linux: cp  (.env is git-ignored)
npm install
npm run dev
```
Open http://localhost:5173 with all three backends running. To see live updates, use a second (incognito) window logged in as another user.

## How to explain this in the presentation
**Person 1 (shell, auth, live)**
- "React with Vite. Pages are functional components with hooks. React Router handles navigation, and ProtectedRoute checks the token and role before showing a page."
- "Redux Toolkit holds shared state: authSlice for the user and JWT, liveSlice for the ticker. One Axios instance has an interceptor that attaches the JWT to every call, and logs you out if the token has expired."
- "The useLiveUpdates hook opens one Socket.io connection after login and turns each server event into a Redux action. The ErrorBoundary is our only class component, because React can only catch rendering errors with class lifecycle methods."

**Person 2 (requests)**
- "The home page is a react-leaflet map: red = open, orange = claimed, green = resolved, and the circle size grows with priority. Next to it is a list you can filter by status and type."
- "The post form validates every field, including a 10-digit phone, and you click the map to set the location. Claim and Resolve buttons only appear for users who are allowed to press them."

**Person 3 (insights)**
- "The admin dashboard draws /stats with recharts: requests by type and status, hotspot areas, duplicates caught, and average time to resolve. It refreshes itself whenever a live event arrives."
- "PriorityBadge shows the score with a word (High/Medium/Low), so it doesn't rely on colour alone, and hovering shows the reasons. DuplicateWarning appears on cards and map pop-ups."

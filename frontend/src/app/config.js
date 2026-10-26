// [Person 1 – app shell] Where each backend lives (from .env) and the localStorage keys the app uses.
// Imported by every feature, so a URL or key is changed in exactly one place.

export const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:5000/api/v1';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
export const REQUEST_API_URL = import.meta.env.VITE_REQUEST_API_URL || 'http://localhost:8080/api/v1';
export const INSIGHTS_URL = import.meta.env.VITE_INSIGHTS_URL || 'http://localhost:5001';

// localStorage keys: keep the session so a page reload doesn't log you out
export const TOKEN_KEY = 'floodlink_token';
export const USER_KEY = 'floodlink_user';
// Help requests written while offline, waiting to be sent (features/live/offlineQueue.js)
export const OFFLINE_QUEUE_KEY = 'floodlink_offline_requests';
// The volunteer's "share my location" and "high-priority alerts" switches (features/live/liveSlice.js)
export const SHARE_LOCATION_KEY = 'floodlink_share_location';
export const ALERTS_KEY = 'floodlink_alerts';
// Which claimed requests a volunteer marked "on the way" (features/requests/onTheWay.js)
export const ON_THE_WAY_KEY = 'floodlink_on_the_way';

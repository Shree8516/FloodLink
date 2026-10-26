// [Person 1 – app shell] The ONE shared Axios instance used for every HTTP call to all three backends.
// Its interceptor attaches the JWT automatically, so no feature has to remember the Authorization header.
// Each call passes a full URL built from config.js (e.g. `${REQUEST_API_URL}/requests`).
import axios from 'axios';
import { TOKEN_KEY, USER_KEY } from './config';

const api = axios.create();

// Runs before every request: read the token saved at login and attach it
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Runs after every response: an expired/invalid token (401) sends the user back to the login page.
// Login and register are skipped, because a 401 there just means "wrong password".
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthCall = error.config && error.config.url.includes('/auth/');
    if (error.response && error.response.status === 401 && !isAuthCall) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.location.assign('/login');
    }
    return Promise.reject(error);
  }
);

// True when the request never got an answer: no internet, or the server is down.
// The offline queue uses this to keep a help request and send it later.
export function isNetworkError(error) {
  return Boolean(error.request) && !error.response;
}

// Pulls the "message" out of the standard backend error JSON { status, error, message }
export function readErrorMessage(error) {
  if (error.response && error.response.data && error.response.data.message) {
    return error.response.data.message;
  }
  if (isNetworkError(error)) {
    return 'Cannot reach the server. Is the backend running?';
  }
  return error.message || 'Something went wrong';
}

// Used by every Redux thunk: run the API call, return its data, or reject with a readable message
export async function callApi(apiCall, rejectWithValue) {
  try {
    const response = await apiCall();
    return response.data;
  } catch (error) {
    return rejectWithValue(readErrorMessage(error));
  }
}

export default api;

// [Person 1 – live] Redux slice for live-update state: is the socket connected, the latest activity log entries,
// which volunteers are online (presence), the user's live switches (alerts, location sharing) and how many
// requests are waiting in the offline queue. Filled by useLiveUpdates, useOfflineSync and LiveControls.
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api, { callApi } from '../../app/api';
import { ALERTS_KEY, AUTH_API_URL, SHARE_LOCATION_KEY } from '../../app/config';
import { readQueue } from './offlineQueue';

// Only the newest entries are kept in memory; older ones stay in MongoDB
const MAX_ENTRIES = 30;

export const fetchActivity = createAsyncThunk('live/fetchActivity', (_, { rejectWithValue }) =>
  callApi(() => api.get(`${AUTH_API_URL}/activity?limit=${MAX_ENTRIES}`), rejectWithValue)
);

// The switches are remembered in localStorage, so a page reload keeps them as the user left them
function loadSwitch(key) {
  try {
    return localStorage.getItem(key) === 'true';
  } catch {
    return false;
  }
}

const liveSlice = createSlice({
  name: 'live',
  initialState: {
    connected: false,
    activity: [],
    onlineCount: 0,
    volunteers: [],
    sharingLocation: loadSwitch(SHARE_LOCATION_KEY),
    alertsEnabled: loadSwitch(ALERTS_KEY),
    pendingOffline: readQueue().length,
  },
  reducers: {
    connectionChanged(state, action) {
      state.connected = action.payload;
    },
    // New entries go on top (newest first), and the list is trimmed so it never grows forever
    activityReceived(state, action) {
      state.activity = [action.payload, ...state.activity].slice(0, MAX_ENTRIES);
    },
    // The server sends the full list each time, e.g. { onlineCount: 2, volunteers: [...] }
    presenceChanged(state, action) {
      state.onlineCount = action.payload.onlineCount;
      state.volunteers = action.payload.volunteers;
    },
    sharingLocationChanged(state, action) {
      state.sharingLocation = action.payload;
      localStorage.setItem(SHARE_LOCATION_KEY, String(action.payload));
    },
    alertsEnabledChanged(state, action) {
      state.alertsEnabled = action.payload;
      localStorage.setItem(ALERTS_KEY, String(action.payload));
    },
    offlineQueueChanged(state, action) {
      state.pendingOffline = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchActivity.fulfilled, (state, action) => {
      state.activity = action.payload;
    });
  },
});

export const {
  connectionChanged, activityReceived, presenceChanged, sharingLocationChanged, alertsEnabledChanged, offlineQueueChanged,
} = liveSlice.actions;
export default liveSlice.reducer;

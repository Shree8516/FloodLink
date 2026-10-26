// [Person 2 – requests] Redux slice holding every help request shown on the map and in the list.
// Thunks call request-service (Spring); requestUpserted/requestRemoved are dispatched by live Socket.io events.
// Creating a request while offline doesn't fail: it goes into the offline queue (features/live/offlineQueue.js).
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api, { callApi, isNetworkError, readErrorMessage } from '../../app/api';
import { REQUEST_API_URL } from '../../app/config';
import { queueRequest } from '../live/offlineQueue';

const REQUESTS_URL = `${REQUEST_API_URL}/requests`;

// The rejection value that means "saved on this device, will be sent later", so the form can say so
export const OFFLINE_QUEUED = 'OFFLINE_QUEUED';

export const fetchRequests = createAsyncThunk('requests/fetchAll', (_, { rejectWithValue }) =>
  callApi(() => api.get(REQUESTS_URL), rejectWithValue)
);

// No answer from the server (offline, or request-service down)? Keep the request instead of losing a cry for help.
export const createHelpRequest = createAsyncThunk('requests/create', async (payload, { rejectWithValue }) => {
  try {
    const response = await api.post(REQUESTS_URL, payload);
    return response.data;
  } catch (error) {
    if (isNetworkError(error)) {
      queueRequest(payload);
      return rejectWithValue(OFFLINE_QUEUED);
    }
    return rejectWithValue(readErrorMessage(error));
  }
});

export const claimRequest = createAsyncThunk('requests/claim', (id, { rejectWithValue }) =>
  callApi(() => api.post(`${REQUESTS_URL}/${id}/claim`), rejectWithValue)
);

export const resolveRequest = createAsyncThunk('requests/resolve', (id, { rejectWithValue }) =>
  callApi(() => api.post(`${REQUESTS_URL}/${id}/resolve`), rejectWithValue)
);

// Folds a duplicate into its original; the answer is { id, original, merged } (both changed)
export const mergeRequest = createAsyncThunk('requests/merge', (id, { rejectWithValue }) =>
  callApi(() => api.post(`${REQUESTS_URL}/${id}/merge`), rejectWithValue)
);

// DELETE returns no body, so we hand back the id ourselves to know which item to remove
export const deleteRequest = createAsyncThunk('requests/delete', (id, { rejectWithValue }) =>
  callApi(() => api.delete(`${REQUESTS_URL}/${id}`).then(() => ({ data: id })), rejectWithValue)
);

// Replace the request if we already have it, otherwise add it at the top.
// The same update can arrive twice (our own API response + the Socket.io broadcast); this handles both safely.
function upsertRequest(state, request) {
  const index = state.items.findIndex((item) => item.id === request.id);
  if (index === -1) {
    state.items.unshift(request);
  } else {
    state.items[index] = request;
  }
}

function applyMerge(state, { original, merged }) {
  upsertRequest(state, original);
  upsertRequest(state, merged);
}

function removeRequest(state, id) {
  state.items = state.items.filter((item) => item.id !== id);
}

const requestsSlice = createSlice({
  name: 'requests',
  // loaded: true after the first successful fetch, so pages know whether to show skeletons
  initialState: { items: [], status: 'idle', loaded: false, error: null },
  reducers: {
    requestUpserted: (state, action) => upsertRequest(state, action.payload),
    requestsMerged: (state, action) => applyMerge(state, action.payload),
    requestRemoved: (state, action) => removeRequest(state, action.payload),
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRequests.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchRequests.fulfilled, (state, action) => {
        state.status = 'idle';
        state.loaded = true;
        state.items = action.payload;
      })
      .addCase(fetchRequests.rejected, (state, action) => {
        state.status = 'idle';
        state.error = action.payload;
      })
      .addCase(createHelpRequest.fulfilled, (state, action) => upsertRequest(state, action.payload))
      .addCase(claimRequest.fulfilled, (state, action) => upsertRequest(state, action.payload))
      .addCase(resolveRequest.fulfilled, (state, action) => upsertRequest(state, action.payload))
      .addCase(mergeRequest.fulfilled, (state, action) => applyMerge(state, action.payload))
      .addCase(deleteRequest.fulfilled, (state, action) => removeRequest(state, action.payload));
  },
});

export const { requestUpserted, requestsMerged, requestRemoved } = requestsSlice.actions;
export default requestsSlice.reducer;

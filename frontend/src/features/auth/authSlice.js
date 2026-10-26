// [Person 1 – auth] Redux slice for the logged-in user and their JWT. Login/register call auth-realtime-service
// (the only service that issues tokens). Read by NavBar, ProtectedRoute and any component that needs the role.
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api, { callApi } from '../../app/api';
import { AUTH_API_URL, TOKEN_KEY, USER_KEY } from '../../app/config';

// Restore the session from localStorage so a page reload keeps you logged in
function loadSavedSession() {
  try {
    return { token: localStorage.getItem(TOKEN_KEY), user: JSON.parse(localStorage.getItem(USER_KEY)) };
  } catch {
    return { token: null, user: null };
  }
}

export const loginUser = createAsyncThunk('auth/login', (credentials, { rejectWithValue }) =>
  callApi(() => api.post(`${AUTH_API_URL}/auth/login`, credentials), rejectWithValue)
);

export const registerUser = createAsyncThunk('auth/register', (form, { rejectWithValue }) =>
  callApi(() => api.post(`${AUTH_API_URL}/auth/register`, form), rejectWithValue)
);

// Both login and register answer { token, user }, so they share these reducers.
// The localStorage writes are kept here for simplicity, so the saved session always matches Redux.
function setPending(state) {
  state.status = 'loading';
  state.error = null;
}

function setLoggedIn(state, action) {
  state.status = 'idle';
  state.token = action.payload.token;
  state.user = action.payload.user;
  localStorage.setItem(TOKEN_KEY, action.payload.token);
  localStorage.setItem(USER_KEY, JSON.stringify(action.payload.user));
}

function setFailed(state, action) {
  state.status = 'idle';
  state.error = action.payload;
}

const authSlice = createSlice({
  name: 'auth',
  initialState: { ...loadSavedSession(), status: 'idle', error: null },
  reducers: {
    logout(state) {
      state.token = null;
      state.user = null;
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, setPending)
      .addCase(loginUser.fulfilled, setLoggedIn)
      .addCase(loginUser.rejected, setFailed)
      .addCase(registerUser.pending, setPending)
      .addCase(registerUser.fulfilled, setLoggedIn)
      .addCase(registerUser.rejected, setFailed);
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;

// [Person 1 – app shell] The Redux store: one place for state many pages share.
// Each feature owns its slice: auth (Person 1), live (Person 1), requests (Person 2).
// Created once and given to the app in main.jsx via <Provider>.
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import liveReducer from '../features/live/liveSlice';
import requestsReducer from '../features/requests/requestsSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    live: liveReducer,
    requests: requestsReducer,
  },
});

export default store;

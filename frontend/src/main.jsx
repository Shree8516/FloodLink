// [Person 1 – app shell] Starting point of the React app (loaded by index.html). Wraps <App> in everything it
// needs: error boundary, Redux store, router, the Material-UI theme and toast notifications (notistack).
// Also loads the Inter font and Leaflet's map CSS.
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { CssBaseline, Slide, ThemeProvider } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';
import 'leaflet/dist/leaflet.css';
import App from './app/App';
import ErrorBoundary from './app/ErrorBoundary';
import store from './app/store';
import theme from './app/theme';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            {/* Toasts slide in from the right; at most 3 at once so a busy flood doesn't bury the screen */}
            <SnackbarProvider maxSnack={3} autoHideDuration={4000} TransitionComponent={Slide}
              anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
              <App />
            </SnackbarProvider>
          </ThemeProvider>
        </BrowserRouter>
      </Provider>
    </ErrorBoundary>
  </React.StrictMode>
);

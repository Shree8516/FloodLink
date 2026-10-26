// [Person 1 – app shell] The ONE place for FloodLink's look: a dark "emergency operations" Material-UI theme,
// plus the colours every feature shares, so a rescue is the same red on the map, the cards, the charts and the
// form. Applied in main.jsx; the colour constants are imported by the requests and insights features.
import { alpha, createTheme } from '@mui/material';

// One colour per kind of help. Text labels and icons always go with them, so meaning never relies on colour alone.
export const TYPE_COLORS = {
  RESCUE: '#ef4444',
  MEDICINE: '#f59e0b',
  FOOD: '#3b82f6',
  SHELTER: '#a855f7',
};

// Green always means "done". Open requests use their type colour; claimed ones get a sky-blue ring.
export const RESOLVED_COLOR = '#22c55e';
export const STATUS_COLORS = {
  OPEN: '#f8fafc',
  CLAIMED: '#38bdf8',
  RESOLVED: RESOLVED_COLOR,
  MERGED: '#64748b',
};

// Live volunteer dots, and requests waiting too long: colours no help type uses
export const VOLUNTEER_COLOR = '#2dd4bf';
export const STALE_COLOR = '#fde047';

// Dark base map, so the coloured markers stand out. CartoDB Dark Matter now asks for an API key, so we use the
// free OpenStreetMap tiles and darken them with a CSS filter (the "fl-dark-tiles" class, see requests/map.css).
export const MAP_TILES = {
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  className: 'fl-dark-tiles',
};

const BACKGROUND = '#0a0f1c';
const SURFACE = '#111a2b';
const BORDER = 'rgba(148, 163, 184, 0.14)';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#60a5fa' },
    secondary: { main: VOLUNTEER_COLOR },
    error: { main: '#ef4444' },
    warning: { main: '#f59e0b' },
    success: { main: RESOLVED_COLOR },
    info: { main: '#38bdf8' },
    background: { default: BACKGROUND, paper: SURFACE },
    divider: BORDER,
    text: { primary: '#e5e7eb', secondary: '#94a3b8' },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    h4: { fontWeight: 800, letterSpacing: '-0.02em' },
    h5: { fontWeight: 700, letterSpacing: '-0.01em' },
    h6: { fontWeight: 700 },
    subtitle2: { fontWeight: 600 },
    button: { fontWeight: 600, textTransform: 'none' },
    overline: { fontWeight: 700, letterSpacing: '0.08em' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: BACKGROUND },
        // Thin dark scrollbars, so scrolling lists don't show a bright default bar
        '*': { scrollbarWidth: 'thin', scrollbarColor: `${alpha('#94a3b8', 0.3)} transparent` },
      },
    },
    // MUI lightens dark-mode surfaces with a gradient; a flat surface with a thin border reads cleaner
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: 'none' } },
      defaultProps: { elevation: 0 },
      variants: [{ props: { variant: 'elevation' }, style: { border: `1px solid ${BORDER}` } }],
    },
    MuiAppBar: {
      styleOverrides: { root: { backgroundColor: alpha(BACKGROUND, 0.92), backdropFilter: 'blur(8px)', borderBottom: `1px solid ${BORDER}` } },
    },
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiChip: { styleOverrides: { root: { fontWeight: 600 } } },
    MuiTooltip: {
      styleOverrides: { tooltip: { backgroundColor: '#1e293b', border: `1px solid ${BORDER}`, fontSize: 13, maxWidth: 340 } },
    },
    MuiSkeleton: { styleOverrides: { root: { backgroundColor: alpha('#94a3b8', 0.1) } } },
  },
});

export default theme;

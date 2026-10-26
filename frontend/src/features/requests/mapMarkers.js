// [Person 2 – requests] Builds the HTML map markers for help requests (Leaflet divIcons styled in map.css):
// - colour = type (red rescue, amber medicine, blue food, purple shelter), green once resolved
// - the type's icon inside, so colour is never the only clue
// - size grows with priority; priority above 80 pulses; a claimed request gets a sky-blue ring
// - a stale request (OPEN for 6+ hours) gets a dashed yellow ring; the hovered/selected one is enlarged
import L from 'leaflet';
import { PULSE_PRIORITY } from './requestConstants';
import { isStale, requestColor } from './requestUtils';

// The same Material icons as TypeIcon.jsx, as raw SVG paths, because map markers are plain HTML, not React
const ICON_PATHS = {
  RESCUE: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m7.46 7.12-2.78 1.15c-.51-1.36-1.58-2.44-2.95-2.94l1.15-2.78c2.1.8 3.77 2.47 4.58 4.57M12 15c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3M9.13 4.54l1.17 2.78c-1.38.5-2.47 1.59-2.98 2.97L4.54 9.13c.81-2.11 2.48-3.78 4.59-4.59M4.54 14.87l2.78-1.15c.51 1.38 1.59 2.46 2.97 2.96l-1.17 2.78c-2.1-.81-3.77-2.48-4.58-4.59m10.34 4.59-1.15-2.78c1.37-.51 2.45-1.59 2.95-2.97l2.78 1.17c-.81 2.1-2.48 3.77-4.58 4.58',
  MEDICINE: 'M20 6h-4V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2M10 4h4v2h-4zm6 11h-3v3h-2v-3H8v-2h3v-3h2v3h3z',
  FOOD: 'M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4',
  SHELTER: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
};

// Priority 0 -> 24 px, priority 100 -> 40 px: urgent requests literally stand out
function markerSize(priorityScore) {
  return Math.round(24 + (priorityScore / 100) * 16);
}

// Leaflet rebuilds a marker's HTML whenever its icon object changes, so identical icons are created once and reused
const iconCache = new Map();

export function requestIcon(request, { highlighted = false, now = Date.now() } = {}) {
  const size = markerSize(request.priorityScore);
  const classes = ['fl-marker', `fl-marker--${request.status.toLowerCase()}`];
  if (request.status === 'OPEN' && request.priorityScore > PULSE_PRIORITY) classes.push('fl-marker--pulse');
  if (isStale(request, now)) classes.push('fl-marker--stale');
  if (highlighted) classes.push('fl-marker--active');
  const color = requestColor(request);
  const key = `${classes.join(' ')}|${size}|${color}|${request.type}`;

  if (!iconCache.has(key)) {
    iconCache.set(key, L.divIcon({
      className: 'fl-marker-wrap',
      html: `<div class="${classes.join(' ')}" style="--size:${size}px;--color:${color}">`
        + `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${ICON_PATHS[request.type]}"/></svg></div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2],
    }));
  }
  return iconCache.get(key);
}

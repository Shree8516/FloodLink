// [Person 2 – requests] Small pure helpers about help requests: stale check, distance, filtering and sorting,
// the tracking ID and the Google Maps link. Used by the map, the list, the cards and the volunteer board.
import { RESOLVED_COLOR, TYPE_COLORS } from '../../app/theme';
import { NEAR_ME_KM, STALE_AFTER_HOURS } from './requestConstants';

const EARTH_RADIUS_KM = 6371;
const STATUS_ORDER = { OPEN: 0, CLAIMED: 1, RESOLVED: 2 };

export function hoursOpen(request, now = Date.now()) {
  return (now - new Date(request.createdAt).getTime()) / 3600000;
}

// Stale = still OPEN after STALE_AFTER_HOURS: nobody has claimed it, so it needs attention
export function isStale(request, now = Date.now()) {
  return request.status === 'OPEN' && hoursOpen(request, now) >= STALE_AFTER_HOURS;
}

// Haversine: real distance along the Earth's surface (the same formula insights-service uses for duplicates)
export function distanceKm(from, request) {
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const dLat = toRadians(request.latitude - from.latitude);
  const dLon = toRadians(request.longitude - from.longitude);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRadians(from.latitude)) * Math.cos(toRadians(request.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

export function formatKm(km) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

// What a citizen can quote on the phone: #18 -> "FL-00018"
export function trackingId(id) {
  return `FL-${String(id).padStart(5, '0')}`;
}

// Opens Google Maps with driving/walking directions to the request (works on phones and desktops)
export function directionsUrl(request) {
  return `https://www.google.com/maps/dir/?api=1&destination=${request.latitude},${request.longitude}`;
}

// Map and card colour: the type colour, or green once help has arrived
export function requestColor(request) {
  return request.status === 'RESOLVED' ? RESOLVED_COLOR : TYPE_COLORS[request.type];
}

// The filter chips: status, type, "near me" and "stale". myPosition is null until the browser shares a location.
export function applyFilters(requests, filters, myPosition, now) {
  return requests.filter((request) =>
    request.status !== 'MERGED'
    && (filters.status === 'ALL' || request.status === filters.status)
    && (filters.type === 'ALL' || request.type === filters.type)
    && (!filters.staleOnly || isStale(request, now))
    && (!filters.nearMe || !myPosition || distanceKm(myPosition, request) <= NEAR_ME_KM));
}

// Copies the array (Redux state must never be sorted in place). "priority" keeps unfinished work first.
export function sortRequests(requests, sortBy, myPosition) {
  const sorted = [...requests];
  if (sortBy === 'nearest' && myPosition) {
    return sorted.sort((a, b) => distanceKm(myPosition, a) - distanceKm(myPosition, b));
  }
  if (sortBy === 'newest') {
    return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
  return sorted.sort((a, b) => (STATUS_ORDER[a.status] - STATUS_ORDER[b.status]) || (b.priorityScore - a.priorityScore));
}

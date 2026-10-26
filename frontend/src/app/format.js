// [Person 1 – app shell] Small display helpers shared by several features.

// "5 min ago" is easier to judge in an emergency than "02/12/2025, 10:15:00"
export function formatTimeAgo(dateText) {
  if (!dateText) return '';
  const minutes = Math.floor((Date.now() - new Date(dateText).getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return new Date(dateText).toLocaleDateString();
}

// "10:15 am, 2 Dec": the exact moment, for the request timeline
export function formatDateTime(dateText) {
  return new Date(dateText).toLocaleString(undefined, {
    hour: 'numeric', minute: '2-digit', day: 'numeric', month: 'short',
  });
}

// 7 -> "7 min", 135 -> "2 h 15 min": for waiting and resolve times
export function formatDuration(minutes) {
  if (minutes === null || minutes === undefined) return '–';
  const rounded = Math.round(minutes);
  if (rounded < 60) return `${rounded} min`;
  const hours = Math.floor(rounded / 60);
  const rest = rounded % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

// Minutes between two timestamps (null if either is missing)
export function minutesBetween(fromText, toText) {
  if (!fromText || !toText) return null;
  return (new Date(toText).getTime() - new Date(fromText).getTime()) / 60000;
}

// Addresses are written "Street, Area"; the part after the last comma is the area
export function areaFromAddress(address) {
  if (!address) return 'Chennai';
  const parts = address.split(',');
  return parts[parts.length - 1].trim() || 'Chennai';
}

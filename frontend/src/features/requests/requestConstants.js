// [Person 2 – requests] Constants for help requests: types, statuses, labels, the stale and pulse rules,
// and the map's starting point. Colours live in app/theme.js so every feature uses the same ones.

export const REQUEST_TYPES = ['RESCUE', 'MEDICINE', 'FOOD', 'SHELTER'];
// MERGED requests are folded into their original, so they never get a filter chip or a map marker
export const STATUSES = ['OPEN', 'CLAIMED', 'RESOLVED'];

export const TYPE_LABELS = {
  RESCUE: 'Rescue',
  MEDICINE: 'Medicine',
  FOOD: 'Food & water',
  SHELTER: 'Shelter',
};

// One line per type for the big tiles on the post form
export const TYPE_HINTS = {
  RESCUE: 'Trapped, stranded or in danger',
  MEDICINE: 'Patient, injury or medicines',
  FOOD: 'No food, milk or drinking water',
  SHELTER: 'Home flooded, need a safe place',
};

export const STATUS_LABELS = {
  OPEN: 'Open',
  CLAIMED: 'Claimed',
  RESOLVED: 'Resolved',
  MERGED: 'Merged',
};

// An OPEN request older than this is "stale": nobody has picked it up, so it gets a highlighted marker.
// VITE_STALE_AFTER_HOURS can lower it for a demo (e.g. 0.05 = 3 minutes).
export const STALE_AFTER_HOURS = Number(import.meta.env.VITE_STALE_AFTER_HOURS) || 6;

// Requests above this priority pulse on the map, so the most urgent ones catch the eye first
export const PULSE_PRIORITY = 80;

// The "Near me" filter chip shows requests within this distance
export const NEAR_ME_KM = 5;

// Centre of the map: between Velachery, Tambaram and Adyar
export const CHENNAI_CENTER = [12.98, 80.2];

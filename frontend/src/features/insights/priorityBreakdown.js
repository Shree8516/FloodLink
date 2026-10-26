// [Person 3 – insights] Turns insights-service's reason strings into a breakdown the UI can draw.
// Every scoring reason ends in ": +<points>" (see CONTRACT.md), e.g. "RESCUE request: +40" or
// "Urgent words (elderly, trapped): +10". Reasons without points (like a duplicate note) become plain notes.
import { RESOLVED_COLOR, TYPE_COLORS, VOLUNTEER_COLOR } from '../../app/theme';

const POINTS_PATTERN = /^(.*):\s*\+(\d+)$/;

// The four parts of the score (priority_service.py), recognised by how each reason starts or ends.
// "max" is the most that part can add, so a bar can show how much of it was used.
const PART_KINDS = [
  { test: (label) => /request$/.test(label), name: 'Type of help', max: 40, color: '#60a5fa' },
  { test: (label) => /affected$/.test(label), name: 'People', max: 20, color: VOLUNTEER_COLOR },
  { test: (label) => /^Waiting/.test(label), name: 'Waiting time', max: 15, color: TYPE_COLORS.MEDICINE },
  { test: (label) => /^Urgent words/.test(label), name: 'Urgent words', max: 25, color: TYPE_COLORS.RESCUE },
];
const OTHER_KIND = { name: 'Other', max: 100, color: RESOLVED_COLOR };

export function parseReasons(reasons = []) {
  const parts = [];
  const notes = [];
  reasons.forEach((reason) => {
    const match = reason.match(POINTS_PATTERN);
    if (!match) {
      notes.push(reason);
      return;
    }
    const label = match[1];
    const kind = PART_KINDS.find((candidate) => candidate.test(label)) || OTHER_KIND;
    parts.push({ label, points: Number(match[2]), ...kind });
  });
  return { parts, notes };
}

// The word goes next to the number, so the level is readable without relying on colour alone.
// Same thresholds as insights-service's suggest_service.py.
export function priorityLevel(score) {
  if (score >= 70) return { label: 'High', color: TYPE_COLORS.RESCUE };
  if (score >= 40) return { label: 'Medium', color: TYPE_COLORS.MEDICINE };
  return { label: 'Low', color: '#94a3b8' };
}

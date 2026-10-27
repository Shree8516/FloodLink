// [Person 3 – insights] Turns insights-service's reason strings into a breakdown the UI can draw.
// Every scoring reason ends in ": +<points>" (see CONTRACT.md), e.g. "Infant needs milk: +12". The labels are written
// by the local LLM, so they are free text: nothing here may depend on particular wording. Each factor simply gets the
// next colour of the palette. Reasons without points (like a duplicate note) become plain notes.
import { RESOLVED_COLOR, TYPE_COLORS, VOLUNTEER_COLOR } from '../../app/theme';

const POINTS_PATTERN = /^(.*):\s*\+(\d+)$/;

// Colours handed out in order, one per factor (the LLM gives at most six)
const FACTOR_COLORS = ['#60a5fa', VOLUNTEER_COLOR, TYPE_COLORS.MEDICINE, TYPE_COLORS.RESCUE, '#a78bfa', RESOLVED_COLOR];

export function parseReasons(reasons = []) {
  const parts = [];
  const notes = [];
  reasons.forEach((reason) => {
    const match = reason.match(POINTS_PATTERN);
    if (!match) {
      notes.push(reason);
      return;
    }
    parts.push({ label: match[1], points: Number(match[2]), color: FACTOR_COLORS[parts.length % FACTOR_COLORS.length] });
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

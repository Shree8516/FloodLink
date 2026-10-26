// [Person 3 – insights] Shows a request's priority score with a level word (High / Medium / Low).
// Hovering (or tapping on a phone) shows the breakdown: one bar for 0-100 split into the parts that earned the
// points, and each reason from insights-service, so the score is never a black box.
// PriorityBreakdown is also used on its own by the live preview in the post form (SuggestionPanel).
import { Box, Chip, Stack, Tooltip, Typography } from '@mui/material';
import SpeedIcon from '@mui/icons-material/Speed';
import { parseReasons, priorityLevel } from './priorityBreakdown';

export function PriorityBreakdown({ score, reasons = [] }) {
  const { parts, notes } = parseReasons(reasons);
  return (
    <Box>
      {/* One bar out of 100: each coloured segment is one part of the score */}
      <Box sx={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', bgcolor: 'rgba(148, 163, 184, 0.15)', mb: 1.25 }}
        role="img" aria-label={`Priority ${score} out of 100`}>
        {parts.map((part) => (
          <Box key={part.label} sx={{ width: `${part.points}%`, bgcolor: part.color }} />
        ))}
      </Box>
      <Stack spacing={0.75}>
        {parts.length === 0 && <Typography variant="body2">No details available.</Typography>}
        {parts.map((part) => (
          <Stack key={part.label} direction="row" spacing={1} alignItems="center">
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: part.color, flexShrink: 0 }} />
            <Typography variant="body2" sx={{ flex: 1 }}>{part.label}</Typography>
            <Typography variant="body2" fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums' }}>
              +{part.points}<Typography component="span" variant="caption" color="text.secondary"> / {part.max}</Typography>
            </Typography>
          </Stack>
        ))}
        {notes.map((note) => (
          <Typography key={note} variant="caption" color="warning.light">{note}</Typography>
        ))}
      </Stack>
    </Box>
  );
}

export default function PriorityBadge({ score, reasons = [], size = 'small' }) {
  const level = priorityLevel(score);
  return (
    <Tooltip arrow enterTouchDelay={0} leaveTouchDelay={4000} title={(
      <Box sx={{ p: 0.5, width: 260 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>Why priority {score}?</Typography>
        <PriorityBreakdown score={score} reasons={reasons} />
      </Box>
    )}>
      <Chip size={size} icon={<SpeedIcon style={{ color: level.color }} />}
        label={size === 'small' ? `${score} ${level.label}` : `Priority ${score} · ${level.label}`}
        variant="outlined" sx={{ fontWeight: 700, color: level.color, borderColor: `${level.color}88`, bgcolor: `${level.color}14`, flexShrink: 0 }} />
    </Tooltip>
  );
}

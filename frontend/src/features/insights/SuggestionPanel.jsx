// [Person 3 – insights] Live help on step 1 of the post form, from insights-service's keyword rules:
// - "This sounds like a Rescue request (trapped, terrace)" with a one-click "Use Rescue" button
// - a live priority preview: the score this request would get right now, with its breakdown
// The preview uses the same rules as the real analysis, so citizens learn what makes a request urgent.
import { Alert, Box, Button, LinearProgress, Paper, Stack, Typography } from '@mui/material';
import { TYPE_LABELS } from '../requests/requestConstants';
import PriorityBadge, { PriorityBreakdown } from './PriorityBadge';
import useSuggestion from './useSuggestion';

export default function SuggestionPanel({ description, type, peopleCount, onUseType }) {
  const { suggestion, status } = useSuggestion(description, type, peopleCount);

  if (status === 'idle') {
    return (
      <Typography variant="caption" color="text.secondary">
        Start describing the situation to see how urgent it looks.
      </Typography>
    );
  }
  if (status === 'error') {
    return (
      <Typography variant="caption" color="text.secondary">
        The priority preview is not available right now. You can still send the request.
      </Typography>
    );
  }

  const preview = suggestion && suggestion.priorityPreview;
  const otherType = suggestion && suggestion.suggestedType && suggestion.suggestedType !== type ? suggestion.suggestedType : null;

  return (
    <Paper variant="outlined" sx={{ position: 'relative', overflow: 'hidden', p: 2, bgcolor: 'rgba(96, 165, 250, 0.05)' }}>
      {status === 'loading' && <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2 }} />}
      {otherType && (
        <Alert severity="info" variant="outlined" sx={{ mb: 2 }}
          action={<Button color="inherit" size="small" onClick={() => onUseType(otherType)}>Use {TYPE_LABELS[otherType]}</Button>}>
          This sounds like a <strong>{TYPE_LABELS[otherType]}</strong> request ({suggestion.matchedKeywords.join(', ')}).
        </Alert>
      )}
      {preview ? (
        <>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
            <Typography variant="overline" color="text.secondary">Live priority preview</Typography>
            <PriorityBadge score={preview.score} reasons={preview.reasons} size="medium" />
          </Stack>
          <PriorityBreakdown score={preview.score} reasons={preview.reasons} />
          <Box sx={{ mt: 1.5 }}>
            <Typography variant="caption" color="text.secondary">
              A preview from the same rules volunteers rely on. The final score is set once, when you send.
            </Typography>
          </Box>
        </>
      ) : (
        <Typography variant="body2" color="text.secondary">Calculating...</Typography>
      )}
    </Paper>
  );
}

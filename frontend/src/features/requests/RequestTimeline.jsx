// [Person 2 – requests] The life of one request as a small vertical timeline: Posted -> Claimed -> Resolved
// (or Merged), each with its time and how long the step took. Shown when "Timeline" is opened on a RequestCard.
// Requests claimed before timestamps were recorded show "time not recorded" instead of a wrong time.
import { Box, Stack, Typography } from '@mui/material';
import { formatDateTime, formatDuration, minutesBetween } from '../../app/format';
import { RESOLVED_COLOR, STATUS_COLORS } from '../../app/theme';

function buildSteps(request) {
  const claimed = request.status === 'CLAIMED' || request.status === 'RESOLVED';
  const steps = [{ label: 'Posted', time: request.createdAt, done: true, color: '#60a5fa' }];
  if (request.status === 'MERGED') {
    steps.push({ label: `Merged into #${request.mergedIntoId}`, time: request.updatedAt, done: true, color: STATUS_COLORS.MERGED });
    return steps;
  }
  steps.push({
    label: request.claimedBy ? `Claimed by ${request.claimedBy.name}` : 'Waiting for a volunteer',
    time: request.claimedAt,
    done: claimed,
    color: STATUS_COLORS.CLAIMED,
  });
  steps.push({ label: 'Resolved', time: request.resolvedAt, done: request.status === 'RESOLVED', color: RESOLVED_COLOR });
  return steps;
}

export default function RequestTimeline({ request }) {
  const steps = buildSteps(request);
  return (
    <Box component="ol" sx={{ listStyle: 'none', m: 0, p: 0 }} aria-label={`Timeline of request #${request.id}`}>
      {steps.map((step, index) => {
        const previous = steps[index - 1];
        const took = previous && step.done ? minutesBetween(previous.time, step.time) : null;
        const isLast = index === steps.length - 1;
        return (
          <Stack component="li" key={step.label} direction="row" spacing={1.5}>
            {/* The dot, and a line down to the next step */}
            <Stack alignItems="center" sx={{ pt: 0.5 }}>
              <Box sx={{
                width: 12, height: 12, borderRadius: '50%', flexShrink: 0,
                bgcolor: step.done ? step.color : 'transparent', border: `2px solid ${step.done ? step.color : '#475569'}`,
              }} />
              {!isLast && <Box sx={{ width: 2, flex: 1, minHeight: 18, bgcolor: steps[index + 1].done ? step.color : '#334155' }} />}
            </Stack>
            <Box sx={{ pb: isLast ? 0 : 1.5 }}>
              <Typography variant="body2" fontWeight={600} color={step.done ? 'text.primary' : 'text.secondary'}>
                {step.label}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {!step.done && 'Not yet'}
                {step.done && (step.time ? formatDateTime(step.time) : 'time not recorded')}
                {took !== null && ` · after ${formatDuration(took)}`}
              </Typography>
            </Box>
          </Stack>
        );
      })}
    </Box>
  );
}

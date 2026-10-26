// [Person 3 – insights] One headline number on the admin dashboard: an icon, a label, the value (counting up
// smoothly when it changes, using Person 1's AnimatedNumber) and a short hint underneath.
import { Box, Paper, Stack, Typography } from '@mui/material';
import AnimatedNumber from '../live/AnimatedNumber';

// "text" replaces the animated number when the value is better shown as words, e.g. "1 h 5 min" or "–"
export default function KpiCard({ icon: Icon, label, value, decimals = 0, text, hint, color }) {
  return (
    <Paper variant="elevation" sx={{ p: 2, height: '100%' }}>
      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1 }}>
        <Box sx={{ width: 32, height: 32, borderRadius: 2, display: 'grid', placeItems: 'center', color, bgcolor: `${color}1f` }}>
          <Icon fontSize="small" />
        </Box>
        <Typography variant="body2" color="text.secondary" noWrap>{label}</Typography>
      </Stack>
      <Typography variant="h4" sx={{ fontVariantNumeric: 'tabular-nums' }}>
        {text !== undefined ? text : <AnimatedNumber value={value} decimals={decimals} />}
      </Typography>
      {hint && <Typography variant="caption" color="text.secondary">{hint}</Typography>}
    </Paper>
  );
}

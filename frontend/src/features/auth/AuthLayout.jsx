// [Person 1 – auth] Shared frame for the Login and Register pages: a brand header (logo, name, one-line promise),
// three short facts about FloodLink on wide screens, and the form card. Keeps both pages consistent.
import { Box, Paper, Stack, Typography } from '@mui/material';
import BoltIcon from '@mui/icons-material/Bolt';
import CallMergeIcon from '@mui/icons-material/CallMerge';
import MapIcon from '@mui/icons-material/Map';
import BrandMark from '../../app/BrandMark';

const FACTS = [
  { icon: MapIcon, text: 'Every call for help on one live map' },
  { icon: BoltIcon, text: 'Explainable priority scores, so the most urgent go first' },
  { icon: CallMergeIcon, text: 'Duplicate posts are caught and merged' },
];

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <Box sx={{
      minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', px: 2, py: { xs: 4, md: 6 },
      // A soft red and blue glow behind the card, echoing the logo
      background: 'radial-gradient(circle at 15% 20%, rgba(239, 68, 68, 0.14), transparent 40%),'
        + ' radial-gradient(circle at 85% 80%, rgba(59, 130, 246, 0.16), transparent 45%)',
    }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={{ xs: 4, md: 8 }} alignItems="center" sx={{ width: '100%', maxWidth: 980 }}>
        <Box sx={{ flex: 1, width: '100%' }}>
          <BrandMark size="large" tagline="Chennai flood response, coordinated live" />
          <Stack spacing={2} sx={{ mt: 4, display: { xs: 'none', md: 'flex' } }}>
            {FACTS.map((fact) => (
              <Stack key={fact.text} direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ width: 36, height: 36, borderRadius: 2, display: 'grid', placeItems: 'center', bgcolor: 'action.hover', color: 'primary.main' }}>
                  <fact.icon fontSize="small" />
                </Box>
                <Typography color="text.secondary">{fact.text}</Typography>
              </Stack>
            ))}
          </Stack>
        </Box>
        <Paper variant="elevation" sx={{ p: { xs: 3, sm: 4 }, width: '100%', maxWidth: 440, bgcolor: 'background.paper' }}>
          <Typography variant="h5">{title}</Typography>
          {subtitle && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>{subtitle}</Typography>}
          {children}
        </Paper>
      </Stack>
    </Box>
  );
}

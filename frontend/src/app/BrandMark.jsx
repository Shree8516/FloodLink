// [Person 1 – app shell] The FloodLink logo: a wave icon in a red-to-blue tile, the name, and an optional tagline.
// Used in the NavBar and, larger, in the brand header of the login and register pages.
import { Box, Stack, Typography } from '@mui/material';
import WavesIcon from '@mui/icons-material/Waves';

export default function BrandMark({ size = 'small', tagline }) {
  const large = size === 'large';
  const tile = large ? 56 : 34;
  return (
    <Stack direction="row" spacing={large ? 2 : 1.25} alignItems="center">
      <Box sx={{
        width: tile, height: tile, borderRadius: large ? 3 : 2, display: 'grid', placeItems: 'center', color: '#fff',
        background: 'linear-gradient(135deg, #ef4444 0%, #3b82f6 100%)', boxShadow: '0 6px 20px rgba(59, 130, 246, 0.35)',
      }}>
        <WavesIcon sx={{ fontSize: large ? 32 : 20 }} />
      </Box>
      <Box>
        <Typography variant={large ? 'h4' : 'h6'} component="span" sx={{ display: 'block', lineHeight: 1.1, fontWeight: 800 }}>
          FloodLink
        </Typography>
        {tagline && (
          <Typography variant={large ? 'body1' : 'caption'} color="text.secondary">{tagline}</Typography>
        )}
      </Box>
    </Stack>
  );
}

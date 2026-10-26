// [Person 2 – requests] Bottom sheet for phones: the request list lives in a panel that slides up over the map.
// Collapsed, it shows a handle and a one-line summary; tapping it expands to 75% of the screen.
// It tells the floating SOS button how tall it is (CSS variable), so the button is never hidden behind it.
import { useEffect, useState } from 'react';
import { Box, ButtonBase, Paper, Typography } from '@mui/material';

export const SHEET_COLLAPSED_PX = 96;
const EXPANDED_HEIGHT = '75vh';

export default function MobileSheet({ summary, children }) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--floodlink-bottom-inset', expanded ? EXPANDED_HEIGHT : `${SHEET_COLLAPSED_PX}px`);
    return () => root.style.removeProperty('--floodlink-bottom-inset');
  }, [expanded]);

  return (
    <Paper variant="elevation" sx={{
      position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 1100,
      height: expanded ? EXPANDED_HEIGHT : SHEET_COLLAPSED_PX, transition: 'height 0.25s ease',
      borderRadius: '16px 16px 0 0', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      boxShadow: '0 -8px 24px rgba(0, 0, 0, 0.45)',
    }}>
      <ButtonBase onClick={() => setExpanded(!expanded)} aria-expanded={expanded}
        sx={{ flexDirection: 'column', py: 1.25, width: '100%', flexShrink: 0 }}>
        <Box sx={{ width: 40, height: 4, borderRadius: 2, bgcolor: 'text.secondary', opacity: 0.5, mb: 1 }} />
        <Typography variant="subtitle2">{summary}</Typography>
        <Typography variant="caption" color="text.secondary">
          {expanded ? 'Tap to show the map' : 'Tap to see the list and filters'}
        </Typography>
      </ButtonBase>
      {/* Kept mounted while collapsed, so filters and scroll position survive opening and closing */}
      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', px: 2, pb: 3, visibility: expanded ? 'visible' : 'hidden' }}>
        {children}
      </Box>
    </Paper>
  );
}

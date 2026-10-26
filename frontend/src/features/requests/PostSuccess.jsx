// [Person 2 – requests] The screen after "Send help request": a big confirmation, the tracking ID to quote on the
// phone (FL-00018), its priority and any duplicate warning, and buttons to track it on the map or post another.
// If there was no connection, it explains that the request is saved and will be sent automatically.
import { Box, Button, IconButton, Paper, Stack, Tooltip, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import MapIcon from '@mui/icons-material/Map';
import { Link as RouterLink } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import DuplicateWarning from '../insights/DuplicateWarning';
import PriorityBadge from '../insights/PriorityBadge';
import { RESOLVED_COLOR } from '../../app/theme';
import { trackingId } from './requestUtils';

function QueuedOffline({ onPostAnother }) {
  return (
    <Stack spacing={2} alignItems="center" sx={{ textAlign: 'center' }}>
      <CloudOffIcon sx={{ fontSize: 64, color: 'warning.main' }} />
      <Typography variant="h5">Saved on this device</Typography>
      <Typography color="text.secondary" sx={{ maxWidth: 440 }}>
        There is no connection right now. FloodLink will send your request automatically as soon as you are back online.
        The bar at the top shows how many requests are waiting.
      </Typography>
      <Button variant="outlined" onClick={onPostAnother}>Post another request</Button>
    </Stack>
  );
}

export default function PostSuccess({ result, onPostAnother }) {
  const { enqueueSnackbar } = useSnackbar();
  const saved = result.saved;
  const id = saved && trackingId(saved.id);

  function copyTrackingId() {
    navigator.clipboard.writeText(id)
      .then(() => enqueueSnackbar('Tracking ID copied', { variant: 'success' }))
      .catch(() => enqueueSnackbar('Could not copy. Please write it down.', { variant: 'warning' }));
  }

  return (
    <Box sx={{ maxWidth: 560, mx: 'auto', px: 2, py: { xs: 3, md: 6 } }}>
      <Paper variant="elevation" sx={{ p: { xs: 3, sm: 5 } }}>
        {!saved ? <QueuedOffline onPostAnother={onPostAnother} /> : (
          <Stack spacing={2.5} alignItems="center" sx={{ textAlign: 'center' }}>
            <CheckCircleIcon sx={{ fontSize: 72, color: RESOLVED_COLOR }} />
            <Box>
              <Typography variant="h5">Help request sent</Typography>
              <Typography color="text.secondary">Volunteers can see it on the live map now.</Typography>
            </Box>
            <Box sx={{ px: 3, py: 2, borderRadius: 3, border: 1, borderColor: 'divider', bgcolor: 'rgba(148, 163, 184, 0.06)' }}>
              <Typography variant="overline" color="text.secondary">Your tracking ID</Typography>
              <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                <Typography variant="h4" sx={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '0.04em' }}>{id}</Typography>
                <Tooltip title="Copy">
                  <IconButton onClick={copyTrackingId} aria-label="Copy tracking ID"><ContentCopyIcon /></IconButton>
                </Tooltip>
              </Stack>
            </Box>
            <PriorityBadge score={saved.priorityScore} reasons={saved.priorityReasons} size="medium" />
            <Box sx={{ width: '100%', textAlign: 'left' }}>
              <DuplicateWarning request={saved} />
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ width: '100%' }}>
              <Button fullWidth variant="contained" startIcon={<MapIcon />} component={RouterLink} to={`/?focus=${saved.id}`}>
                Track on the map
              </Button>
              <Button fullWidth variant="outlined" onClick={onPostAnother}>Post another</Button>
            </Stack>
          </Stack>
        )}
      </Paper>
    </Box>
  );
}

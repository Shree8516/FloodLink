// [Person 1 – live] The strip under the navbar on every page: LIVE/OFFLINE, animated counters (open, claimed,
// resolved, volunteers online), a notice when requests are waiting in the offline queue, and the newest activity
// line on wide screens. Counts come from the requests slice and the presence list, so they change live.
import { Box, Chip, Divider, Stack, Tooltip, Typography } from '@mui/material';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import { useSelector } from 'react-redux';
import { formatTimeAgo } from '../../app/format';
import { RESOLVED_COLOR, STATUS_COLORS, VOLUNTEER_COLOR } from '../../app/theme';
import AnimatedNumber from './AnimatedNumber';

function LiveIndicator({ connected }) {
  const color = connected ? RESOLVED_COLOR : '#64748b';
  return (
    <Tooltip title={connected ? 'Live updates are on' : 'Live updates are offline. Data may be out of date.'}>
      <Stack direction="row" spacing={0.75} alignItems="center" sx={{ flexShrink: 0 }}>
        <Box sx={{
          width: 8, height: 8, borderRadius: '50%', bgcolor: color,
          boxShadow: connected ? `0 0 0 4px ${color}33` : 'none',
          animation: connected ? 'flLivePulse 2s ease-in-out infinite' : 'none',
          '@keyframes flLivePulse': { '50%': { boxShadow: `0 0 0 7px ${color}11` } },
        }} />
        <Typography variant="overline" sx={{ lineHeight: 1, color }}>{connected ? 'Live' : 'Offline'}</Typography>
      </Stack>
    </Tooltip>
  );
}

function Stat({ label, value, color }) {
  return (
    <Stack direction="row" spacing={0.75} alignItems="baseline" sx={{ flexShrink: 0 }}>
      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color, alignSelf: 'center' }} />
      <Typography variant="subtitle1" fontWeight={800} sx={{ fontVariantNumeric: 'tabular-nums' }}>
        <AnimatedNumber value={value} />
      </Typography>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
    </Stack>
  );
}

export default function StatsBar() {
  const items = useSelector((state) => state.requests.items);
  const { connected, onlineCount, pendingOffline, activity } = useSelector((state) => state.live);
  const countFor = (status) => items.filter((request) => request.status === status).length;
  const latest = activity[0];

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'rgba(17, 26, 43, 0.6)', px: { xs: 2, md: 3 }, py: 1 }}>
      {/* Scrolls sideways on narrow phones instead of wrapping onto two lines */}
      <Stack direction="row" spacing={{ xs: 2, md: 3 }} alignItems="center" sx={{ overflowX: 'auto', whiteSpace: 'nowrap' }}>
        <LiveIndicator connected={connected} />
        <Stat label="open" value={countFor('OPEN')} color={STATUS_COLORS.OPEN} />
        <Stat label="claimed" value={countFor('CLAIMED')} color={STATUS_COLORS.CLAIMED} />
        <Stat label="resolved" value={countFor('RESOLVED')} color={RESOLVED_COLOR} />
        <Stat label={onlineCount === 1 ? 'volunteer online' : 'volunteers online'} value={onlineCount} color={VOLUNTEER_COLOR} />
        {pendingOffline > 0 && (
          <Tooltip title="Saved on this device. They are sent automatically when the connection is back.">
            <Chip size="small" color="warning" variant="outlined" icon={<CloudOffIcon />}
              label={`${pendingOffline} waiting to send`} />
          </Tooltip>
        )}
        {latest && (
          <>
            <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', lg: 'block' } }} />
            <Typography variant="body2" color="text.secondary" noWrap title={latest.message}
              sx={{ display: { xs: 'none', lg: 'block' }, minWidth: 0, flex: 1 }}>
              <Box component="span" sx={{ color: 'text.primary', fontWeight: 600 }}>{latest.message}</Box>
              {' · '}{formatTimeAgo(latest.createdAt)}
            </Typography>
          </>
        )}
      </Stack>
    </Box>
  );
}

// [Person 3 – insights] Live activity sidebar on the admin dashboard: every post, claim, resolve and merge as it
// happens, newest first, with an icon per kind of event. Reads Person 1's live slice (filled over Socket.io).
import { Box, Paper, Stack, Typography } from '@mui/material';
import CallMergeIcon from '@mui/icons-material/CallMerge';
import CampaignIcon from '@mui/icons-material/Campaign';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import EditIcon from '@mui/icons-material/Edit';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import { useSelector } from 'react-redux';
import EmptyState from '../../app/EmptyState';
import { formatTimeAgo } from '../../app/format';
import { RESOLVED_COLOR, STATUS_COLORS, TYPE_COLORS } from '../../app/theme';

const EVENT_STYLES = {
  'request:created': { icon: CampaignIcon, color: TYPE_COLORS.RESCUE },
  'request:claimed': { icon: DirectionsRunIcon, color: STATUS_COLORS.CLAIMED },
  'request:resolved': { icon: TaskAltIcon, color: RESOLVED_COLOR },
  'request:merged': { icon: CallMergeIcon, color: TYPE_COLORS.MEDICINE },
  'request:updated': { icon: EditIcon, color: '#94a3b8' },
  'request:deleted': { icon: DeleteOutlineIcon, color: '#94a3b8' },
};

export default function ActivityFeed() {
  const { activity, connected } = useSelector((state) => state.live);

  return (
    <Paper variant="elevation" sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: connected ? RESOLVED_COLOR : '#64748b' }} />
        <Typography variant="subtitle1" fontWeight={700}>Live activity</Typography>
      </Stack>
      {activity.length === 0 && <EmptyState compact title="Quiet so far" hint="New posts, claims and resolves appear here instantly." />}
      <Stack component="ol" spacing={1.5} sx={{ listStyle: 'none', m: 0, p: 0, overflowY: 'auto', flex: 1, minHeight: 0 }}>
        {activity.map((entry) => {
          const style = EVENT_STYLES[entry.event] || EVENT_STYLES['request:updated'];
          return (
            <Stack component="li" key={entry._id} direction="row" spacing={1.25}
              sx={{ animation: 'flFeedIn 0.35s ease-out', '@keyframes flFeedIn': { from: { opacity: 0, transform: 'translateY(-6px)' } } }}>
              <Box sx={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, display: 'grid', placeItems: 'center', color: style.color, bgcolor: `${style.color}1f` }}>
                <style.icon sx={{ fontSize: 16 }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2">{entry.message}</Typography>
                <Typography variant="caption" color="text.secondary">{formatTimeAgo(entry.createdAt)}</Typography>
              </Box>
            </Stack>
          );
        })}
      </Stack>
    </Paper>
  );
}

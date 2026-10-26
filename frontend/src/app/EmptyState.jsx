// [Person 1 – app shell] A friendly "nothing here (yet)" message with an icon, a hint and an optional button.
// Used wherever a list can be empty: the request list, the volunteer columns, the activity feed.
import { Box, Stack, Typography } from '@mui/material';
import InboxIcon from '@mui/icons-material/Inbox';

export default function EmptyState({ icon: Icon = InboxIcon, title, hint, action, compact = false }) {
  return (
    <Stack alignItems="center" spacing={1} sx={{ textAlign: 'center', py: compact ? 2 : 5, px: 2, color: 'text.secondary' }}>
      <Box sx={{ width: compact ? 40 : 56, height: compact ? 40 : 56, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: 'action.hover' }}>
        <Icon fontSize={compact ? 'small' : 'medium'} />
      </Box>
      <Typography variant={compact ? 'body2' : 'subtitle1'} color="text.primary" fontWeight={600}>{title}</Typography>
      {hint && <Typography variant="body2" sx={{ maxWidth: 320 }}>{hint}</Typography>}
      {action}
    </Stack>
  );
}

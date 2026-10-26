// [Person 2 – requests] Volunteer task board (Kanban): Claimed -> On the way -> Resolved.
// "Start trip" moves a task to On the way and opens Google Maps directions; "Mark resolved" finishes it for everyone.
// Columns are filtered from the shared Redux list, so live updates (e.g. an admin resolving a task) apply here too.
// On phones the three columns sit side by side and swipe horizontally.
import { useEffect, useState } from 'react';
import { Box, Button, Chip, Paper, Stack, Typography } from '@mui/material';
import DirectionsIcon from '@mui/icons-material/Directions';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import UndoIcon from '@mui/icons-material/Undo';
import { Link as RouterLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useSnackbar } from 'notistack';
import EmptyState from '../../app/EmptyState';
import { RESOLVED_COLOR, STATUS_COLORS, TYPE_COLORS } from '../../app/theme';
import { LocationToggle } from '../live/LiveControls';
import { loadOnTheWay, saveOnTheWay } from './onTheWay';
import RequestCard from './RequestCard';
import { fetchRequests, resolveRequest } from './requestsSlice';
import { directionsUrl } from './requestUtils';
import useNow from './useNow';

// Only the latest finished tasks; the full history is in the admin report
const RESOLVED_SHOWN = 10;

function Column({ title, color, hint, count, children }) {
  return (
    <Paper variant="elevation" sx={{ p: 1.5, display: 'flex', flexDirection: 'column', minHeight: 0, scrollSnapAlign: 'start' }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ px: 0.5, mb: 0.5 }}>
        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color }} />
        <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
        <Chip size="small" label={count} />
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ px: 0.5, mb: 1.5 }}>{hint}</Typography>
      <Stack spacing={1.5} sx={{ overflowY: { md: 'auto' }, pr: { md: 0.5 } }}>{children}</Stack>
    </Paper>
  );
}

function NavigateButton({ request, variant = 'text' }) {
  return (
    <Button size="small" variant={variant} startIcon={<DirectionsIcon />} href={directionsUrl(request)} target="_blank" rel="noreferrer">
      Navigate
    </Button>
  );
}

export default function VolunteerDashboard() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const { items, loaded } = useSelector((state) => state.requests);
  const { enqueueSnackbar } = useSnackbar();
  const now = useNow();
  const [onTheWay, setOnTheWay] = useState(() => loadOnTheWay(user.id));
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    if (!loaded) dispatch(fetchRequests());
  }, [loaded, dispatch]);

  function updateOnTheWay(requestIds) {
    setOnTheWay(requestIds);
    saveOnTheWay(user.id, requestIds);
  }

  function startTrip(request) {
    updateOnTheWay([...onTheWay, request.id]);
    window.open(directionsUrl(request), '_blank', 'noopener');
  }

  async function resolve(request) {
    setBusyId(request.id);
    try {
      await dispatch(resolveRequest(request.id)).unwrap();
      updateOnTheWay(onTheWay.filter((id) => id !== request.id));
      enqueueSnackbar(`#${request.id} resolved. Thank you!`, { variant: 'success' });
    } catch (message) {
      enqueueSnackbar(message, { variant: 'error' });
    } finally {
      setBusyId(null);
    }
  }

  const mine = items.filter((request) => request.claimedBy && request.claimedBy.id === user.id);
  const active = mine.filter((request) => request.status === 'CLAIMED');
  const claimed = active.filter((request) => !onTheWay.includes(request.id));
  const travelling = active.filter((request) => onTheWay.includes(request.id));
  const resolved = mine.filter((request) => request.status === 'RESOLVED')
    .sort((a, b) => new Date(b.resolvedAt || b.updatedAt) - new Date(a.resolvedAt || a.updatedAt))
    .slice(0, RESOLVED_SHOWN);

  return (
    <Box sx={{ px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 }, height: { md: '100%' }, display: 'flex', flexDirection: 'column' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }} sx={{ mb: 2 }}>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5">My tasks</Typography>
          <Typography variant="body2" color="text.secondary">
            {active.length} in progress · {mine.filter((request) => request.status === 'RESOLVED').length} resolved by you
          </Typography>
        </Box>
        <LocationToggle showLabel />
      </Stack>

      <Box sx={{
        flex: 1, minHeight: 0, display: 'grid', gap: 2,
        gridTemplateColumns: { xs: 'repeat(3, 85vw)', sm: 'repeat(3, 60vw)', md: 'repeat(3, minmax(0, 1fr))' },
        overflowX: { xs: 'auto', md: 'visible' }, scrollSnapType: { xs: 'x mandatory', md: 'none' }, pb: { xs: 1, md: 0 },
      }}>
        <Column title="Claimed" color={STATUS_COLORS.CLAIMED} count={claimed.length} hint="Start the trip when you set off">
          {claimed.length === 0 && (
            <EmptyState compact icon={TaskAltIcon} title="Nothing waiting"
              hint="Claim an open request on the live map."
              action={<Button size="small" component={RouterLink} to="/">Open the live map</Button>} />
          )}
          {claimed.map((request) => (
            <RequestCard key={request.id} request={request} now={now} actions={(
              <>
                <Button size="small" variant="contained" startIcon={<DirectionsRunIcon />} onClick={() => startTrip(request)}>
                  Start trip
                </Button>
                <Button size="small" color="success" disabled={busyId === request.id} onClick={() => resolve(request)}>
                  Mark resolved
                </Button>
              </>
            )} />
          ))}
        </Column>

        <Column title="On the way" color={TYPE_COLORS.MEDICINE} count={travelling.length} hint="Navigate, then mark it resolved on arrival">
          {travelling.length === 0 && <EmptyState compact icon={DirectionsRunIcon} title="Not travelling" hint="Press Start trip on a claimed task." />}
          {travelling.map((request) => (
            <RequestCard key={request.id} request={request} now={now} actions={(
              <>
                <NavigateButton request={request} variant="contained" />
                <Button size="small" variant="contained" color="success" disabled={busyId === request.id} onClick={() => resolve(request)}>
                  Mark resolved
                </Button>
                <Button size="small" color="inherit" startIcon={<UndoIcon />}
                  onClick={() => updateOnTheWay(onTheWay.filter((id) => id !== request.id))}>
                  Back
                </Button>
              </>
            )} />
          ))}
        </Column>

        <Column title="Resolved" color={RESOLVED_COLOR} count={resolved.length} hint={`Your last ${RESOLVED_SHOWN} completed tasks`}>
          {resolved.length === 0 && <EmptyState compact icon={TaskAltIcon} title="No completed tasks yet" hint="They will appear here." />}
          {resolved.map((request) => <RequestCard key={request.id} request={request} now={now} actions={<></>} />)}
        </Column>
      </Box>
    </Box>
  );
}

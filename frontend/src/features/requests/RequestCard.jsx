// [Person 2 – requests] One help request as a card: type icon, priority badge, status / stale / report-count /
// distance chips, details, duplicate warning, an expandable timeline, and the buttons this user may press
// (Claim / Mark resolved / Directions / Delete). Hovering or clicking the card highlights its map marker.
// Used by RequestList and VolunteerDashboard (which passes its own action buttons).
import { useState } from 'react';
import {
  Box, Button, Card, CardActions, CardContent, Chip, Collapse, Dialog, DialogActions, DialogContent, DialogTitle,
  Link, Stack, Typography,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DirectionsIcon from '@mui/icons-material/Directions';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import GroupsIcon from '@mui/icons-material/Groups';
import HourglassBottomIcon from '@mui/icons-material/HourglassBottom';
import NearMeIcon from '@mui/icons-material/NearMe';
import PhoneIcon from '@mui/icons-material/Phone';
import PlaceIcon from '@mui/icons-material/Place';
import TimelineIcon from '@mui/icons-material/Timeline';
import { useDispatch, useSelector } from 'react-redux';
import { useSnackbar } from 'notistack';
import DuplicateWarning from '../insights/DuplicateWarning';
import PriorityBadge from '../insights/PriorityBadge';
import ReportCountChip from '../insights/ReportCountChip';
import { formatTimeAgo } from '../../app/format';
import { STALE_COLOR, STATUS_COLORS } from '../../app/theme';
import { claimRequest, deleteRequest, resolveRequest } from './requestsSlice';
import { STATUS_LABELS, TYPE_LABELS } from './requestConstants';
import { directionsUrl, formatKm, hoursOpen, isStale, requestColor } from './requestUtils';
import RequestTimeline from './RequestTimeline';
import { TypeAvatar } from './TypeIcon';

// Mirrors the backend rules, only to decide which buttons to show (request-service still enforces them)
function allowedActions(request, user) {
  const isVolunteer = user.role === 'VOLUNTEER';
  const isAdmin = user.role === 'ADMIN';
  const isMyClaim = request.claimedBy && request.claimedBy.id === user.id;
  return {
    canClaim: isVolunteer && request.status === 'OPEN',
    canResolve: request.status === 'CLAIMED' && ((isVolunteer && isMyClaim) || isAdmin),
    canDelete: isAdmin,
  };
}

export function StatusChip({ status }) {
  const color = STATUS_COLORS[status];
  return (
    <Chip size="small" label={STATUS_LABELS[status]} variant="outlined"
      sx={{ color, borderColor: `${color}88`, bgcolor: `${color}14` }} />
  );
}

function Detail({ icon: Icon, children }) {
  return (
    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0 }}>
      <Icon sx={{ fontSize: 16, color: 'text.secondary', flexShrink: 0 }} />
      <Typography variant="body2" color="text.secondary" noWrap>{children}</Typography>
    </Stack>
  );
}

export default function RequestCard({ request, now = Date.now(), distanceKm = null, highlighted = false, onHover, onSelect, actions }) {
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const [busy, setBusy] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { canClaim, canResolve, canDelete } = allowedActions(request, user);
  const stale = isStale(request, now);

  // unwrap() turns a rejected thunk into a thrown error, so we can show its message as a toast
  async function runAction(thunk, successMessage) {
    setBusy(true);
    try {
      await dispatch(thunk(request.id)).unwrap();
      enqueueSnackbar(successMessage, { variant: 'success' });
    } catch (message) {
      enqueueSnackbar(message, { variant: 'error' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card id={`request-card-${request.id}`} variant="outlined"
      onMouseEnter={onHover && (() => onHover(request.id))} onMouseLeave={onHover && (() => onHover(null))}
      onClick={onSelect && (() => onSelect(request.id))}
      sx={{
        flexShrink: 0,
        borderLeft: `4px solid ${requestColor(request)}`,
        borderColor: highlighted ? 'primary.main' : 'divider',
        borderLeftColor: requestColor(request),
        bgcolor: highlighted ? 'rgba(96, 165, 250, 0.08)' : 'background.paper',
        cursor: onSelect ? 'pointer' : 'default',
        transition: 'background-color 0.15s, border-color 0.15s',
      }}>
      <CardContent sx={{ pb: 1 }}>
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          <TypeAvatar type={request.type} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="subtitle2" noWrap>{TYPE_LABELS[request.type]}</Typography>
              <Typography variant="caption" color="text.secondary" noWrap>#{request.id} · {formatTimeAgo(request.createdAt)}</Typography>
              <Box sx={{ flexGrow: 1 }} />
              <PriorityBadge score={request.priorityScore} reasons={request.priorityReasons} />
            </Stack>
            <Typography variant="body2" sx={{ mt: 0.5 }}>{request.description}</Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ mt: 1.25 }}>
          <StatusChip status={request.status} />
          {stale && (
            <Chip size="small" icon={<HourglassBottomIcon style={{ color: STALE_COLOR }} />} variant="outlined"
              label={`Waiting ${Math.floor(hoursOpen(request, now))} h`} sx={{ color: STALE_COLOR, borderColor: `${STALE_COLOR}88` }} />
          )}
          <ReportCountChip count={request.reportCount} />
          {distanceKm !== null && <Chip size="small" variant="outlined" icon={<NearMeIcon />} label={formatKm(distanceKm)} />}
        </Stack>

        <Stack spacing={0.5} sx={{ mt: 1.25 }}>
          <Detail icon={PlaceIcon}>{request.address}</Detail>
          <Stack direction="row" spacing={2}>
            <Detail icon={GroupsIcon}>{request.peopleCount} {request.peopleCount === 1 ? 'person' : 'people'}</Detail>
            <Detail icon={PhoneIcon}>
              {request.contactName} · <Link href={`tel:${request.contactPhone}`} onClick={(event) => event.stopPropagation()}>{request.contactPhone}</Link>
            </Detail>
          </Stack>
          {request.claimedBy && request.status === 'CLAIMED' && (
            <Detail icon={DirectionsRunIcon}>{request.claimedBy.name} is on it</Detail>
          )}
        </Stack>

        <DuplicateWarning request={request} />
        <Collapse in={showTimeline} unmountOnExit>
          <Box sx={{ mt: 1.5, p: 1.5, borderRadius: 2, bgcolor: 'rgba(148, 163, 184, 0.06)' }}>
            <RequestTimeline request={request} />
          </Box>
        </Collapse>
      </CardContent>

      {/* Buttons must not also trigger the card's own click (which selects it on the map) */}
      <CardActions sx={{ pt: 0, px: 2, pb: 1.5, flexWrap: 'wrap', gap: 0.5 }} onClick={(event) => event.stopPropagation()}>
        {actions || (
          <>
            {canClaim && (
              <Button size="small" variant="contained" disabled={busy}
                onClick={() => runAction(claimRequest, `You claimed #${request.id}. It is on your task board.`)}>
                Claim
              </Button>
            )}
            {canResolve && (
              <Button size="small" variant="contained" color="success" disabled={busy}
                onClick={() => runAction(resolveRequest, `#${request.id} marked as resolved`)}>
                Mark resolved
              </Button>
            )}
            {request.status !== 'RESOLVED' && (user.role !== 'CITIZEN') && (
              <Button size="small" startIcon={<DirectionsIcon />} href={directionsUrl(request)} target="_blank" rel="noreferrer">
                Directions
              </Button>
            )}
          </>
        )}
        <Button size="small" color="inherit" startIcon={<TimelineIcon />} onClick={() => setShowTimeline(!showTimeline)}
          sx={{ color: 'text.secondary' }} aria-expanded={showTimeline}>
          {showTimeline ? 'Hide timeline' : 'Timeline'}
        </Button>
        {canDelete && !actions && (
          <Button size="small" color="error" startIcon={<DeleteOutlineIcon />} disabled={busy} onClick={() => setConfirmDelete(true)}
            sx={{ ml: 'auto' }}>
            Delete
          </Button>
        )}
      </CardActions>

      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)} onClick={(event) => event.stopPropagation()}>
        <DialogTitle>Delete request #{request.id}?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Use this for spam or test posts only. It disappears from every screen and cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={() => {
            setConfirmDelete(false);
            runAction(deleteRequest, `Request #${request.id} deleted`);
          }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}

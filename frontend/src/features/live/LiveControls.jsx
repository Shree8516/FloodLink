// [Person 1 – live] The two live switches in the NavBar:
// - AlertsToggle (volunteers and admins): browser notifications for new requests with priority above 70.
// - LocationToggle (volunteers): share my approximate location, shown as a live dot on everyone's map.
// Both are remembered in the live slice (and localStorage). showLabel renders a labelled button for the phone menu.
import { Button, IconButton, Tooltip } from '@mui/material';
import LocationDisabledIcon from '@mui/icons-material/LocationDisabled';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import { useDispatch, useSelector } from 'react-redux';
import { useSnackbar } from 'notistack';
import { alertsEnabledChanged, sharingLocationChanged } from './liveSlice';
import { ALERT_PRIORITY, askNotificationPermission, notificationsSupported } from './notifications';

// One look for both switches: an icon button with a tooltip, or a labelled button in the phone menu
function SwitchButton({ on, label, onIcon, offIcon, onClick, showLabel }) {
  const icon = on ? onIcon : offIcon;
  if (showLabel) {
    return <Button color={on ? 'secondary' : 'inherit'} startIcon={icon} onClick={onClick}>{label}</Button>;
  }
  return (
    <Tooltip title={label}>
      <IconButton color={on ? 'secondary' : 'inherit'} onClick={onClick} aria-label={label} aria-pressed={on}>
        {icon}
      </IconButton>
    </Tooltip>
  );
}

export function AlertsToggle({ showLabel = false }) {
  const role = useSelector((state) => state.auth.user?.role);
  const enabled = useSelector((state) => state.live.alertsEnabled);
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  if (role !== 'VOLUNTEER' && role !== 'ADMIN') return null;

  // The browser only shows its permission prompt after a click, which is why this lives on a button
  async function toggle() {
    if (enabled) {
      dispatch(alertsEnabledChanged(false));
      enqueueSnackbar('High-priority alerts are off');
      return;
    }
    if (!notificationsSupported()) {
      enqueueSnackbar('This browser cannot show notifications', { variant: 'warning' });
      return;
    }
    if (await askNotificationPermission() === 'granted') {
      dispatch(alertsEnabledChanged(true));
      enqueueSnackbar(`You will get an alert for every new request with priority above ${ALERT_PRIORITY}`, { variant: 'success' });
    } else {
      enqueueSnackbar('Notifications are blocked. Allow them in the browser\'s site settings.', { variant: 'warning' });
    }
  }

  return (
    <SwitchButton on={enabled} onClick={toggle} showLabel={showLabel}
      label={enabled ? 'High-priority alerts on' : 'Turn on high-priority alerts'}
      onIcon={<NotificationsActiveIcon />} offIcon={<NotificationsOffIcon />} />
  );
}

export function LocationToggle({ showLabel = false }) {
  const role = useSelector((state) => state.auth.user?.role);
  const sharing = useSelector((state) => state.live.sharingLocation);
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  if (role !== 'VOLUNTEER') return null;

  // The GPS itself is started and stopped by useLiveUpdates, which watches this switch
  function toggle() {
    dispatch(sharingLocationChanged(!sharing));
    enqueueSnackbar(sharing
      ? 'Location sharing is off'
      : 'Sharing your approximate location (about 100 m) with FloodLink users while you are online', { variant: sharing ? 'default' : 'success' });
  }

  return (
    <SwitchButton on={sharing} onClick={toggle} showLabel={showLabel}
      label={sharing ? 'Sharing my location' : 'Share my location'}
      onIcon={<MyLocationIcon />} offIcon={<LocationDisabledIcon />} />
  );
}

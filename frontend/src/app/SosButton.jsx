// [Person 1 – app shell] Floating SOS button on phones: one tap sends a RESCUE request at the phone's GPS position,
// with the user's own name and phone as the contact. A 3-second countdown (tap again to cancel) protects against
// pocket taps. Without a connection the SOS goes into the offline queue and is sent automatically later.
// Rendered by App.jsx for citizens and volunteers; hidden on wide screens, where the full form is easy to use.
import { useEffect, useRef, useState } from 'react';
import { Button, CircularProgress, Fab } from '@mui/material';
import SosIcon from '@mui/icons-material/Sos';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { createHelpRequest, OFFLINE_QUEUED } from '../features/requests/requestsSlice';
import { trackingId } from '../features/requests/requestUtils';

const COUNTDOWN_SECONDS = 3;

// We have GPS but no street address, so the address names the coordinates; "SOS" becomes the area in the stats
function buildSosPayload(user, position) {
  const { latitude, longitude } = position;
  return {
    type: 'RESCUE',
    description: 'SOS: emergency rescue needed at this location (sent with the one-tap SOS button)',
    address: `GPS ${latitude.toFixed(5)} ${longitude.toFixed(5)}, SOS`,
    peopleCount: 1,
    contactName: user.name,
    contactPhone: user.phone,
    latitude,
    longitude,
  };
}

export default function SosButton() {
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  // idle -> locating (asking the GPS) -> countdown (tap to cancel) -> sending -> idle
  const [phase, setPhase] = useState('idle');
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const positionRef = useRef(null);

  async function sendSos() {
    setPhase('sending');
    try {
      const saved = await dispatch(createHelpRequest(buildSosPayload(user, positionRef.current))).unwrap();
      enqueueSnackbar(`SOS sent as ${trackingId(saved.id)}. Volunteers can see it now.`, {
        variant: 'success',
        action: <Button color="inherit" size="small" onClick={() => navigate(`/?focus=${saved.id}`)}>View</Button>,
      });
    } catch (message) {
      enqueueSnackbar(message === OFFLINE_QUEUED
        ? 'No connection. Your SOS is saved and will be sent automatically.'
        : `SOS could not be sent: ${message}`, { variant: message === OFFLINE_QUEUED ? 'warning' : 'error' });
    } finally {
      setPhase('idle');
    }
  }

  // Counts 3, 2, 1, then sends. Leaving the countdown phase (cancel) stops the timer through the cleanup.
  // Only phase and secondsLeft restart the timer; sendSos is left out on purpose (it is a new function each render).
  useEffect(() => {
    if (phase !== 'countdown') return undefined;
    if (secondsLeft === 0) {
      sendSos();
      return undefined;
    }
    const timer = setTimeout(() => setSecondsLeft((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, secondsLeft]);

  if (!user || user.role === 'ADMIN') return null;

  function handleTap() {
    if (phase === 'countdown') {
      setPhase('idle');
      enqueueSnackbar('SOS cancelled');
      return;
    }
    if (phase !== 'idle') return;
    if (!navigator.geolocation) {
      enqueueSnackbar('This phone cannot share its location. Use "Ask for help" instead.', { variant: 'error' });
      return;
    }
    setPhase('locating');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        positionRef.current = { latitude: position.coords.latitude, longitude: position.coords.longitude };
        setSecondsLeft(COUNTDOWN_SECONDS);
        setPhase('countdown');
      },
      () => {
        setPhase('idle');
        enqueueSnackbar('Could not get your location. Use "Ask for help" and pick the spot on the map.', { variant: 'error' });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  const label = {
    idle: 'SOS',
    locating: 'Locating...',
    countdown: `Sending in ${secondsLeft}. Tap to cancel`,
    sending: 'Sending...',
  }[phase];

  return (
    <Fab variant="extended" color="error" onClick={handleTap} aria-label="Send an SOS rescue request at my location"
      sx={{
        display: { xs: 'inline-flex', md: 'none' },
        position: 'fixed',
        right: 16,
        // Sits above the request list's bottom sheet on the map page (MobileSheet sets this variable)
        bottom: 'calc(var(--floodlink-bottom-inset, 0px) + 16px)',
        zIndex: 1300,
        fontWeight: 800,
        letterSpacing: phase === 'idle' ? '0.08em' : 0,
        boxShadow: '0 8px 24px rgba(239, 68, 68, 0.45)',
        animation: phase === 'idle' ? 'flSosPulse 2.4s ease-in-out infinite' : 'none',
        '@keyframes flSosPulse': { '50%': { boxShadow: '0 0 0 10px rgba(239, 68, 68, 0.15)' } },
        '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
      }}>
      {phase === 'locating' || phase === 'sending'
        ? <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
        : <SosIcon sx={{ mr: 1 }} />}
      {label}
    </Fab>
  );
}

// [Person 1 – live] Custom hook that connects to auth-realtime-service with socket.io-client while the user is
// logged in, and turns every server event into a Redux update, so the map, lists and stats change instantly
// on every open screen. It also shows a slide-in toast for other people's actions, a browser alert for new
// high-priority requests, and (for volunteers who switch it on) shares their approximate location.
// Used once, in App.jsx.
import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSnackbar } from 'notistack';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../../app/config';
import { fetchRequests, requestRemoved, requestsMerged, requestUpserted } from '../requests/requestsSlice';
import {
  activityReceived, connectionChanged, fetchActivity, presenceChanged, sharingLocationChanged,
} from './liveSlice';
import { shouldAlert, showRequestAlert } from './notifications';

const REQUEST_EVENTS = ['request:created', 'request:claimed', 'request:resolved', 'request:updated'];

// Toast colour per event: new needs are blue (information), finished help is green
const TOAST_VARIANTS = { 'request:created': 'info', 'request:resolved': 'success' };

// Connects each server event to a Redux action. Request events update Person 2's requests slice;
// presence and activity events update our live slice. "settings" is a ref, so the listeners attached once per
// connection always read the CURRENT user and alert switch.
function listenForEvents(socket, dispatch, settings, enqueueSnackbar) {
  REQUEST_EVENTS.forEach((eventName) => {
    socket.on(eventName, (request) => dispatch(requestUpserted(request)));
  });
  socket.on('request:merged', (result) => dispatch(requestsMerged(result)));
  socket.on('request:deleted', ({ id }) => dispatch(requestRemoved(id)));
  socket.on('request:created', (request) => {
    const { user, alertsEnabled } = settings.current;
    if (shouldAlert(request, user, alertsEnabled)) showRequestAlert(request);
  });
  socket.on('presence:changed', (list) => dispatch(presenceChanged(list)));
  socket.on('activity:created', (entry) => {
    dispatch(activityReceived(entry));
    // Your own actions already confirm themselves on screen, so only other people's are toasted
    if (entry.actorName !== settings.current.user?.name) {
      enqueueSnackbar(entry.message, { variant: TOAST_VARIANTS[entry.event] || 'default' });
    }
  });
}

export default function useLiveUpdates() {
  const dispatch = useDispatch();
  const { token, user } = useSelector((state) => state.auth);
  const { sharingLocation, alertsEnabled } = useSelector((state) => state.live);
  const { enqueueSnackbar } = useSnackbar();
  const socketRef = useRef(null);
  const settings = useRef({ user, alertsEnabled });
  const isVolunteer = user?.role === 'VOLUNTEER';

  useEffect(() => {
    settings.current = { user, alertsEnabled };
  }, [user, alertsEnabled]);

  // Re-runs when the token changes: connect on login, disconnect on logout (the cleanup function)
  useEffect(() => {
    if (!token) return undefined;
    // The JWT goes in the handshake; the server refuses connections without a valid token
    const socket = io(SOCKET_URL, { auth: { token } });
    socketRef.current = socket;
    socket.on('connect', () => {
      dispatch(connectionChanged(true));
      // Load everything again on every (re)connect, so changes missed while offline show up too
      dispatch(fetchRequests());
      dispatch(fetchActivity());
    });
    socket.on('disconnect', () => dispatch(connectionChanged(false)));
    listenForEvents(socket, dispatch, settings, enqueueSnackbar);
    return () => {
      socket.disconnect();
      socketRef.current = null;
      dispatch(connectionChanged(false));
    };
  }, [token, dispatch, enqueueSnackbar]);

  // Volunteer location sharing: watch the GPS while the switch is on and send each new position.
  // The server rounds it to about 100 m before anyone else sees it.
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !isVolunteer || !sharingLocation) return undefined;
    if (!navigator.geolocation) {
      dispatch(sharingLocationChanged(false));
      enqueueSnackbar('This browser cannot share a location.', { variant: 'warning' });
      return undefined;
    }
    let lastPosition = null;
    const sendPosition = () => {
      if (lastPosition) socket.emit('presence:update', lastPosition);
    };
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        lastPosition = { latitude: position.coords.latitude, longitude: position.coords.longitude };
        sendPosition();
      },
      (error) => {
        // 1 = permission denied: switch off. Timeouts are temporary, so we just wait for the next fix.
        if (error.code === 1) {
          dispatch(sharingLocationChanged(false));
          enqueueSnackbar('Location permission was denied, so your location is not shared.', { variant: 'warning' });
        }
      },
      { maximumAge: 15000, timeout: 20000 }
    );
    // After a reconnect the server has forgotten us, so the last known position is sent again
    socket.on('connect', sendPosition);
    return () => {
      navigator.geolocation.clearWatch(watchId);
      socket.off('connect', sendPosition);
      socket.emit('presence:stop');
    };
  }, [token, isVolunteer, sharingLocation, dispatch, enqueueSnackbar]);
}

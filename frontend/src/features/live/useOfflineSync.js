// [Person 1 – live] Custom hook that empties the offline request queue: it tries when the browser comes back online,
// when the live connection (re)opens, and every 30 seconds while something is waiting (in case only request-service
// was down). It also keeps the "waiting to send" counter in Redux up to date. Used once, in App.jsx.
import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSnackbar } from 'notistack';
import { requestUpserted } from '../requests/requestsSlice';
import { trackingId } from '../requests/requestUtils';
import { offlineQueueChanged } from './liveSlice';
import { QUEUE_CHANGED_EVENT, readQueue, sendQueuedRequests } from './offlineQueue';

const RETRY_INTERVAL_MS = 30000;

export default function useOfflineSync() {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const connected = useSelector((state) => state.live.connected);
  const pending = useSelector((state) => state.live.pendingOffline);
  const { enqueueSnackbar } = useSnackbar();

  const sendNow = useCallback(() => {
    if (!token || readQueue().length === 0) return;
    sendQueuedRequests({
      onSent: (saved) => {
        dispatch(requestUpserted(saved));
        enqueueSnackbar(`Back online: your request was sent as ${trackingId(saved.id)}`, { variant: 'success' });
      },
      onRejected: (payload, message) => {
        enqueueSnackbar(`A request saved offline was rejected: ${message}`, { variant: 'error' });
      },
    });
  }, [token, dispatch, enqueueSnackbar]);

  // Keep the counter in step with localStorage ("storage" also catches changes made in another tab)
  useEffect(() => {
    const updateCount = () => dispatch(offlineQueueChanged(readQueue().length));
    window.addEventListener(QUEUE_CHANGED_EVENT, updateCount);
    window.addEventListener('storage', updateCount);
    return () => {
      window.removeEventListener(QUEUE_CHANGED_EVENT, updateCount);
      window.removeEventListener('storage', updateCount);
    };
  }, [dispatch]);

  useEffect(() => {
    window.addEventListener('online', sendNow);
    return () => window.removeEventListener('online', sendNow);
  }, [sendNow]);

  useEffect(() => {
    if (connected) sendNow();
  }, [connected, sendNow]);

  useEffect(() => {
    if (pending === 0) return undefined;
    const timer = setInterval(sendNow, RETRY_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [pending, sendNow]);
}

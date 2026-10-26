// [Person 1 – live] Offline request queue. A help request written without a connection is NOT lost: it is kept in
// localStorage and sent automatically once the connection is back (see useOfflineSync).
// queueRequest() is called by Person 2's createHelpRequest thunk when the server can't be reached.
import api, { isNetworkError, readErrorMessage } from '../../app/api';
import { OFFLINE_QUEUE_KEY, REQUEST_API_URL } from '../../app/config';

// Fired on window whenever the queue changes, so the "waiting to send" counter can update
export const QUEUE_CHANGED_EVENT = 'floodlink:offline-queue-changed';

export function readQueue() {
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY)) || [];
  } catch {
    return [];
  }
}

function writeQueue(queue) {
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  window.dispatchEvent(new Event(QUEUE_CHANGED_EVENT));
}

// Each item gets its own id, so sending one never removes another that looks the same
export function queueRequest(payload) {
  const item = { queueId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, queuedAt: new Date().toISOString(), payload };
  writeQueue([...readQueue(), item]);
}

function removeFromQueue(queueId) {
  writeQueue(readQueue().filter((item) => item.queueId !== queueId));
}

// Only one sync at a time: "back online" and "socket reconnected" often happen together,
// and two syncs running at once would post the same request twice
let sending = false;

// Sends the queued requests oldest first. It stops at the first network error (still offline: the rest wait for the
// next try). A request the server REJECTS (e.g. invalid data) is dropped and reported, so it can't block the queue.
export async function sendQueuedRequests({ onSent, onRejected }) {
  if (sending) return;
  sending = true;
  try {
    for (const item of readQueue()) {
      try {
        const response = await api.post(`${REQUEST_API_URL}/requests`, item.payload);
        removeFromQueue(item.queueId);
        onSent(response.data);
      } catch (error) {
        // 401 = logged out; the api interceptor sends the user to /login, and the request waits for the next login
        if (isNetworkError(error) || (error.response && error.response.status === 401)) break;
        removeFromQueue(item.queueId);
        onRejected(item.payload, readErrorMessage(error));
      }
    }
  } finally {
    sending = false;
  }
}

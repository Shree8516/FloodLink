// [Person 1 – live] Browser (system) notifications for NEW requests with priority above 70, so a volunteer or admin
// notices them even when FloodLink is in a background tab. The permission is asked by LiveControls (it must follow
// a click), and useLiveUpdates calls showRequestAlert when a "request:created" event arrives.

export const ALERT_PRIORITY = 70;
const ALERT_ROLES = ['VOLUNTEER', 'ADMIN'];

export function notificationsSupported() {
  return 'Notification' in window;
}

// Resolves to 'granted', 'denied' or 'default' (the user closed the prompt)
export function askNotificationPermission() {
  return Notification.requestPermission();
}

// Citizens can't act on other people's requests, so only volunteers and admins get alerts
export function shouldAlert(request, user, alertsEnabled) {
  return alertsEnabled && Boolean(user) && ALERT_ROLES.includes(user.role)
    && request.priorityScore > ALERT_PRIORITY
    && notificationsSupported() && Notification.permission === 'granted';
}

export function showRequestAlert(request) {
  try {
    const notification = new Notification(`Priority ${request.priorityScore}: ${request.type.toLowerCase()} help needed`, {
      body: `${request.description}\n${request.address}`,
      // The tag stops the same request from alerting twice (e.g. two FloodLink tabs open)
      tag: `floodlink-request-${request.id}`,
    });
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch {
    // Some mobile browsers only allow notifications from a service worker; the in-app toast still shows
  }
}

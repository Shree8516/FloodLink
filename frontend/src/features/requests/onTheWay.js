// [Person 2 – requests] Which of my claimed requests I have marked "On the way" on my task board.
// request-service only knows OPEN / CLAIMED / RESOLVED, and this extra step matters only to the volunteer, so it is
// kept on this device (localStorage, one list per volunteer) instead of changing the backend API.
import { ON_THE_WAY_KEY } from '../../app/config';

function storageKey(userId) {
  return `${ON_THE_WAY_KEY}_${userId}`;
}

export function loadOnTheWay(userId) {
  try {
    return JSON.parse(localStorage.getItem(storageKey(userId))) || [];
  } catch {
    return [];
  }
}

export function saveOnTheWay(userId, requestIds) {
  localStorage.setItem(storageKey(userId), JSON.stringify(requestIds));
}

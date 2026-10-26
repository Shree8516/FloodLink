// [Person 3 – insights] Asks insights-service POST /api/v1/suggest while the citizen types: which type the
// description sounds like, how urgent it is, and a live priority preview. Waits until typing pauses (400 ms)
// so we don't call the server on every key press. Returns { suggestion, status }.
import { useEffect, useState } from 'react';
import api from '../../app/api';
import { INSIGHTS_URL } from '../../app/config';

const DEBOUNCE_MS = 400;
const MIN_LENGTH = 3;

// The form may hold "" or "2000" while the user types; the preview just uses 1 until it's a valid number
function safePeopleCount(value) {
  const people = Number(value);
  return Number.isInteger(people) && people >= 1 && people <= 1000 ? people : 1;
}

export default function useSuggestion(description, type, peopleCount) {
  // status: idle (too short) -> loading -> ready | error
  const [state, setState] = useState({ suggestion: null, status: 'idle' });

  useEffect(() => {
    const text = description.trim();
    if (text.length < MIN_LENGTH) {
      setState({ suggestion: null, status: 'idle' });
      return undefined;
    }
    // "cancelled" stops an older, slower answer from overwriting a newer one
    let cancelled = false;
    const timer = setTimeout(() => {
      setState((current) => ({ ...current, status: 'loading' }));
      api.post(`${INSIGHTS_URL}/api/v1/suggest`, { description: text, type, peopleCount: safePeopleCount(peopleCount) })
        .then((response) => {
          if (!cancelled) setState({ suggestion: response.data, status: 'ready' });
        })
        .catch(() => {
          if (!cancelled) setState({ suggestion: null, status: 'error' });
        });
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [description, type, peopleCount]);

  return state;
}

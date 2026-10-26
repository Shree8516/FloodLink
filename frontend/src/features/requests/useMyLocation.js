// [Person 2 – requests] The user's position from the browser, asked for only when needed ("Near me" or
// "Nearest first"), never on page load. Returns { position, status, error, locate }.
import { useCallback, useState } from 'react';

export default function useMyLocation() {
  // status: idle -> locating -> ready | error
  const [state, setState] = useState({ position: null, status: 'idle', error: '' });

  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      setState({ position: null, status: 'error', error: 'This browser cannot share a location.' });
      return;
    }
    setState((previous) => ({ ...previous, status: 'locating', error: '' }));
    navigator.geolocation.getCurrentPosition(
      (result) => setState({
        position: { latitude: result.coords.latitude, longitude: result.coords.longitude },
        status: 'ready',
        error: '',
      }),
      () => setState({ position: null, status: 'error', error: 'Could not get your location. Allow location access and try again.' }),
      // A position from the last minute is fine: people don't move far while reading the list
      { timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  return { ...state, locate };
}

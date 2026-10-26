// [Person 2 – requests] Where is help needed? A big "Use my current location" button (phone GPS), or tap the map
// to drop the pin by hand. Used by step 2 of PostRequestPage; reports the point through onChange({ latitude, longitude }).
import { useEffect, useState } from 'react';
import { Box, Button, FormHelperText, Typography } from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { MAP_TILES } from '../../app/theme';
import { requestIcon } from './mapMarkers';
import { CHENNAI_CENTER } from './requestConstants';
import './mapPlugins';

// react-leaflet hooks only work inside <MapContainer>, so the click listener is its own tiny component
function ClickListener({ onPick }) {
  useMapEvents({
    click(event) {
      onPick({ latitude: event.latlng.lat, longitude: event.latlng.lng });
    },
  });
  return null;
}

// When the GPS finds the user, zoom the map to them (a pin placed by tapping doesn't move the map)
function FlyToGps({ point, gpsNonce }) {
  const map = useMap();
  useEffect(() => {
    if (point && gpsNonce > 0) map.flyTo([point.latitude, point.longitude], 16, { duration: 0.8 });
  }, [gpsNonce]);
  return null;
}

export default function LocationPicker({ value, onChange, error, type }) {
  const [gpsMessage, setGpsMessage] = useState('');
  const [locating, setLocating] = useState(false);
  const [gpsNonce, setGpsNonce] = useState(0);

  // Browser geolocation: needs the user's permission and works best on phones
  function fillFromGps() {
    if (!navigator.geolocation) {
      setGpsMessage('This browser cannot share location. Tap the map instead.');
      return;
    }
    setLocating(true);
    setGpsMessage('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        setGpsNonce((nonce) => nonce + 1);
        setLocating(false);
      },
      () => {
        setGpsMessage('Could not get your location. Tap the map instead.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  // The pin looks exactly like the marker volunteers will see (type colour and icon)
  const pinIcon = requestIcon({ type, status: 'OPEN', priorityScore: 40, createdAt: new Date().toISOString() });

  return (
    <Box>
      <Button variant="outlined" size="large" fullWidth startIcon={<MyLocationIcon />} onClick={fillFromGps} disabled={locating}
        sx={{ mb: 1.5, py: 1.25 }}>
        {locating ? 'Finding your location...' : 'Use my current location'}
      </Button>
      <Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 1 }}>
        {value
          ? `Pin at ${value.latitude.toFixed(5)}, ${value.longitude.toFixed(5)}. Tap the map to move it.`
          : 'Or tap the map to drop a pin where help is needed.'}
      </Typography>
      <Box sx={{ height: { xs: 260, sm: 320 }, borderRadius: 2, overflow: 'hidden', border: 2, borderColor: error ? 'error.main' : 'divider' }}>
        <MapContainer center={value ? [value.latitude, value.longitude] : CHENNAI_CENTER} zoom={value ? 15 : 11}
          style={{ height: '100%', width: '100%' }}>
          <TileLayer url={MAP_TILES.url} attribution={MAP_TILES.attribution} className={MAP_TILES.className} />
          <ClickListener onPick={onChange} />
          <FlyToGps point={value} gpsNonce={gpsNonce} />
          {value && <Marker position={[value.latitude, value.longitude]} icon={pinIcon} />}
        </MapContainer>
      </Box>
      {gpsMessage && <FormHelperText>{gpsMessage}</FormHelperText>}
      {error && <FormHelperText error>{error}</FormHelperText>}
    </Box>
  );
}

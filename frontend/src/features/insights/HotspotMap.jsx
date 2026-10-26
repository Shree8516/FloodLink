// [Person 3 – insights] Hotspot heatmap for the admin dashboard: where the unresolved need is concentrated right
// now, weighted by priority. Uses Person 2's HeatLayer on the same dark tiles as the live map.
import { useMemo } from 'react';
import { Box, Paper, Stack, Typography } from '@mui/material';
import { MapContainer, TileLayer } from 'react-leaflet';
import { useSelector } from 'react-redux';
import { MAP_TILES } from '../../app/theme';
import HeatLayer from '../requests/HeatLayer';
import { CHENNAI_CENTER } from '../requests/requestConstants';

export default function HotspotMap({ height = 300 }) {
  const items = useSelector((state) => state.requests.items);
  const unresolved = useMemo(
    () => items.filter((request) => request.status === 'OPEN' || request.status === 'CLAIMED'),
    [items]
  );

  return (
    <Paper variant="elevation" sx={{ p: 2, height: '100%' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="baseline">
        <Typography variant="subtitle1" fontWeight={700}>Hotspot heatmap</Typography>
        <Typography variant="caption" color="text.secondary">{unresolved.length} unresolved</Typography>
      </Stack>
      <Typography variant="caption" color="text.secondary">Brighter = more, or more urgent, open and claimed requests</Typography>
      <Box sx={{ height, mt: 1.5, borderRadius: 2, overflow: 'hidden' }}>
        <MapContainer center={CHENNAI_CENTER} zoom={10} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
          <TileLayer url={MAP_TILES.url} attribution={MAP_TILES.attribution} className={MAP_TILES.className} />
          <HeatLayer requests={unresolved} />
        </MapContainer>
      </Box>
    </Paper>
  );
}

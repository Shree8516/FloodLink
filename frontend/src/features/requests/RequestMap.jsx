// [Person 2 – requests] Live map of help requests (react-leaflet on dark CartoDB tiles). Markers are clustered,
// coloured by type, sized by priority, pulse above priority 80 and get a dashed ring when stale. The "Heatmap"
// toggle swaps the markers for a heat layer. Hovering a marker highlights its card (and the other way round);
// clicking selects it. Live volunteer dots come from Person 1's VolunteerDots. Used by HomePage.
import { useEffect, useMemo, useState } from 'react';
import { Box, Button, Divider, Link, Paper, Stack, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import LayersIcon from '@mui/icons-material/Layers';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { formatTimeAgo } from '../../app/format';
import { MAP_TILES, RESOLVED_COLOR, STALE_COLOR, STATUS_COLORS, TYPE_COLORS, VOLUNTEER_COLOR } from '../../app/theme';
import VolunteerDots from '../live/VolunteerDots';
import ClusterGroup from './ClusterGroup';
import HeatLayer from './HeatLayer';
import { requestIcon } from './mapMarkers';
import { CHENNAI_CENTER, PULSE_PRIORITY, REQUEST_TYPES, STALE_AFTER_HOURS, STATUS_LABELS, TYPE_LABELS } from './requestConstants';
import { directionsUrl, isStale } from './requestUtils';
import TypeIcon from './TypeIcon';

function RequestPopup({ request, now }) {
  return (
    <Box sx={{ minWidth: 200 }}>
      <Typography variant="subtitle2" sx={{ color: TYPE_COLORS[request.type] }}>
        #{request.id} {TYPE_LABELS[request.type]} · priority {request.priorityScore}
      </Typography>
      <Typography variant="body2" sx={{ my: 0.5 }}>{request.description}</Typography>
      <Typography variant="caption" color="text.secondary" component="div">
        {request.address} · {request.peopleCount} {request.peopleCount === 1 ? 'person' : 'people'}
      </Typography>
      <Typography variant="caption" color="text.secondary" component="div">
        {STATUS_LABELS[request.status]} · posted {formatTimeAgo(request.createdAt)}
        {isStale(request, now) && ' · waiting too long'}
      </Typography>
      {request.status !== 'RESOLVED' && (
        <Link href={directionsUrl(request)} target="_blank" rel="noreferrer" variant="caption" sx={{ display: 'inline-block', mt: 0.5 }}>
          Directions in Google Maps
        </Link>
      )}
    </Box>
  );
}

function RequestMarker({ request, highlighted, now, onHover, onSelect }) {
  // Memoised so Leaflet doesn't re-bind the listeners on every render
  const eventHandlers = useMemo(() => ({
    mouseover: () => onHover(request.id),
    mouseout: () => onHover(null),
    click: () => onSelect(request.id),
  }), [request.id, onHover, onSelect]);

  return (
    // priorityScore is read by ClusterGroup to turn a cluster red when it holds an urgent request
    <Marker position={[request.latitude, request.longitude]} icon={requestIcon(request, { highlighted, now })}
      priorityScore={request.priorityScore} zIndexOffset={highlighted ? 1000 : 0} eventHandlers={eventHandlers}
      title={`#${request.id} ${TYPE_LABELS[request.type]}, priority ${request.priorityScore}`}>
      <Popup><RequestPopup request={request} now={now} /></Popup>
    </Marker>
  );
}

// Flies to a request when the list (or a "?focus=" link) selects it. focusNonce changes on every selection,
// so clicking the same card twice still flies back to it. Only the nonce triggers a flight: live updates to the
// request (e.g. someone claims it) must not move the map under the user's finger.
function FocusOnRequest({ request, focusNonce }) {
  const map = useMap();
  useEffect(() => {
    if (request) map.flyTo([request.latitude, request.longitude], Math.max(map.getZoom(), 16), { duration: 0.8 });
  }, [focusNonce]);
  return null;
}

function LegendRow({ color, ring, children }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Box sx={{ width: 14, height: 14, borderRadius: '50%', flexShrink: 0, bgcolor: color, border: ring }} />
      <Typography variant="caption">{children}</Typography>
    </Stack>
  );
}

function MapLegend() {
  return (
    <Paper variant="elevation" sx={{ p: 1.5, mt: 1, width: 220, bgcolor: 'rgba(17, 26, 43, 0.95)' }}>
      <Stack spacing={0.75}>
        {REQUEST_TYPES.map((type) => (
          <Stack key={type} direction="row" spacing={1} alignItems="center">
            <TypeIcon type={type} sx={{ fontSize: 16, color: TYPE_COLORS[type] }} />
            <Typography variant="caption">{TYPE_LABELS[type]}</Typography>
          </Stack>
        ))}
        <Divider />
        <LegendRow color={RESOLVED_COLOR}>{STATUS_LABELS.RESOLVED}</LegendRow>
        <LegendRow color="transparent" ring={`3px solid ${STATUS_COLORS.CLAIMED}`}>Claimed: a volunteer is on it</LegendRow>
        <LegendRow color="transparent" ring={`2px dashed ${STALE_COLOR}`}>Open for {STALE_AFTER_HOURS}+ hours</LegendRow>
        <LegendRow color={VOLUNTEER_COLOR}>Volunteer online</LegendRow>
        <Typography variant="caption" color="text.secondary">
          Bigger = higher priority. Pulsing = priority above {PULSE_PRIORITY}.
        </Typography>
      </Stack>
    </Paper>
  );
}

// Floating buttons in the top-right corner of the map
function MapControls({ layer, onLayerChange, showVolunteers, onToggleVolunteers, showLegend, onToggleLegend }) {
  return (
    <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
      <Stack direction="row" spacing={1}>
        <ToggleButtonGroup size="small" exclusive value={layer} onChange={(event, value) => value && onLayerChange(value)}
          sx={{ bgcolor: 'rgba(17, 26, 43, 0.95)' }} aria-label="Map layer">
          <ToggleButton value="pins" aria-label="Markers"><LayersIcon fontSize="small" sx={{ mr: 0.5 }} />Pins</ToggleButton>
          <ToggleButton value="heat" aria-label="Heatmap"><WhatshotIcon fontSize="small" sx={{ mr: 0.5 }} />Heat</ToggleButton>
        </ToggleButtonGroup>
        <Tooltip title={showVolunteers ? 'Hide volunteers' : 'Show volunteers'}>
          <ToggleButton size="small" value="volunteers" selected={showVolunteers} onChange={onToggleVolunteers}
            sx={{ bgcolor: 'rgba(17, 26, 43, 0.95)' }} aria-label="Show volunteers">
            <GroupsIcon fontSize="small" sx={{ color: showVolunteers ? VOLUNTEER_COLOR : 'inherit' }} />
          </ToggleButton>
        </Tooltip>
      </Stack>
      <Button size="small" onClick={onToggleLegend} sx={{ mt: 1, bgcolor: 'rgba(17, 26, 43, 0.95)', '&:hover': { bgcolor: '#1e293b' } }}>
        {showLegend ? 'Hide legend' : 'Legend'}
      </Button>
      {showLegend && <MapLegend />}
    </Box>
  );
}

export default function RequestMap({ requests, highlightedId, focusRequestId, focusNonce, onHover, onSelect, now }) {
  const [layer, setLayer] = useState('pins');
  const [showVolunteers, setShowVolunteers] = useState(true);
  const [showLegend, setShowLegend] = useState(false);
  const focusRequest = requests.find((request) => request.id === focusRequestId);
  // The heatmap shows needs that still matter, so resolved requests are left out
  const unresolved = useMemo(() => requests.filter((request) => request.status !== 'RESOLVED'), [requests]);

  return (
    <Box sx={{ position: 'relative', height: '100%', minHeight: 300 }}>
      <MapContainer center={CHENNAI_CENTER} zoom={12} style={{ height: '100%', width: '100%' }}>
        <TileLayer url={MAP_TILES.url} attribution={MAP_TILES.attribution} className={MAP_TILES.className} />
        {layer === 'pins' ? (
          <ClusterGroup pulsePriority={PULSE_PRIORITY}>
            {requests.map((request) => (
              <RequestMarker key={request.id} request={request} highlighted={request.id === highlightedId} now={now}
                onHover={onHover} onSelect={onSelect} />
            ))}
          </ClusterGroup>
        ) : (
          <HeatLayer requests={unresolved} />
        )}
        {showVolunteers && <VolunteerDots />}
        <FocusOnRequest request={focusRequest} focusNonce={focusNonce} />
      </MapContainer>
      <MapControls layer={layer} onLayerChange={setLayer}
        showVolunteers={showVolunteers} onToggleVolunteers={() => setShowVolunteers(!showVolunteers)}
        showLegend={showLegend} onToggleLegend={() => setShowLegend(!showLegend)} />
    </Box>
  );
}

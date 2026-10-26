// [Person 2 – requests] Home page: the live map takes 65% of the screen and the request cards panel the rest
// (on phones the cards move into a bottom sheet). One set of filters drives both, and hovering a card highlights
// its marker and the other way round. Loads requests once; after that, Socket.io events keep Redux up to date
// (see features/live/useLiveUpdates). "/?focus=18" selects request #18 and flies the map to it.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Box, Stack, Typography, useMediaQuery } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import MobileSheet, { SHEET_COLLAPSED_PX } from './MobileSheet';
import RequestFilters, { DEFAULT_FILTERS } from './RequestFilters';
import RequestList from './RequestList';
import RequestMap from './RequestMap';
import { fetchRequests } from './requestsSlice';
import { applyFilters, sortRequests } from './requestUtils';
import useMyLocation from './useMyLocation';
import useNow from './useNow';

function countByStatus(requests) {
  const counts = { ALL: 0, OPEN: 0, CLAIMED: 0, RESOLVED: 0 };
  requests.forEach((request) => {
    if (request.status === 'MERGED') return;
    counts.ALL += 1;
    counts[request.status] += 1;
  });
  return counts;
}

export default function HomePage() {
  const dispatch = useDispatch();
  const { items, loaded, error } = useSelector((state) => state.requests);
  const isDesktop = useMediaQuery((theme) => theme.breakpoints.up('md'));
  const { enqueueSnackbar } = useSnackbar();
  const [searchParams, setSearchParams] = useSearchParams();
  const now = useNow();
  const location = useMyLocation();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sortBy, setSortBy] = useState('priority');
  // hovered: the card or marker under the mouse (source says which side, so only the OTHER side reacts)
  const [hovered, setHovered] = useState({ id: null, source: null });
  const [selectedId, setSelectedId] = useState(null);
  const [focus, setFocus] = useState({ id: null, nonce: 0 });

  // The socket connection loads requests too; this covers opening the page while the live service is down
  useEffect(() => {
    if (!loaded) dispatch(fetchRequests());
  }, [loaded, dispatch]);

  // "Near me" and "Nearest first" need the user's position: ask the browser the first time either is chosen
  const needsLocation = filters.nearMe || sortBy === 'nearest';
  const { status: locationStatus, locate } = location;
  useEffect(() => {
    if (needsLocation && locationStatus === 'idle') locate();
  }, [needsLocation, locationStatus, locate]);
  useEffect(() => {
    if (location.status !== 'error') return;
    enqueueSnackbar(location.error, { variant: 'warning' });
    setFilters((current) => ({ ...current, nearMe: false }));
    setSortBy((current) => (current === 'nearest' ? 'priority' : current));
  }, [location.status, location.error, enqueueSnackbar]);

  const selectFromList = useCallback((id) => {
    setSelectedId(id);
    setFocus((current) => ({ id, nonce: current.nonce + 1 }));
  }, []);
  const selectFromMap = useCallback((id) => {
    setSelectedId(id);
    setHovered({ id, source: 'map' });
  }, []);
  const hoverFromMap = useCallback((id) => setHovered({ id, source: 'map' }), []);
  const hoverFromList = useCallback((id) => setHovered({ id, source: 'list' }), []);

  // "/?focus=18": show everything (so #18 isn't hidden by a filter), select it, fly there, then clean the URL
  const focusParam = Number(searchParams.get('focus'));
  useEffect(() => {
    if (!focusParam || !items.some((request) => request.id === focusParam)) return;
    setFilters(DEFAULT_FILTERS);
    selectFromList(focusParam);
    setSearchParams({}, { replace: true });
  }, [focusParam, items, selectFromList, setSearchParams]);

  const visible = useMemo(
    () => sortRequests(applyFilters(items, filters, location.position, now), sortBy, location.position),
    [items, filters, location.position, now, sortBy]
  );
  const counts = useMemo(() => countByStatus(items), [items]);
  const highlightedId = hovered.id ?? selectedId;

  const panel = (
    <Stack spacing={2}>
      <RequestFilters filters={filters} onChange={setFilters} counts={counts} sortBy={sortBy} onSortChange={setSortBy}
        locating={location.status === 'locating'} />
      <RequestList requests={visible} loading={!loaded && !error} now={now} highlightedId={highlightedId}
        myPosition={location.position} scrollToId={hovered.source === 'map' ? hovered.id : null}
        onHover={hoverFromList} onSelect={selectFromList} onClearFilters={() => setFilters(DEFAULT_FILTERS)} />
    </Stack>
  );

  return (
    <Box sx={{ height: '100%', display: 'flex' }}>
      <Box sx={{ flex: { xs: 1, md: '0 0 65%' }, minWidth: 0, position: 'relative', pb: { xs: `${SHEET_COLLAPSED_PX}px`, md: 0 } }}>
        {error && (
          <Alert severity="error" sx={{ position: 'absolute', top: 12, left: 60, right: 12, zIndex: 1001 }}>{error}</Alert>
        )}
        <RequestMap requests={visible} now={now} highlightedId={highlightedId} focusRequestId={focus.id}
          focusNonce={focus.nonce} onHover={hoverFromMap} onSelect={selectFromMap} />
      </Box>
      {isDesktop ? (
        <Box sx={{ flex: 1, minWidth: 0, borderLeft: 1, borderColor: 'divider', overflowY: 'auto', p: 2 }}>
          <Typography variant="h6" sx={{ mb: 1.5 }}>
            Help requests <Typography component="span" color="text.secondary">({visible.length} shown)</Typography>
          </Typography>
          {panel}
        </Box>
      ) : (
        <MobileSheet summary={`${counts.OPEN} open requests · ${visible.length} shown`}>{panel}</MobileSheet>
      )}
    </Box>
  );
}

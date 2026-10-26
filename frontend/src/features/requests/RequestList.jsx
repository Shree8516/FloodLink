// [Person 2 – requests] The scrolling list of request cards next to the map (or in the phone's bottom sheet).
// Shows skeleton cards while the first load runs and a friendly message when no request matches the filters.
// When a marker is hovered or clicked on the map, the matching card scrolls into view. Used by HomePage.
import { useEffect } from 'react';
import { Box, Button, Card, CardContent, Skeleton, Stack } from '@mui/material';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import EmptyState from '../../app/EmptyState';
import RequestCard from './RequestCard';
import { distanceKm } from './requestUtils';

function CardSkeleton() {
  return (
    <Card variant="outlined" sx={{ flexShrink: 0 }}>
      <CardContent>
        <Stack direction="row" spacing={1.5}>
          <Skeleton variant="rounded" width={36} height={36} />
          <Box sx={{ flex: 1 }}>
            <Skeleton width="40%" />
            <Skeleton width="90%" />
            <Skeleton width="70%" />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function RequestList({ requests, loading, now, myPosition, highlightedId, scrollToId, onHover, onSelect, onClearFilters }) {
  // "nearest" keeps the card in view without jumping the whole list when it's already visible
  useEffect(() => {
    if (scrollToId === null) return;
    const card = document.getElementById(`request-card-${scrollToId}`);
    if (card) card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [scrollToId]);

  if (loading) {
    return (
      <Stack spacing={1.5}>
        {[1, 2, 3, 4].map((key) => <CardSkeleton key={key} />)}
      </Stack>
    );
  }

  if (requests.length === 0) {
    return (
      <EmptyState icon={SearchOffIcon} title="No requests match these filters"
        hint="Good news if the area is calm. Otherwise, widen the filters to see more."
        action={onClearFilters && <Button size="small" onClick={onClearFilters}>Clear filters</Button>} />
    );
  }

  return (
    <Stack spacing={1.5}>
      {requests.map((request) => (
        <RequestCard key={request.id} request={request} now={now}
          distanceKm={myPosition ? distanceKm(myPosition, request) : null}
          highlighted={request.id === highlightedId} onHover={onHover} onSelect={onSelect} />
      ))}
    </Stack>
  );
}

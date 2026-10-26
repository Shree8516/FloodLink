// [Person 2 – requests] Filter chips above the request list: status, type (with icons), "Near me" (within 5 km)
// and "Stale" (open for 6+ hours), plus the sort order (most urgent, nearest first, newest).
// The same filters drive the map and the list, so both always show the same requests. Used by HomePage.
import { Chip, MenuItem, Stack, TextField } from '@mui/material';
import HourglassBottomIcon from '@mui/icons-material/HourglassBottom';
import NearMeIcon from '@mui/icons-material/NearMe';
import { STALE_COLOR, TYPE_COLORS } from '../../app/theme';
import { NEAR_ME_KM, REQUEST_TYPES, STALE_AFTER_HOURS, STATUS_LABELS, STATUSES, TYPE_LABELS } from './requestConstants';
import TypeIcon from './TypeIcon';

export const DEFAULT_FILTERS = { status: 'ALL', type: 'ALL', nearMe: false, staleOnly: false };

export default function RequestFilters({ filters, onChange, counts, sortBy, onSortChange, locating }) {
  const set = (changes) => onChange({ ...filters, ...changes });

  return (
    <Stack spacing={1.25}>
      <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
        <Chip label={`All ${counts.ALL}`} onClick={() => set({ status: 'ALL' })}
          color={filters.status === 'ALL' ? 'primary' : 'default'} variant={filters.status === 'ALL' ? 'filled' : 'outlined'} />
        {STATUSES.map((status) => (
          <Chip key={status} label={`${STATUS_LABELS[status]} ${counts[status]}`} onClick={() => set({ status })}
            color={filters.status === status ? 'primary' : 'default'} variant={filters.status === status ? 'filled' : 'outlined'} />
        ))}
      </Stack>
      <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
        {REQUEST_TYPES.map((type) => {
          const active = filters.type === type;
          return (
            // Clicking the active type again shows all types
            <Chip key={type} label={TYPE_LABELS[type]} variant={active ? 'filled' : 'outlined'}
              icon={<TypeIcon type={type} style={{ color: active ? '#fff' : TYPE_COLORS[type] }} />}
              onClick={() => set({ type: active ? 'ALL' : type })}
              sx={active ? { bgcolor: TYPE_COLORS[type], color: '#fff', '&:hover': { bgcolor: TYPE_COLORS[type] } } : undefined} />
          );
        })}
      </Stack>
      <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" alignItems="center">
        <Chip icon={<NearMeIcon />} label={locating ? 'Locating...' : `Near me (${NEAR_ME_KM} km)`}
          color={filters.nearMe ? 'secondary' : 'default'} variant={filters.nearMe ? 'filled' : 'outlined'}
          onClick={() => set({ nearMe: !filters.nearMe })} />
        <Chip icon={<HourglassBottomIcon style={{ color: filters.staleOnly ? undefined : STALE_COLOR }} />}
          label={`Stale (${STALE_AFTER_HOURS}+ h)`} variant={filters.staleOnly ? 'filled' : 'outlined'}
          color={filters.staleOnly ? 'warning' : 'default'} onClick={() => set({ staleOnly: !filters.staleOnly })} />
        <TextField select size="small" label="Sort" value={sortBy} onChange={(event) => onSortChange(event.target.value)}
          sx={{ ml: 'auto', minWidth: 150 }}>
          <MenuItem value="priority">Most urgent</MenuItem>
          <MenuItem value="nearest">Nearest first</MenuItem>
          <MenuItem value="newest">Newest</MenuItem>
        </TextField>
      </Stack>
    </Stack>
  );
}

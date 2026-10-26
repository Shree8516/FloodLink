// [Person 3 – insights] Clear warning when insights-service flagged a request as a likely duplicate. It names the
// original, shows how many times the original has been reported so far, and lets a volunteer or admin MERGE this
// report into it (POST /requests/{id}/merge): the duplicate leaves the map and the original's count goes up.
// Renders nothing for unique requests. Used on request cards and on the post success screen.
import { useState } from 'react';
import { Alert, AlertTitle, Button } from '@mui/material';
import CallMergeIcon from '@mui/icons-material/CallMerge';
import { useDispatch, useSelector } from 'react-redux';
import { useSnackbar } from 'notistack';
import { mergeRequest } from '../requests/requestsSlice';

const MERGE_ROLES = ['VOLUNTEER', 'ADMIN'];

function describeOriginal(original) {
  if (!original) return 'The original request is no longer on the map.';
  const times = original.reportCount === 1 ? 'once' : `${original.reportCount} times`;
  return `#${original.id} has been reported ${times} so far. If it is the same incident, merge this report into it so volunteers only go once.`;
}

export default function DuplicateWarning({ request }) {
  const role = useSelector((state) => state.auth.user?.role);
  const original = useSelector((state) => state.requests.items.find((item) => item.id === request.duplicateOfId));
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const [merging, setMerging] = useState(false);

  if (!request.duplicateOfId || request.status === 'MERGED') return null;
  const canMerge = MERGE_ROLES.includes(role) && request.status === 'OPEN' && original && original.status !== 'MERGED';

  async function handleMerge() {
    setMerging(true);
    try {
      const result = await dispatch(mergeRequest(request.id)).unwrap();
      enqueueSnackbar(`Merged #${request.id} into #${result.original.id}. It has now been reported ${result.original.reportCount} times.`, { variant: 'success' });
    } catch (message) {
      enqueueSnackbar(message, { variant: 'error' });
      setMerging(false);
    }
  }

  return (
    // stopPropagation: clicking Merge must not also select the card underneath
    <Alert severity="warning" variant="outlined" sx={{ mt: 1.25, alignItems: 'flex-start' }} onClick={(event) => event.stopPropagation()}
      action={canMerge && (
        <Button color="inherit" size="small" startIcon={<CallMergeIcon />} disabled={merging} onClick={handleMerge}>
          {merging ? 'Merging...' : `Merge into #${original.id}`}
        </Button>
      )}>
      <AlertTitle sx={{ mb: 0.25 }}>Possible duplicate of #{request.duplicateOfId}</AlertTitle>
      {describeOriginal(original)}
    </Alert>
  );
}

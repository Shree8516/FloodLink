// [Person 3 – insights] "Reported 3 times": shown on a request that duplicates were merged into, so volunteers
// see at a glance that several people asked about the same incident. Renders nothing for a single report.
import { Chip, Tooltip } from '@mui/material';
import CampaignIcon from '@mui/icons-material/Campaign';

export default function ReportCountChip({ count }) {
  if (!count || count < 2) return null;
  return (
    <Tooltip title={`${count - 1} duplicate ${count === 2 ? 'report was' : 'reports were'} merged into this request`}>
      <Chip size="small" color="info" variant="outlined" icon={<CampaignIcon />} label={`Reported ${count} times`} />
    </Tooltip>
  );
}

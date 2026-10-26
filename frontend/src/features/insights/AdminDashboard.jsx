// [Person 3 – insights] Admin dashboard: KPI cards on top, charts below (by type, by status, area-wise breakdown,
// average resolve time per area), a hotspot heatmap, and a live activity sidebar. Numbers come from
// insights-service GET /api/v1/stats and refresh automatically whenever a new live activity entry arrives.
// The "Printable report" button opens the Flask/Jinja2 /report page.
import { useEffect, useState } from 'react';
import { Alert, Box, Button, Grid, Paper, Skeleton, Stack, Typography } from '@mui/material';
import CallMergeIcon from '@mui/icons-material/CallMerge';
import CampaignIcon from '@mui/icons-material/Campaign';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import GroupsIcon from '@mui/icons-material/Groups';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ScheduleIcon from '@mui/icons-material/Schedule';
import SpeedIcon from '@mui/icons-material/Speed';
import { useDispatch, useSelector } from 'react-redux';
import api, { readErrorMessage } from '../../app/api';
import { INSIGHTS_URL } from '../../app/config';
import { formatDuration } from '../../app/format';
import { RESOLVED_COLOR, STATUS_COLORS, TYPE_COLORS, VOLUNTEER_COLOR } from '../../app/theme';
import { STATUS_LABELS, STATUSES, TYPE_LABELS } from '../requests/requestConstants';
import { fetchRequests } from '../requests/requestsSlice';
import ActivityFeed from './ActivityFeed';
import HotspotMap from './HotspotMap';
import KpiCard from './KpiCard';
import StatChart from './StatChart';

// recharts wants [{ name, count }]; the API sends { RESCUE: 4, ... }. Labels replace the codes on the axis.
function toChartData(countsByKey, labels) {
  return Object.entries(countsByKey).map(([key, count]) => ({ name: labels[key] || key, count }));
}

// Same keys, but colour by the label shown on the axis
function colorsByLabel(colors, labels) {
  return Object.fromEntries(Object.entries(colors).map(([key, color]) => [labels[key], color]));
}

const AREA_SERIES = STATUSES.map((status) => ({ key: status, name: STATUS_LABELS[status], color: STATUS_COLORS[status] }));

function DashboardSkeleton() {
  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Skeleton width={260} height={40} />
      <Grid container spacing={2} sx={{ mt: 1 }}>
        {[1, 2, 3, 4, 5, 6].map((key) => (
          <Grid item xs={6} sm={4} lg={2} key={key}><Skeleton variant="rounded" height={110} /></Grid>
        ))}
        <Grid item xs={12} md={6}><Skeleton variant="rounded" height={300} /></Grid>
        <Grid item xs={12} md={6}><Skeleton variant="rounded" height={300} /></Grid>
      </Grid>
    </Box>
  );
}

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const loaded = useSelector((state) => state.requests.loaded);
  const onlineCount = useSelector((state) => state.live.onlineCount);
  // The newest activity entry changes on every live event, which is our signal to refresh
  const latestActivityId = useSelector((state) => state.live.activity[0]?._id);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  // The heatmap draws from the shared request list
  useEffect(() => {
    if (!loaded) dispatch(fetchRequests());
  }, [loaded, dispatch]);

  useEffect(() => {
    api.get(`${INSIGHTS_URL}/api/v1/stats`)
      .then((response) => {
        setStats(response.data);
        setError('');
      })
      .catch((loadError) => setError(readErrorMessage(loadError)));
  }, [latestActivityId]);

  if (!stats) {
    return error ? <Box sx={{ p: 3 }}><Alert severity="error">{error}</Alert></Box> : <DashboardSkeleton />;
  }

  const areaData = stats.areaBreakdown.map((row) => ({ name: row.area, OPEN: row.OPEN, CLAIMED: row.CLAIMED, RESOLVED: row.RESOLVED }));
  const resolveByArea = stats.areaBreakdown
    .filter((row) => row.averageResolveMinutes !== null)
    .map((row) => ({ name: row.area, count: row.averageResolveMinutes }));

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} sx={{ mb: 2.5 }}>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5">Insights dashboard</Typography>
          <Typography variant="body2" color="text.secondary">Updates by itself whenever something happens.</Typography>
        </Box>
        {/* A normal link can't send headers, so the report reads the JWT from the URL */}
        <Button variant="outlined" endIcon={<OpenInNewIcon />} href={`${INSIGHTS_URL}/report?token=${token}`} target="_blank" rel="noreferrer">
          Printable report
        </Button>
      </Stack>
      {error && <Alert severity="warning" sx={{ mb: 2 }}>Showing the last numbers we received: {error}</Alert>}

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={4} lg={2}>
          <KpiCard icon={CampaignIcon} label="Total requests" value={stats.totalRequests} color="#60a5fa"
            hint={`${stats.requestsByStatus.OPEN} open now`} />
        </Grid>
        <Grid item xs={6} sm={4} lg={2}>
          <KpiCard icon={ScheduleIcon} label="Avg. time to resolve" color={RESOLVED_COLOR}
            text={formatDuration(stats.averageResolveMinutes)} hint={`${stats.requestsByStatus.RESOLVED} resolved`} />
        </Grid>
        <Grid item xs={6} sm={4} lg={2}>
          <KpiCard icon={SpeedIcon} label="Average priority" value={stats.averagePriority} decimals={1}
            color={TYPE_COLORS.RESCUE} hint="0 to 100" />
        </Grid>
        <Grid item xs={6} sm={4} lg={2}>
          <KpiCard icon={CallMergeIcon} label="Duplicates caught" value={stats.duplicatesCaught} color={TYPE_COLORS.MEDICINE}
            hint={`${stats.duplicatesMerged} merged · ${stats.totalAnalyses} analyzed`} />
        </Grid>
        <Grid item xs={6} sm={4} lg={2}>
          <KpiCard icon={GroupsIcon} label="Volunteers online" value={onlineCount} color={VOLUNTEER_COLOR} hint="right now" />
        </Grid>
        <Grid item xs={6} sm={4} lg={2}>
          <KpiCard icon={DirectionsRunIcon} label="Claimed, in progress" value={stats.requestsByStatus.CLAIMED}
            color={STATUS_COLORS.CLAIMED} hint="a volunteer is on it" />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={9}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <StatChart title="Requests by type" data={toChartData(stats.requestsByType, TYPE_LABELS)}
                categoryColors={colorsByLabel(TYPE_COLORS, TYPE_LABELS)} />
            </Grid>
            <Grid item xs={12} md={6}>
              <StatChart title="Requests by status" data={toChartData(stats.requestsByStatus, STATUS_LABELS)}
                categoryColors={colorsByLabel(STATUS_COLORS, STATUS_LABELS)} />
            </Grid>
            <Grid item xs={12}>
              <StatChart title="Requests by area" subtitle="Busiest areas first, split by status"
                data={areaData} series={AREA_SERIES} stacked horizontal height={Math.max(220, areaData.length * 40)} />
            </Grid>
            <Grid item xs={12} md={6}>
              {resolveByArea.length > 0 ? (
                <StatChart title="Average time to resolve, by area" subtitle="From posting to resolved"
                  data={resolveByArea} horizontal height={Math.max(220, resolveByArea.length * 40)}
                  series={[{ key: 'count', name: 'Minutes', color: RESOLVED_COLOR }]}
                  valueFormatter={(minutes) => formatDuration(minutes)} />
              ) : (
                <Paper variant="elevation" sx={{ p: 2, height: '100%' }}>
                  <Typography variant="subtitle1" fontWeight={700}>Average time to resolve, by area</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Appears once the first request is resolved.</Typography>
                </Paper>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              <HotspotMap />
            </Grid>
          </Grid>
        </Grid>
        {/* The sidebar stays in view while the charts scroll on wide screens */}
        <Grid item xs={12} lg={3}>
          <Box sx={{ position: { lg: 'sticky' }, top: 16, height: { xs: 420, lg: 'calc(100vh - 220px)' } }}>
            <ActivityFeed />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

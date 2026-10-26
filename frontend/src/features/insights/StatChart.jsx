// [Person 3 – insights] One reusable bar chart (recharts) for the admin dashboard, styled for the dark theme.
// - One series: bars can take a colour per category (e.g. each help type in its own colour), and the category is
//   always named on the axis, so meaning never depends on colour alone.
// - Several series (stacked): e.g. open / claimed / resolved per area, with a legend.
// Hovering a bar shows its exact value.
import { Paper, Typography } from '@mui/material';
import { Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const DEFAULT_SERIES = [{ key: 'count', name: 'Requests', color: '#60a5fa' }];
const AXIS_TICK = { fontSize: 12, fill: '#94a3b8' };
const GRID_COLOR = 'rgba(148, 163, 184, 0.12)';
const TOOLTIP_STYLE = {
  contentStyle: { background: '#1e293b', border: '1px solid rgba(148, 163, 184, 0.25)', borderRadius: 8 },
  labelStyle: { color: '#e5e7eb', fontWeight: 600 },
  itemStyle: { color: '#e5e7eb' },
  cursor: { fill: 'rgba(96, 165, 250, 0.08)' },
};

// horizontal=true puts categories on the left, which fits long area names like "West Mambalam"
export default function StatChart({
  title, subtitle, data, series = DEFAULT_SERIES, categoryColors, stacked = false, horizontal = false, height = 260, valueFormatter,
}) {
  const lastKey = series[series.length - 1].key;
  // Only the outer end of a bar (or of the top segment of a stack) gets rounded corners
  const radiusFor = (key) => {
    if (stacked && key !== lastKey) return 0;
    return horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0];
  };

  return (
    <Paper variant="elevation" sx={{ p: 2, height: '100%' }}>
      <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
      {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout={horizontal ? 'vertical' : 'horizontal'} margin={{ top: 12, left: horizontal ? 8 : -12, right: 16 }}>
          <CartesianGrid stroke={GRID_COLOR} vertical={horizontal} horizontal={!horizontal} />
          {horizontal ? (
            <>
              <XAxis type="number" allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={110} tick={AXIS_TICK} axisLine={false} tickLine={false} />
            </>
          ) : (
            <>
              <XAxis dataKey="name" tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} width={40} tick={AXIS_TICK} axisLine={false} tickLine={false} />
            </>
          )}
          <Tooltip {...TOOLTIP_STYLE} formatter={valueFormatter} />
          {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} iconType="circle" iconSize={8} />}
          {series.map((item) => (
            <Bar key={item.key} dataKey={item.key} name={item.name} fill={item.color} maxBarSize={36}
              stackId={stacked ? 'stack' : undefined} radius={radiusFor(item.key)}>
              {categoryColors && data.map((row) => <Cell key={row.name} fill={categoryColors[row.name] || item.color} />)}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
}

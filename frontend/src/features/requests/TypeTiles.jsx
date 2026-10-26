// [Person 2 – requests] The four big "what kind of help?" tiles on step 1 of the post form. Big targets with an
// icon, a name and a one-line hint are faster to hit than a dropdown, especially on a phone in a hurry.
import { ButtonBase, Grid, Stack, Typography } from '@mui/material';
import { TYPE_COLORS } from '../../app/theme';
import { REQUEST_TYPES, TYPE_HINTS, TYPE_LABELS } from './requestConstants';
import TypeIcon from './TypeIcon';

export default function TypeTiles({ value, onChange }) {
  return (
    <Grid container spacing={1.5} role="radiogroup" aria-label="Type of help">
      {REQUEST_TYPES.map((type) => {
        const selected = value === type;
        const color = TYPE_COLORS[type];
        return (
          <Grid item xs={6} key={type}>
            <ButtonBase role="radio" aria-checked={selected} onClick={() => onChange(type)} focusRipple
              sx={{
                width: '100%', height: '100%', p: 2, borderRadius: 3, textAlign: 'left', justifyContent: 'flex-start',
                border: `2px solid ${selected ? color : 'rgba(148, 163, 184, 0.18)'}`,
                bgcolor: selected ? `${color}1f` : 'rgba(148, 163, 184, 0.04)',
                transition: 'border-color 0.15s, background-color 0.15s',
                '&:hover': { borderColor: color },
              }}>
              <Stack spacing={1}>
                <TypeIcon type={type} sx={{ fontSize: 34, color }} />
                <Typography variant="subtitle1" fontWeight={700}>{TYPE_LABELS[type]}</Typography>
                <Typography variant="caption" color="text.secondary">{TYPE_HINTS[type]}</Typography>
              </Stack>
            </ButtonBase>
          </Grid>
        );
      })}
    </Grid>
  );
}
